from typing import Dict, Any, Optional, List
from sqlalchemy import select
from app.core.config import settings
from app.core.security import UserRole, ROLE_PERMISSIONS, Permission
from app.core.exceptions import (
    UnauthorizedToolAccessError,
    GuardrailViolationError,
    PolicyMissingError,
    ClientNotFoundError,
    InsufficientConfidenceError,
)
from app.db.models import Client, InvestmentPolicy, ApprovalRequest


class GuardrailEngine:
    """
    Deterministic rule engine that validates and constrains agent operations.
    Security and fiduciary policies are enforced deterministically outside LLM influence.
    """

    @staticmethod
    def validate_tool_authorization(tool_name: str, user_role: UserRole, allowed_roles: List[UserRole]):
        """Deterministically blocks execution if role lacks permission."""
        if user_role not in allowed_roles:
            raise UnauthorizedToolAccessError(
                tool_name=tool_name,
                user_role=user_role.value,
                allowed_roles=[r.value for r in allowed_roles],
            )

    @staticmethod
    async def validate_client_and_policy(client_id: Optional[str], session) -> Dict[str, Any]:
        """Ensures client exists and has an active approved IPS before any analysis/rebalance."""
        if not client_id:
            raise GuardrailViolationError("Client ID must be specified for portfolio operations.")

        # Check client
        res = await session.execute(select(Client).where(Client.id == client_id))
        client = res.scalars().first()
        if not client:
            raise ClientNotFoundError(client_id)

        if client.status == "RESTRICTED":
            raise GuardrailViolationError(f"Client {client_id} is marked as RESTRICTED. Operational actions are locked.")

        # Check IPS policy
        p_res = await session.execute(select(InvestmentPolicy).where(InvestmentPolicy.client_id == client_id))
        policy = p_res.scalars().first()
        if not policy:
            raise PolicyMissingError(client_id)

        return {"client": client, "policy": policy}

    @staticmethod
    def validate_confidence(confidence: float, threshold: Optional[float] = None):
        """Escalates to human reviewer if classification or plan confidence is low."""
        thresh = threshold or settings.CONFIDENCE_THRESHOLD
        if confidence < thresh:
            raise InsufficientConfidenceError(confidence=confidence, threshold=thresh)

    @staticmethod
    def evaluate_rebalance_risk(
        total_amount_usd: float,
        max_adjustment_pct: float,
        user_role: UserRole,
    ) -> Dict[str, Any]:
        """
        Determines whether a proposed rebalance can be executed or MUST be routed
        to the Risk Officer for formal sign-off.
        """
        reasons = []
        is_sensitive = False

        limit_val = getattr(settings, "MAX_TRANSACTION_VALUE_INR", settings.MAX_TRANSACTION_VALUE_USD)
        if total_amount_usd > limit_val:
            from app.agents.llm_provider import format_inr
            reasons.append(f"Estimated value ({format_inr(total_amount_usd)}) exceeds threshold ({format_inr(limit_val)})")
            is_sensitive = True

        if max_adjustment_pct > settings.MAX_REBALANCE_CHANGE_PCT:
            reasons.append(f"Asset class shift ({max_adjustment_pct:.1f}%) exceeds permitted threshold ({settings.MAX_REBALANCE_CHANGE_PCT:.1f}%)")
            is_sensitive = True

        # Roles other than RISK_OFFICER or ADMIN cannot auto-execute rebalances under any circumstance
        if user_role not in [UserRole.RISK_OFFICER, UserRole.ADMIN]:
            reasons.append(f"Role '{user_role.value}' does not possess direct execution authority for rebalance orders.")
            is_sensitive = True

        return {
            "requires_approval": is_sensitive,
            "risk_level": "HIGH" if (total_amount_usd > 250000 or max_adjustment_pct > 10.0) else ("MEDIUM" if is_sensitive else "LOW"),
            "reasons": reasons,
            "can_auto_execute": not is_sensitive and user_role in [UserRole.RISK_OFFICER, UserRole.ADMIN],
        }

    @staticmethod
    async def verify_approved_ticket(approval_id: str, session) -> ApprovalRequest:
        """Verifies an approval request is in APPROVED status prior to trade execution."""
        res = await session.execute(select(ApprovalRequest).where(ApprovalRequest.id == approval_id))
        approval = res.scalars().first()
        if not approval:
            raise GuardrailViolationError(f"Approval ticket '{approval_id}' not found.")
        if approval.status != "APPROVED":
            raise GuardrailViolationError(f"Approval ticket '{approval_id}' is currently '{approval.status}'. Cannot execute without APPROVED status.")
        return approval


guardrails = GuardrailEngine()
