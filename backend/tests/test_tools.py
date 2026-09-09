import pytest
from app.db.database import AsyncSessionLocal, init_db
from app.db.seed import seed_database
from app.tools.financial_tools import (
    calculate_allocation,
    check_policy,
    calculate_var,
    calculate_sharpe,
    create_rebalance_recommendation,
)


@pytest.mark.asyncio
async def test_financial_calculations_and_breach_detection():
    await init_db()
    await seed_database()

    async with AsyncSessionLocal() as session:
        # C1024 is deliberately seeded with 67.2% equity vs 60.0% max limit
        alloc = await calculate_allocation("C1024", session=session)
        assert alloc["total_value"] > 0
        assert "Equities" in alloc["allocation_pct"]
        assert alloc["allocation_pct"]["Equities"] > 60.0

        # Check policy
        pol = await check_policy("C1024", session=session)
        assert pol["status"] == "BREACH"
        assert pol["breach_count"] >= 1
        equity_breach = [b for b in pol["breaches"] if b["asset_class"] == "Equities"][0]
        assert equity_breach["current_pct"] > equity_breach["permitted_max_pct"]

        # Quantitative VaR & Sharpe
        var = await calculate_var("C1024", session=session)
        assert var["var_pct_1d"] > 0
        assert var["var_amount_usd"] > 0

        sharpe = await calculate_sharpe("C1024", session=session)
        assert sharpe["sharpe_ratio"] > 0

        # Rebalance recommendation
        rebal = await create_rebalance_recommendation("C1024", session=session)
        assert len(rebal["recommendations"]) > 0
        assert rebal["requires_human_approval"] is True
