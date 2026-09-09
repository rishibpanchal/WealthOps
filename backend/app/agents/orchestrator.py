import asyncio
import json
import time
import uuid
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END
from sqlalchemy import select
from app.core.security import UserRole
from app.core.exceptions import UnauthorizedToolAccessError, GuardrailViolationError
from app.db.database import AsyncSessionLocal
from app.db.models import WorkflowRun, AgentStep, ToolExecution, ApprovalRequest, AuditLog, Client
from app.agents.state import AgentState, StepEvent
from app.agents.llm_provider import get_llm_provider
from app.tools.registry import tool_registry
from app.rag.policy_store import policy_knowledge_service
from app.guardrails.engine import guardrails


class WealthOpsOrchestrator:
    def __init__(self):
        self.llm = get_llm_provider()
        self.graph = self._build_graph()

    def _build_graph(self):
        builder = StateGraph(AgentState)

        # Register nodes
        builder.add_node("classify_intent", self.classify_intent_node)
        builder.add_node("plan_workflow", self.plan_workflow_node)
        builder.add_node("retrieve_policy_context", self.retrieve_policy_context_node)
        builder.add_node("execute_financial_tools", self.execute_financial_tools_node)
        builder.add_node("evaluate_guardrails", self.evaluate_guardrails_node)
        builder.add_node("record_audit", self.record_audit_node)
        builder.add_node("synthesize_response", self.synthesize_response_node)

        # Define edge transitions
        builder.set_entry_point("classify_intent")
        builder.add_edge("classify_intent", "plan_workflow")
        builder.add_edge("plan_workflow", "retrieve_policy_context")
        builder.add_edge("retrieve_policy_context", "execute_financial_tools")
        builder.add_edge("execute_financial_tools", "evaluate_guardrails")
        builder.add_edge("evaluate_guardrails", "record_audit")
        builder.add_edge("record_audit", "synthesize_response")
        builder.add_edge("synthesize_response", END)

        return builder.compile()

    # Node 1: Intent Classification
    async def classify_intent_node(self, state: AgentState) -> Dict[str, Any]:
        start = time.perf_counter()
        req = state["original_request"]
        res = await self.llm.classify_intent(req)

        dur = (time.perf_counter() - start) * 1000.0
        step_event: StepEvent = {
            "step_order": 1,
            "node_name": "classify_intent",
            "title": "Intent & Entity Classification",
            "status": "COMPLETED",
            "summary": f"Identified intent '{res['intent']}' (confidence: {res['confidence'] * 100:.0f}%)" + (f" for client {res['client_id']}" if res['client_id'] else ""),
            "details": res,
            "duration_ms": round(dur, 2),
        }

        steps = list(state.get("steps_log", []))
        steps.append(step_event)

        return {
            "intent": res["intent"],
            "client_id": res["client_id"] or state.get("client_id"),
            "confidence": res["confidence"],
            "steps_log": steps,
        }

    # Node 2: Multi-step Planner
    async def plan_workflow_node(self, state: AgentState) -> Dict[str, Any]:
        start = time.perf_counter()
        intent = state.get("intent", "PORTFOLIO_LOOKUP")
        client_id = state.get("client_id")

        plan = await self.llm.generate_plan(intent, client_id, state["original_request"])
        tools = [step["tool"] for step in plan if "tool" in step]

        dur = (time.perf_counter() - start) * 1000.0
        step_event: StepEvent = {
            "step_order": 2,
            "node_name": "plan_workflow",
            "title": "Dynamic Workflow Planning",
            "status": "COMPLETED",
            "summary": f"Formulated {len(plan)}-step controlled operational workflow for {intent}",
            "details": {"plan": plan, "selected_tools": tools},
            "duration_ms": round(dur, 2),
        }

        steps = list(state.get("steps_log", []))
        steps.append(step_event)

        return {
            "plan": plan,
            "selected_tools": tools,
            "steps_log": steps,
        }

    # Node 3: Policy & RAG Retrieval
    async def retrieve_policy_context_node(self, state: AgentState) -> Dict[str, Any]:
        start = time.perf_counter()
        req = state["original_request"]
        intent = state.get("intent", "")

        search_query = req
        if intent == "REBALANCE_RECOMMENDATION":
            search_query += " rebalancing limits SOP dual approval"
        elif intent == "RISK_ANALYSIS":
            search_query += " VaR Sharpe drawdown risk limits"

        docs = await policy_knowledge_service.retrieve_relevant_policies(search_query, top_k=2)

        dur = (time.perf_counter() - start) * 1000.0
        summary_titles = [d["title"] for d in docs]
        step_event: StepEvent = {
            "step_order": 3,
            "node_name": "retrieve_policy_context",
            "title": "Policy Knowledge & RAG Grounding",
            "status": "COMPLETED",
            "summary": f"Retrieved {len(docs)} applicable institutional documents: {', '.join(summary_titles[:2])}",
            "details": {"documents": docs},
            "duration_ms": round(dur, 2),
        }

        steps = list(state.get("steps_log", []))
        steps.append(step_event)

        return {
            "retrieved_context": docs,
            "steps_log": steps,
        }

    # Node 4: Financial Tool Execution with RBAC
    async def execute_financial_tools_node(self, state: AgentState) -> Dict[str, Any]:
        start = time.perf_counter()
        intent = state.get("intent", "PORTFOLIO_LOOKUP")
        client_id = state.get("client_id")
        user_role_str = state.get("user_role", "OPERATIONS_ANALYST")
        user_role = UserRole(user_role_str)

        tool_results = {}
        steps = list(state.get("steps_log", []))

        async with AsyncSessionLocal() as session:
            # Special case: Exception monitor across all clients
            if intent == "PORTFOLIO_EXCEPTION_ANALYSIS":
                res = await session.execute(select(Client).where(Client.status == "ACTIVE"))
                clients = res.scalars().all()
                breached = []
                for c in clients:
                    try:
                        p_check = await tool_registry.execute_tool("check_policy", user_role, {"client_id": c.id}, session=session)
                        if p_check["status"] == "SUCCESS" and p_check["result"]["status"] == "BREACH":
                            breach_details = p_check["result"]["breaches"]
                            b_text = ", ".join([f"{b['asset_class']} ({b['current_pct']}% vs max {b.get('permitted_max_pct', 'limit')}%)" for b in breach_details])
                            breached.append({
                                "client_id": c.id,
                                "client_name": c.name,
                                "breach_summary": b_text,
                                "breaches": breach_details,
                            })
                    except Exception:
                        pass

                tool_results["total_checked"] = len(clients)
                tool_results["breached_clients"] = breached

            else:
                # Default targeted client workflow
                target_client = client_id or "C1024"  # Default to flagship account if not specified

                # Execute get_client_profile
                try:
                    c_prof = await tool_registry.execute_tool("get_client_profile", user_role, {"client_id": target_client}, session=session)
                    tool_results["get_client_profile"] = c_prof
                except Exception as exc:
                    tool_results["get_client_profile"] = {"status": "ERROR", "error": str(exc)}

                # Execute get_portfolio
                try:
                    c_port = await tool_registry.execute_tool("get_portfolio", user_role, {"client_id": target_client}, session=session)
                    tool_results["get_portfolio"] = c_port
                except Exception as exc:
                    tool_results["get_portfolio"] = {"status": "ERROR", "error": str(exc)}

                # Execute calculate_allocation
                try:
                    c_alloc = await tool_registry.execute_tool("calculate_allocation", user_role, {"client_id": target_client}, session=session)
                    tool_results["calculate_allocation"] = c_alloc
                except Exception as exc:
                    tool_results["calculate_allocation"] = {"status": "ERROR", "error": str(exc)}

                # Execute check_policy
                try:
                    c_pol = await tool_registry.execute_tool("check_policy", user_role, {"client_id": target_client}, session=session)
                    tool_results["check_policy"] = c_pol
                except Exception as exc:
                    tool_results["check_policy"] = {"status": "ERROR", "error": str(exc)}

                # If risk analysis, compute VaR and Sharpe
                if intent in ["RISK_ANALYSIS", "PORTFOLIO_RISK_ANALYSIS", "REPORT_GENERATION"]:
                    try:
                        c_var = await tool_registry.execute_tool("calculate_var", user_role, {"client_id": target_client}, session=session)
                        tool_results["calculate_var"] = c_var
                        c_sharpe = await tool_registry.execute_tool("calculate_sharpe", user_role, {"client_id": target_client}, session=session)
                        tool_results["calculate_sharpe"] = c_sharpe
                    except Exception:
                        pass

                # If rebalance recommendation, execute create_rebalance_recommendation
                if intent == "REBALANCE_RECOMMENDATION":
                    try:
                        c_rebal = await tool_registry.execute_tool("create_rebalance_recommendation", user_role, {"client_id": target_client}, session=session)
                        tool_results["create_rebalance_recommendation"] = c_rebal
                    except UnauthorizedToolAccessError as rbac_err:
                        tool_results["create_rebalance_recommendation"] = {
                            "status": "BLOCKED_BY_RBAC",
                            "error": str(rbac_err),
                        }

        dur = (time.perf_counter() - start) * 1000.0
        step_event: StepEvent = {
            "step_order": 4,
            "node_name": "execute_financial_tools",
            "title": "Authorized Financial Tool Execution",
            "status": "COMPLETED",
            "summary": f"Executed domain tools for intent {intent} with role authorization '{user_role.value}'",
            "details": tool_results,
            "duration_ms": round(dur, 2),
        }
        steps.append(step_event)

        return {
            "tool_results": tool_results,
            "steps_log": steps,
        }

    # Node 5: Deterministic Guardrails & Approval Routing
    async def evaluate_guardrails_node(self, state: AgentState) -> Dict[str, Any]:
        start = time.perf_counter()
        intent = state.get("intent", "")
        client_id = state.get("client_id") or "C1024"
        user_role = UserRole(state.get("user_role", "OPERATIONS_ANALYST"))
        tool_results = state.get("tool_results", {})

        requires_approval = False
        approval_id = None
        risk_level = "LOW"
        guardrail_reasons = []

        if intent == "REBALANCE_RECOMMENDATION":
            rebal_res = tool_results.get("create_rebalance_recommendation", {}).get("result", {})
            tot_usd = rebal_res.get("total_rebalance_amount_usd", 0.0)
            recs = rebal_res.get("recommendations", [])
            max_drift = max([r.get("adjustment_pct", 0.0) for r in recs], default=0.0)

            eval_res = guardrails.evaluate_rebalance_risk(tot_usd, max_drift, user_role)
            requires_approval = eval_res["requires_approval"]
            risk_level = eval_res["risk_level"]
            guardrail_reasons = eval_res["reasons"]

            if requires_approval:
                async with AsyncSessionLocal() as session:
                    reason_str = "; ".join(guardrail_reasons)
                    app_res = await tool_registry.execute_tool(
                        "request_approval",
                        user_role,
                        {
                            "client_id": client_id,
                            "action_type": "REBALANCE_RECOMMENDATION",
                            "reason": f"Automated rebalance exceeds threshold: {reason_str}",
                            "estimated_value": tot_usd,
                            "proposed_payload": json.dumps(rebal_res),
                            "requested_by_user_id": state.get("user_id", "usr_ops_01"),
                            "requested_by_role": user_role.value,
                        },
                        session=session,
                    )
                    if app_res["status"] == "SUCCESS":
                        approval_id = app_res["result"]["approval_id"]

        elif intent == "TRANSACTION_REQUEST":
            requires_approval = True
            risk_level = "HIGH"
            guardrail_reasons.append("Direct execution of transactions prohibited. Must be queued for Risk Officer approval.")

        dur = (time.perf_counter() - start) * 1000.0
        step_status = "WARNING" if requires_approval else "COMPLETED"
        step_event: StepEvent = {
            "step_order": 5,
            "node_name": "evaluate_guardrails",
            "title": "Deterministic Guardrails & Policy Gates",
            "status": step_status,
            "summary": "Mandatory Human Approval Queue Triggered" if requires_approval else "Passed all deterministic safety and fiduciary constraints",
            "details": {
                "requires_approval": requires_approval,
                "approval_id": approval_id,
                "risk_level": risk_level,
                "reasons": guardrail_reasons,
            },
            "duration_ms": round(dur, 2),
        }

        steps = list(state.get("steps_log", []))
        steps.append(step_event)

        return {
            "approval_required": requires_approval,
            "approval_id": approval_id,
            "approval_status": "PENDING" if requires_approval else None,
            "risk_level": risk_level,
            "validation_result": {
                "requires_approval": requires_approval,
                "reasons": guardrail_reasons,
                "approval_id": approval_id,
            },
            "steps_log": steps,
        }

    # Node 6: Immutable Audit Trail Logging
    async def record_audit_node(self, state: AgentState) -> Dict[str, Any]:
        start = time.perf_counter()
        req_id = f"req_{uuid.uuid4().hex[:8]}"

        tools_used = list(state.get("tool_results", {}).keys())
        policies = [d.get("title", "") for d in state.get("retrieved_context", [])]
        decision = "APPROVAL_REQUIRED" if state.get("approval_required") else "COMPLIANT_PROCESSED"

        async with AsyncSessionLocal() as session:
            audit = AuditLog(
                request_id=req_id,
                workflow_run_id=state.get("run_id"),
                user_id=state.get("user_id", "usr_ops_01"),
                user_role=state.get("user_role", "OPERATIONS_ANALYST"),
                action=state.get("intent", "UNKNOWN_ACTION"),
                intent=state.get("intent"),
                client_id=state.get("client_id"),
                tools_used=json.dumps(tools_used),
                policy_references=json.dumps(policies),
                decision=decision,
                status="SUCCESS",
                metadata_json=json.dumps({
                    "risk_level": state.get("risk_level", "LOW"),
                    "approval_id": state.get("approval_id"),
                }),
            )
            session.add(audit)
            await session.commit()
            audit_id = audit.id

        dur = (time.perf_counter() - start) * 1000.0
        step_event: StepEvent = {
            "step_order": 6,
            "node_name": "record_audit",
            "title": "Immutable Compliance Audit Trail",
            "status": "COMPLETED",
            "summary": f"Audit record #{audit_id[:8]} written to immutable ledger",
            "details": {"audit_id": audit_id, "request_id": req_id, "decision": decision},
            "duration_ms": round(dur, 2),
        }

        steps = list(state.get("steps_log", []))
        steps.append(step_event)

        return {
            "audit_id": audit_id,
            "steps_log": steps,
        }

    # Node 7: Response Synthesis
    async def synthesize_response_node(self, state: AgentState) -> Dict[str, Any]:
        resp = await self.llm.synthesize_response(
            query=state["original_request"],
            intent=state.get("intent", ""),
            client_id=state.get("client_id"),
            tool_results=state.get("tool_results", {}),
            policy_context=state.get("retrieved_context", []),
            guardrail_evaluation=state.get("validation_result", {}),
        )
        return {"final_response": resp}

    async def run(
        self,
        request: str,
        user_id: str = "usr_ops_01",
        user_role: str = "OPERATIONS_ANALYST",
        client_id: Optional[str] = None,
    ) -> AgentState:
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        initial_state: AgentState = {
            "user_id": user_id,
            "user_role": user_role,
            "original_request": request,
            "run_id": run_id,
            "intent": None,
            "confidence": 1.0,
            "client_id": client_id,
            "plan": [],
            "retrieved_context": [],
            "selected_tools": [],
            "tool_results": {},
            "risk_level": "LOW",
            "proposed_action": None,
            "validation_result": {},
            "approval_required": False,
            "approval_id": None,
            "approval_status": None,
            "final_response": "",
            "steps_log": [],
            "audit_id": None,
            "error": None,
        }

        final_state = await self.graph.ainvoke(initial_state)
        return final_state


agent_orchestrator = WealthOpsOrchestrator()
