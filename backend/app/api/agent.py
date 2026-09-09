from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from app.core.security import get_current_user, CurrentUser, UserRole
from app.agents.orchestrator import agent_orchestrator


router = APIRouter(prefix="/agent", tags=["Agent Orchestrator"])


class AgentRunRequest(BaseModel):
    query: str
    client_id: Optional[str] = None


@router.post("/run")
async def run_agent(
    req: AgentRunRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Execute natural language request through LangGraph multi-step agent orchestrator.
    Enforces user role RBAC, deterministic guardrails, and immutable audit logging.
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    state = await agent_orchestrator.run(
        request=req.query,
        user_id=current_user.user_id,
        user_role=current_user.role.value,
        client_id=req.client_id,
    )

    return {
        "run_id": state["run_id"],
        "user_id": state["user_id"],
        "user_role": state["user_role"],
        "query": state["original_request"],
        "intent": state["intent"],
        "confidence": state["confidence"],
        "client_id": state["client_id"],
        "plan": state["plan"],
        "steps": state["steps_log"],
        "retrieved_policies": state["retrieved_context"],
        "tool_results": state["tool_results"],
        "validation": state["validation_result"],
        "approval_required": state["approval_required"],
        "approval_id": state["approval_id"],
        "risk_level": state["risk_level"],
        "final_response": state["final_response"],
        "audit_id": state["audit_id"],
    }
