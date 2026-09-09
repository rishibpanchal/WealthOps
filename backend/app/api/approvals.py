from datetime import datetime, timezone
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, desc
from app.core.security import get_current_user, CurrentUser, Permission, UserRole
from app.db.database import AsyncSessionLocal
from app.db.models import ApprovalRequest, AuditLog


router = APIRouter(prefix="/approvals", tags=["Human-in-the-Loop Approvals"])


class ApprovalActionRequest(BaseModel):
    note: Optional[str] = "Reviewed and authorized per SOP-WM-402"


@router.get("")
async def list_approvals(
    status_filter: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Retrieve queue of approval tickets pending human sign-off or historical records."""
    async with AsyncSessionLocal() as session:
        query = select(ApprovalRequest).order_by(desc(ApprovalRequest.created_at))
        if status_filter:
            query = query.where(ApprovalRequest.status == status_filter.upper())

        result = await session.execute(query)
        approvals = result.scalars().all()

        return [
            {
                "id": a.id,
                "workflow_run_id": a.workflow_run_id,
                "client_id": a.client_id,
                "action_type": a.action_type,
                "status": a.status,
                "risk_level": a.risk_level,
                "reason": a.reason,
                "estimated_value": a.estimated_value,
                "proposed_payload": json.loads(a.proposed_payload) if a.proposed_payload else {},
                "policy_reference": a.policy_reference,
                "requested_by_user_id": a.requested_by_user_id,
                "requested_by_role": a.requested_by_role,
                "resolved_by_user_id": a.resolved_by_user_id,
                "resolved_by_role": a.resolved_by_role,
                "resolution_note": a.resolution_note,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            }
            for a in approvals
        ]


@router.post("/{approval_id}/approve")
async def approve_request(
    approval_id: str,
    req: ApprovalActionRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Authorize a sensitive operational ticket (strictly requires RISK_OFFICER or ADMIN)."""
    # Deterministic RBAC enforcement: Only RISK_OFFICER or ADMIN can approve
    if not current_user.has_permission(Permission.APPROVAL_ACTION):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{current_user.role.value}' is unauthorized to approve financial operations tickets. Requires RISK_OFFICER or ADMIN.",
        )

    async with AsyncSessionLocal() as session:
        res = await session.execute(select(ApprovalRequest).where(ApprovalRequest.id == approval_id))
        approval = res.scalars().first()
        if not approval:
            raise HTTPException(status_code=404, detail="Approval ticket not found")

        if approval.status != "PENDING":
            raise HTTPException(status_code=400, detail=f"Ticket is already {approval.status}")

        approval.status = "APPROVED"
        approval.resolved_by_user_id = current_user.user_id
        approval.resolved_by_role = current_user.role.value
        approval.resolution_note = req.note
        approval.resolved_at = datetime.now(timezone.utc)

        # Write immutable audit event
        audit = AuditLog(
            request_id=f"appr_{approval_id[:8]}",
            workflow_run_id=approval.workflow_run_id,
            user_id=current_user.user_id,
            user_role=current_user.role.value,
            action="APPROVE_TICKET",
            intent="HUMAN_APPROVAL",
            client_id=approval.client_id,
            tools_used=json.dumps(["approve_request", "execute_simulated_trade"]),
            policy_references=json.dumps([approval.policy_reference or "Dual-Approval & Trading Authority Governance Policy"]),
            decision="APPROVED",
            status="SUCCESS",
            metadata_json=json.dumps({
                "approval_id": approval.id,
                "action_type": approval.action_type,
                "estimated_value": approval.estimated_value,
                "resolution_note": req.note,
            }),
        )
        session.add(audit)
        await session.commit()

        return {
            "status": "SUCCESS",
            "approval_id": approval.id,
            "ticket_status": "APPROVED",
            "approved_by": current_user.name,
            "role": current_user.role.value,
            "message": f"Ticket {approval.id} approved by {current_user.name}. Rebalancing orders authorized for simulated execution.",
        }


@router.post("/{approval_id}/reject")
async def reject_request(
    approval_id: str,
    req: ApprovalActionRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Reject a sensitive operational ticket (requires RISK_OFFICER or ADMIN)."""
    if not current_user.has_permission(Permission.APPROVAL_ACTION):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{current_user.role.value}' is unauthorized to resolve approval tickets.",
        )

    async with AsyncSessionLocal() as session:
        res = await session.execute(select(ApprovalRequest).where(ApprovalRequest.id == approval_id))
        approval = res.scalars().first()
        if not approval:
            raise HTTPException(status_code=404, detail="Approval ticket not found")

        approval.status = "REJECTED"
        approval.resolved_by_user_id = current_user.user_id
        approval.resolved_by_role = current_user.role.value
        approval.resolution_note = req.note or "Rejected by risk officer review"
        approval.resolved_at = datetime.now(timezone.utc)

        # Audit event
        audit = AuditLog(
            request_id=f"rej_{approval_id[:8]}",
            workflow_run_id=approval.workflow_run_id,
            user_id=current_user.user_id,
            user_role=current_user.role.value,
            action="REJECT_TICKET",
            intent="HUMAN_APPROVAL",
            client_id=approval.client_id,
            tools_used=json.dumps(["reject_request"]),
            policy_references=json.dumps([approval.policy_reference or "Dual-Approval & Trading Authority Governance Policy"]),
            decision="REJECTED",
            status="SUCCESS",
            metadata_json=json.dumps({
                "approval_id": approval.id,
                "reason": req.note,
            }),
        )
        session.add(audit)
        await session.commit()

        return {
            "status": "SUCCESS",
            "approval_id": approval.id,
            "ticket_status": "REJECTED",
            "rejected_by": current_user.name,
            "role": current_user.role.value,
        }
