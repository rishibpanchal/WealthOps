import json
from typing import Dict, Any, List, Optional
import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.security import UserRole
from app.core.exceptions import ClientNotFoundError, PolicyMissingError
from app.db.models import Client, Portfolio, Holding, InvestmentPolicy, ApprovalRequest
from app.tools.registry import tool_registry


@tool_registry.register(
    name="get_active_clients",
    description="Retrieve list of all active wealth management clients with AUM and risk profiles",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR, UserRole.VIEWER],
    risk_level="LOW",
)
async def get_active_clients(session) -> List[Dict[str, Any]]:
    result = await session.execute(select(Client).order_by(Client.id))
    clients = result.scalars().all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "risk_tolerance": c.risk_tolerance,
            "aum": c.aum,
            "status": c.status,
        }
        for c in clients
    ]


@tool_registry.register(
    name="get_client_profile",
    description="Retrieve comprehensive KYC profile, net worth, AUM, and risk profile for a specific client",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR, UserRole.VIEWER],
    risk_level="LOW",
)
async def get_client_profile(client_id: str, session) -> Dict[str, Any]:
    result = await session.execute(select(Client).where(Client.id == client_id))
    client = result.scalars().first()
    if not client:
        raise ClientNotFoundError(client_id)

    return {
        "id": client.id,
        "name": client.name,
        "email": client.email,
        "risk_tolerance": client.risk_tolerance,
        "net_worth": client.net_worth,
        "aum": client.aum,
        "advisor_id": client.advisor_id,
        "status": client.status,
    }


@tool_registry.register(
    name="get_portfolio",
    description="Retrieve total valuation, cash balance, and meta summary of client's portfolio",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR, UserRole.VIEWER],
    risk_level="LOW",
)
async def get_portfolio(client_id: str, session) -> Dict[str, Any]:
    result = await session.execute(
        select(Portfolio)
        .where(Portfolio.client_id == client_id)
        .options(selectinload(Portfolio.holdings))
    )
    portfolio = result.scalars().first()
    if not portfolio:
        raise ClientNotFoundError(client_id)

    return {
        "portfolio_id": portfolio.id,
        "client_id": portfolio.client_id,
        "total_value": portfolio.total_value,
        "cash_balance": portfolio.cash_balance,
        "currency": portfolio.currency,
        "holdings_count": len(portfolio.holdings),
        "last_rebalanced_at": portfolio.last_rebalanced_at.isoformat() if portfolio.last_rebalanced_at else None,
    }


@tool_registry.register(
    name="get_holdings",
    description="Retrieve individual security holdings with tickers, asset classes, quantities, prices, and weights",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR, UserRole.VIEWER],
    risk_level="LOW",
)
async def get_holdings(client_id: str, session) -> List[Dict[str, Any]]:
    result = await session.execute(
        select(Portfolio)
        .where(Portfolio.client_id == client_id)
        .options(selectinload(Portfolio.holdings))
    )
    portfolio = result.scalars().first()
    if not portfolio:
        raise ClientNotFoundError(client_id)

    return [
        {
            "ticker": h.ticker,
            "name": h.name,
            "asset_class": h.asset_class,
            "quantity": h.quantity,
            "current_price": h.current_price,
            "market_value": h.market_value,
            "weight_pct": h.weight_pct,
        }
        for h in portfolio.holdings
    ]


@tool_registry.register(
    name="get_market_price",
    description="Fetch live or end-of-day market price for a given ticker",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR, UserRole.VIEWER],
    risk_level="LOW",
)
async def get_market_price(ticker: str, session) -> Dict[str, Any]:
    result = await session.execute(select(Holding).where(Holding.ticker == ticker.upper()))
    holding = result.scalars().first()
    if holding:
        return {"ticker": ticker.upper(), "price": holding.current_price, "currency": "USD", "source": "EOD_MARKET_FEED"}
    
    # Fallback dictionary for common tickers
    mock_prices = {
        "AAPL": 224.50, "MSFT": 448.20, "NVDA": 128.00, "SPY": 545.10, "VOO": 500.00,
        "BND": 72.80, "AGG": 98.40, "TLT": 94.50, "GLD": 230.10, "VNQ": 86.40,
    }
    price = mock_prices.get(ticker.upper(), 100.00)
    return {"ticker": ticker.upper(), "price": price, "currency": "USD", "source": "ESTIMATED_FEED"}


