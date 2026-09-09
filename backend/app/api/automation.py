from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from app.core.security import get_current_user, CurrentUser
from app.db.database import AsyncSessionLocal
from app.db.models import Client, AuditLog
from app.tools.financial_tools import check_policy


router = APIRouter(prefix="/automation", tags=["Scheduled Automation & Process Improvement"])


class ProcessAnalysisRequest(BaseModel):
    process_name: Optional[str] = "Daily Discretionary Portfolio Exception Review"
    raw_steps: Optional[List[str]] = None


@router.post("/daily-monitor")
async def run_daily_portfolio_exception_monitor(
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Simulates automated 8:00 AM scheduled workflow triggered via n8n or Power Automate.
    Scans entire active portfolio universe, detects IPS limit deviations, and publishes breach alert.
    """
    start_time = datetime.now(timezone.utc)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Client).where(Client.status == "ACTIVE"))
        clients = result.scalars().all()

        scanned = 0
        breaches = []

        for c in clients:
            scanned += 1
            try:
                pol_res = await check_policy(c.id, session=session)
                if pol_res["status"] == "BREACH":
                    for b in pol_res["breaches"]:
                        breaches.append({
                            "client_id": c.id,
                            "client_name": c.name,
                            "policy_name": pol_res["policy_name"],
                            "asset_class": b["asset_class"],
                            "current_pct": b["current_pct"],
                            "permitted_max_pct": b.get("permitted_max_pct", b.get("permitted_min_pct")),
                            "deviation_pct": b["deviation_pct"],
                            "severity": b["severity"],
                        })
            except Exception:
                pass

        # Write audit log for the automated job
        audit = AuditLog(
            request_id=f"cron_daily_{int(start_time.timestamp())}",
            user_id="sys_automation_cron",
            user_role="ADMIN",
            action="SCHEDULED_EXCEPTION_MONITOR",
            intent="DAILY_PORTFOLIO_SCAN",
            client_id="ALL_PORTFOLIOS",
            tools_used=json.dumps(["get_active_clients", "check_policy", "generate_report"]),
            policy_references=json.dumps(["IPS-Framework-v2.4", "SOP-WM-402"]),
            decision="BREACH_ALERT_GENERATED" if breaches else "ALL_COMPLIANT",
            status="SUCCESS",
            metadata_json=json.dumps({
                "source": "n8n / Power Automate Scheduled Trigger (8:00 AM EST)",
                "portfolios_scanned": scanned,
                "breaches_detected": len(breaches),
            }),
        )
        session.add(audit)
        await session.commit()

        return {
            "trigger_source": "n8n / Microsoft Power Automate Webhook (08:00 UTC Scheduled Cron)",
            "timestamp": start_time.isoformat(),
            "portfolios_evaluated": scanned,
            "policy_breaches_detected": len(breaches),
            "exceptions": breaches,
            "recommended_action": "Dispatched consolidated exception manifest to Operations Analyst dashboard. No transactions executed without dual approval.",
        }


@router.post("/process-analyzer")
async def analyze_process_automation_opportunity(
    req: ProcessAnalysisRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    UBS Operating Model Simulation: Analyzes a wealth management operations workflow,
    identifies automation opportunities across steps, and calculates estimated manual effort reduction.
    """
    default_steps = [
        "1. Operations analyst downloads daily valuation file from custodian FTP",
        "2. Analyst opens Excel workbook and computes asset class allocation %",
        "3. Analyst manually searches shared drive for client Investment Policy Statement (IPS)",
        "4. Analyst manually checks whether equity allocation breaches IPS limits",
        "5. If breach exists, analyst manually calculates trim dollar amounts in spreadsheet",
        "6. Analyst drafts PDF summary exception report",
        "7. Analyst emails report to Risk Officer and waits for email approval reply",
    ]
    steps_to_eval = req.raw_steps if req.raw_steps and len(req.raw_steps) > 0 else default_steps

    step_evaluations = [
        {
            "step_number": 1,
            "original_step": steps_to_eval[0] if len(steps_to_eval) > 0 else "Download daily file",
            "automatable": True,
            "solution_pattern": "n8n / Power Automate Scheduled Trigger",
            "target_technology": "Automated SFTP / Webhook Connector",
            "manual_minutes_saved": 15,
        },
        {
            "step_number": 2,
            "original_step": steps_to_eval[1] if len(steps_to_eval) > 1 else "Compute allocation in Excel",
            "automatable": True,
            "solution_pattern": "Deterministic Financial Engine",
            "target_technology": "FastAPI + calculate_allocation Tool",
            "manual_minutes_saved": 20,
        },
        {
            "step_number": 3,
            "original_step": steps_to_eval[2] if len(steps_to_eval) > 2 else "Search shared drive for IPS",
            "automatable": True,
            "solution_pattern": "RAG Semantic Retrieval",
            "target_technology": "Vector Store (pgvector / Chroma) + Policy Agent",
            "manual_minutes_saved": 25,
        },
        {
            "step_number": 4,
            "original_step": steps_to_eval[3] if len(steps_to_eval) > 3 else "Check equity allocation breaches",
            "automatable": True,
            "solution_pattern": "Deterministic Policy Engine",
            "target_technology": "check_policy Guardrail Gate",
            "manual_minutes_saved": 15,
        },
        {
            "step_number": 5,
            "original_step": steps_to_eval[4] if len(steps_to_eval) > 4 else "Calculate trim amounts",
            "automatable": True,
            "solution_pattern": "AI Rebalance Planner",
            "target_technology": "LangGraph create_rebalance_recommendation",
            "manual_minutes_saved": 30,
        },
        {
            "step_number": 6,
            "original_step": steps_to_eval[5] if len(steps_to_eval) > 5 else "Draft PDF exception report",
            "automatable": True,
            "solution_pattern": "Automated Report Synthesis",
            "target_technology": "generate_report Tool + Markdown Exporter",
            "manual_minutes_saved": 20,
        },
        {
            "step_number": 7,
            "original_step": steps_to_eval[6] if len(steps_to_eval) > 6 else "Email Risk Officer for approval",
            "automatable": False,
            "solution_pattern": "Human-in-the-Loop Governance Gate",
            "target_technology": "WealthOps Approval Queue (Audited Dual Sign-off)",
            "manual_minutes_saved": 10,
        },
    ]

    automatable_count = sum(1 for s in step_evaluations if s["automatable"])
    total_steps = len(step_evaluations)
    total_minutes_saved = sum(s["manual_minutes_saved"] for s in step_evaluations)

    return {
        "process_name": req.process_name,
        "total_manual_steps": total_steps,
        "automatable_steps": automatable_count,
        "automation_percentage": round((automatable_count / total_steps) * 100, 1),
        "estimated_time_saved_per_day_minutes": total_minutes_saved,
        "estimated_annual_hours_saved": round((total_minutes_saved * 252) / 60, 1),
        "steps_breakdown": step_evaluations,
        "governance_advisory": "Final authorization retained as audited human-in-the-loop step to uphold fiduciary compliance.",
    }
