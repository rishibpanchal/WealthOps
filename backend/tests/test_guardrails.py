import pytest
from app.core.security import UserRole
from app.core.exceptions import GuardrailViolationError, ClientNotFoundError
from app.guardrails.engine import guardrails
from app.db.database import AsyncSessionLocal, init_db
from app.db.seed import seed_database


@pytest.mark.asyncio
async def test_guardrail_rebalance_limits():
    # Test amount > $100k
    res = guardrails.evaluate_rebalance_risk(
        total_amount_usd=150000.0,
        max_adjustment_pct=3.0,
        user_role=UserRole.OPERATIONS_ANALYST,
    )
    assert res["requires_approval"] is True
    assert res["risk_level"] in ["MEDIUM", "HIGH"]

    # Test shift > 5%
    res2 = guardrails.evaluate_rebalance_risk(
        total_amount_usd=40000.0,
        max_adjustment_pct=7.2,
        user_role=UserRole.OPERATIONS_ANALYST,
    )
    assert res2["requires_approval"] is True

    # Analyst cannot auto-execute even if under threshold
    res3 = guardrails.evaluate_rebalance_risk(
        total_amount_usd=20000.0,
        max_adjustment_pct=2.0,
        user_role=UserRole.OPERATIONS_ANALYST,
    )
    assert res3["can_auto_execute"] is False


@pytest.mark.asyncio
async def test_guardrail_missing_client():
    await init_db()
    await seed_database()
    async with AsyncSessionLocal() as session:
        with pytest.raises(ClientNotFoundError):
            await guardrails.validate_client_and_policy("C9999_NONEXISTENT", session)