@tool_registry.register(
    name="calculate_allocation",
    description="Calculate asset class allocation percentages (Equities, Fixed Income, Alternatives, Cash) for client portfolio",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR, UserRole.VIEWER],
    risk_level="LOW",
)
async def calculate_allocation(client_id: str, session) -> Dict[str, Any]:
    result = await session.execute(
        select(Portfolio)
        .where(Portfolio.client_id == client_id)
        .options(selectinload(Portfolio.holdings))
    )
    portfolio = result.scalars().first()
    if not portfolio:
        raise ClientNotFoundError(client_id)

    breakdown = {"Equities": 0.0, "Fixed Income": 0.0, "Alternatives": 0.0, "Cash": 0.0}
    for h in portfolio.holdings:
        ac = h.asset_class
        if ac in breakdown:
            breakdown[ac] += h.market_value
        else:
            breakdown["Cash"] += h.market_value

    total_val = portfolio.total_value if portfolio.total_value > 0 else 1.0
    percentages = {
        k: round((v / total_val) * 100.0, 2)
        for k, v in breakdown.items()
    }

    return {
        "client_id": client_id,
        "total_value": portfolio.total_value,
        "allocation_amounts": breakdown,
        "allocation_pct": percentages,
    }


@tool_registry.register(
    name="calculate_var",
    description="Calculate 1-day 95% Parametric Value-at-Risk (VaR) based on current portfolio asset weights",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR],
    risk_level="LOW",
)
async def calculate_var(client_id: str, confidence_level: float = 0.95, session=None) -> Dict[str, Any]:
    alloc = await calculate_allocation(client_id, session=session)
    pcts = alloc["allocation_pct"]
    total_val = alloc["total_value"]

    # Historical volatility proxy per asset class (annualized std dev: Equities 18%, Fixed Income 6%, Alts 14%, Cash 0.5%)
    eq_w = pcts.get("Equities", 0.0) / 100.0
    fi_w = pcts.get("Fixed Income", 0.0) / 100.0
    alt_w = pcts.get("Alternatives", 0.0) / 100.0
    cash_w = pcts.get("Cash", 0.0) / 100.0

    # Simplified portfolio daily variance
    vol_eq = 0.18 / np.sqrt(252)
    vol_fi = 0.06 / np.sqrt(252)
    vol_alt = 0.14 / np.sqrt(252)
    vol_cash = 0.005 / np.sqrt(252)

    portfolio_daily_vol = (eq_w * vol_eq) + (fi_w * vol_fi) + (alt_w * vol_alt) + (cash_w * vol_cash)
    z_score = 1.645 if confidence_level == 0.95 else 2.326  # 95% vs 99%

    var_pct_1d = portfolio_daily_vol * z_score * 100.0
    var_amount_usd = (var_pct_1d / 100.0) * total_val

    return {
        "client_id": client_id,
        "confidence_level": confidence_level,
        "time_horizon": "1-Day",
        "var_pct_1d": round(var_pct_1d, 3),
        "var_amount_usd": round(var_amount_usd, 2),
        "total_value": total_val,
        "risk_status": "ELEVATED" if var_pct_1d > 2.0 else "NORMAL",
    }


@tool_registry.register(
    name="calculate_sharpe",
    description="Calculate annualized Sharpe ratio based on current allocation and risk-free benchmark",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR],
    risk_level="LOW",
)
async def calculate_sharpe(client_id: str, risk_free_rate: float = 0.045, session=None) -> Dict[str, Any]:
    alloc = await calculate_allocation(client_id, session=session)
    pcts = alloc["allocation_pct"]

    # Expected returns proxies: Equities 9.5%, FI 4.8%, Alts 7.0%, Cash 4.5%
    exp_return = (
        (pcts.get("Equities", 0.0) * 0.095) +
        (pcts.get("Fixed Income", 0.0) * 0.048) +
        (pcts.get("Alternatives", 0.0) * 0.070) +
        (pcts.get("Cash", 0.0) * 0.045)
    ) / 100.0

    # Expected volatility
    exp_vol = (
        (pcts.get("Equities", 0.0) * 0.17) +
        (pcts.get("Fixed Income", 0.0) * 0.055) +
        (pcts.get("Alternatives", 0.0) * 0.13)
    ) / 100.0
    exp_vol = max(exp_vol, 0.01)

    sharpe = (exp_return - risk_free_rate) / exp_vol

    return {
        "client_id": client_id,
        "sharpe_ratio": round(sharpe, 2),
        "expected_return_annual": round(exp_return * 100, 2),
        "expected_volatility_annual": round(exp_vol * 100, 2),
        "risk_free_rate": risk_free_rate,
        "rating": "STRONG" if sharpe >= 1.0 else ("ACCEPTABLE" if sharpe >= 0.5 else "SUBPAR"),
    }


@tool_registry.register(
    name="check_policy",
    description="Compare current asset allocation against approved client IPS limits to identify policy breaches",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR, UserRole.VIEWER],
    risk_level="LOW",
)
async def check_policy(client_id: str, session) -> Dict[str, Any]:
    result = await session.execute(select(InvestmentPolicy).where(InvestmentPolicy.client_id == client_id))
    policy = result.scalars().first()
    if not policy:
        raise PolicyMissingError(client_id)

    alloc_data = await calculate_allocation(client_id, session=session)
    curr_pct = alloc_data["allocation_pct"]

    breaches = []
    comparisons = {}

    # Asset class checks
    checks = [
        ("Equities", curr_pct.get("Equities", 0.0), policy.min_equity_pct, policy.max_equity_pct, policy.target_equity_pct),
        ("Fixed Income", curr_pct.get("Fixed Income", 0.0), policy.min_fixed_income_pct, policy.max_fixed_income_pct, policy.target_fixed_income_pct),
        ("Alternatives", curr_pct.get("Alternatives", 0.0), policy.min_alternatives_pct, policy.max_alternatives_pct, policy.target_alternatives_pct),
        ("Cash", curr_pct.get("Cash", 0.0), policy.min_cash_pct, policy.max_cash_pct, policy.target_cash_pct),
    ]

    for asset_class, current, min_val, max_val, target in checks:
        deviation = 0.0
        status_val = "COMPLIANT"
        if current > max_val:
            deviation = current - max_val
            status_val = "BREACH_HIGH"
            breaches.append({
                "asset_class": asset_class,
                "type": "OVER_ALLOCATION",
                "current_pct": current,
                "permitted_max_pct": max_val,
                "target_pct": target,
                "deviation_pct": round(deviation, 2),
                "severity": "CRITICAL" if deviation > 5.0 else "MODERATE",
            })
        elif current < min_val:
            deviation = min_val - current
            status_val = "BREACH_LOW"
            breaches.append({
                "asset_class": asset_class,
                "type": "UNDER_ALLOCATION",
                "current_pct": current,
                "permitted_min_pct": min_val,
                "target_pct": target,
                "deviation_pct": round(deviation, 2),
                "severity": "CRITICAL" if deviation > 5.0 else "MODERATE",
            })

        comparisons[asset_class] = {
            "current_pct": current,
            "min_permitted": min_val,
            "max_permitted": max_val,
            "target": target,
            "status": status_val,
        }

    status_str = "BREACH" if breaches else "COMPLIANT"
    return {
        "client_id": client_id,
        "policy_name": policy.policy_name,
        "status": status_str,
        "breach_count": len(breaches),
        "breaches": breaches,
        "allocation_matrix": comparisons,
    }


@tool_registry.register(
    name="generate_report",
    description="Generate a formatted operational risk and compliance audit report for client portfolio",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR, UserRole.VIEWER],
    risk_level="LOW",
)
async def generate_report(client_id: str, report_type: str = "FULL_RISK", session=None) -> Dict[str, Any]:
    client = await get_client_profile(client_id, session=session)
    policy_check = await check_policy(client_id, session=session)
    var_metrics = await calculate_var(client_id, session=session)
    sharpe_metrics = await calculate_sharpe(client_id, session=session)

    report_content = f"""# WEALTH MANAGEMENT OPERATIONS AUDIT REPORT
**Client**: {client['name']} ({client['id']}) | **Risk Tier**: {client['risk_tolerance']}
**Report Type**: {report_type} | **Fiduciary Status**: {policy_check['status']}
--------------------------------------------------------------------------------
1. ASSET ALLOCATION & POLICY COMPLIANCE:
   Policy Name: {policy_check['policy_name']}
   Status: {policy_check['status']} ({policy_check['breach_count']} breach(es) detected)
"""
    for b in policy_check.get("breaches", []):
        report_content += f"   - [BREACH] {b['asset_class']}: Current {b['current_pct']}% vs Limit {b.get('permitted_max_pct', b.get('permitted_min_pct'))}% (Deviation: +{b['deviation_pct']}%) [{b['severity']}]\n"

    report_content += f"""
2. RISK & PERFORMANCE METRICS:
   - 1-Day Parametric VaR (95%): {var_metrics['var_pct_1d']}% (${var_metrics['var_amount_usd']:,.2f})
   - Annualized Sharpe Ratio: {sharpe_metrics['sharpe_ratio']} ({sharpe_metrics['rating']})
   - Expected Annual Return: {sharpe_metrics['expected_return_annual']}%

3. FIDUCIARY CONCLUSION:
   {"Action required: Portfolio exceeds documented IPS bounds. Prepare rebalancing recommendation." if policy_check['status'] == 'BREACH' else "Portfolio adheres to client IPS parameters. No operational adjustments necessary."}
"""
    return {
        "client_id": client_id,
        "report_type": report_type,
        "compliance_status": policy_check["status"],
        "markdown_report": report_content,
    }


@tool_registry.register(
    name="create_rebalance_recommendation",
    description="Formulate specific buy/sell trade adjustments to bring a breached portfolio back to target IPS weights",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR],
    risk_level="MEDIUM",
)
async def create_rebalance_recommendation(
    client_id: str,
    target_adjustments: Optional[str] = None,
    session=None,
) -> Dict[str, Any]:
    policy_check = await check_policy(client_id, session=session)
    alloc = await calculate_allocation(client_id, session=session)
    total_val = alloc["total_value"]
    matrix = policy_check["allocation_matrix"]

    recommendations = []
    total_rebalance_val = 0.0

    for asset_class, data in matrix.items():
        curr_pct = data["current_pct"]
        target_pct = data["target"]
        diff_pct = curr_pct - target_pct

        if abs(diff_pct) >= 1.0:
            dollar_amt = abs(diff_pct / 100.0) * total_val
            action = "TRIM_SELL" if diff_pct > 0 else "ADD_BUY"
            total_rebalance_val += dollar_amt
            recommendations.append({
                "asset_class": asset_class,
                "action": action,
                "current_pct": curr_pct,
                "target_pct": target_pct,
                "adjustment_pct": round(abs(diff_pct), 2),
                "estimated_amount_usd": round(dollar_amt, 2),
            })

    # Flag whether this recommendation is sensitive and requires dual human authorization
    requires_approval = total_rebalance_val > 100000.0 or any(r["adjustment_pct"] > 5.0 for r in recommendations)

    return {
        "client_id": client_id,
        "portfolio_value": total_val,
        "recommendations": recommendations,
        "total_rebalance_amount_usd": round(total_rebalance_val, 2),
        "requires_human_approval": requires_approval,
        "governance_note": "Per Policy SOP-WM-402, shifts > 5% or value > $100,000 mandate Risk Officer review prior to execution.",
    }


@tool_registry.register(
    name="request_approval",
    description="Queue a sensitive financial action for Risk Officer dual-authorization review",
    allowed_roles=[UserRole.ADMIN, UserRole.RISK_OFFICER, UserRole.OPERATIONS_ANALYST, UserRole.ADVISOR],
    risk_level="HIGH",
)
async def request_approval(
    client_id: str,
    action_type: str,
    reason: str,
    estimated_value: float = 0.0,
    proposed_payload: str = "{}",
    requested_by_user_id: str = "usr_ops_01",
    requested_by_role: str = "OPERATIONS_ANALYST",
    session=None,
) -> Dict[str, Any]:
    approval = ApprovalRequest(
        client_id=client_id,
        action_type=action_type,
        status="PENDING",
        risk_level="HIGH",
        reason=reason,
        estimated_value=estimated_value,
        proposed_payload=proposed_payload,
        requested_by_user_id=requested_by_user_id,
        requested_by_role=requested_by_role,
        policy_reference="Dual-Approval & Trading Authority Governance Policy (v1.8)",
    )
    session.add(approval)
    await session.commit()
    await session.refresh(approval)

    return {
        "approval_id": approval.id,
        "client_id": client_id,
        "action_type": action_type,
        "status": "PENDING",
        "risk_level": "HIGH",
        "message": f"Approval ticket {approval.id} created and dispatched to Risk Officer queue.",
    }
