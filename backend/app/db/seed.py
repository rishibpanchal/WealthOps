import asyncio
import json
from datetime import datetime, timezone
from sqlalchemy import select
from app.db.database import AsyncSessionLocal, init_db
from app.db.models import (
    Client,
    Portfolio,
    Holding,
    InvestmentPolicy,
    PolicyDocument,
    ApprovalRequest,
    AuditLog,
)


POLICIES_DATA = [
    {
        "title": "Institutional Investment Policy Statement (IPS) Standard Framework",
        "category": "IPS",
        "version": "v2.4",
        "summary": "Mandatory standards for client asset allocation boundaries, rebalancing tolerance bands, and deviation reporting.",
        "content": """# Institutional Investment Policy Statement (IPS) Standard Framework

## 1. Objective and Scope
This Investment Policy Statement framework governs the operational boundaries, asset allocation targets, and deviation escalation triggers for all managed discretionary accounts. Wealth management operations analysts, advisors, and automated execution engines must adhere strictly to documented tolerances.

## 2. Permitted Asset Allocation Bands
Each client profile has defined asset allocation bands:
- **Conservative**: Equities 15-35% (Target 25%), Fixed Income 50-75% (Target 60%), Alternatives 0-10%, Cash 5-20%.
- **Moderate**: Equities 40-60% (Target 50%), Fixed Income 25-45% (Target 35%), Alternatives 0-10%, Cash 5-15%.
- **Growth**: Equities 60-80% (Target 70%), Fixed Income 15-30% (Target 20%), Alternatives 0-15%, Cash 5-10%.
- **Aggressive**: Equities 75-90% (Target 85%), Fixed Income 5-15% (Target 10%), Alternatives 0-20%, Cash 2-10%.

## 3. Breach Classifications & Escalations
- **Level 1 Deviation (Soft Warning)**: Portfolio allocation deviates by 1.0% - 3.0% from target but remains inside permitted limits. Requires weekly monitoring.
- **Level 2 Deviation (Actionable Breach)**: Portfolio allocation exceeds the maximum or falls below the minimum permitted IPS limit by up to 5.0%. Requires an operations analyst to prepare a formal rebalance recommendation within 3 business days.
- **Level 3 Critical Breach**: Portfolio allocation exceeds permitted limits by > 5.0% or 1-day portfolio VaR (95%) exceeds policy thresholds. Automatic trade execution is prohibited; dual authorization by Risk Officer is strictly mandatory before any rebalancing order can be committed to market connectors.
"""
    },
    {
        "title": "Portfolio Rebalancing Standard Operating Procedure (SOP-WM-402)",
        "category": "REBALANCING",
        "version": "v3.1",
        "summary": "Operating rules for triggering, modeling, validating, and submitting rebalance orders.",
        "content": """# Portfolio Rebalancing Standard Operating Procedure (SOP-WM-402)

## 1. Rebalancing Trigger Conditions
Rebalancing must be initiated under any of the following conditions:
1. Periodic rebalance schedule (Quarterly/Semi-Annual calendar triggers).
2. Material cash inflow or outflow exceeding 5% of portfolio net value.
3. Policy breach detected during daily operations exception monitoring where asset class drift exceeds permitted IPS boundaries.

## 2. Rebalancing Execution Protocol
When a rebalance recommendation is created:
1. The operations analyst must calculate the required percentage drift for each asset class back toward target weights.
2. Estimated gross transaction value must be calculated using latest end-of-day market prices.
3. Tax implications and transaction costs must be minimized through lot selection (HIFO / Tax-Advantaged matching).
4. If proposed rebalancing shift is <= 5.0% and total value <= $100,000, Operations Analyst approval is sufficient.
5. If proposed rebalancing shift > 5.0% OR total value > $100,000, action is classified as SENSITIVE and MUST be routed to the Risk Officer Approval Queue. Direct execution by AI agents or automated bots without signed human approval is strictly forbidden.
"""
    },
    {
        "title": "Dual-Approval & Trading Authority Governance Policy",
        "category": "GOVERNANCE",
        "version": "v1.8",
        "summary": "Segregation of duties, role-based tool authorization, and human-in-the-loop controls.",
        "content": """# Dual-Approval & Trading Authority Governance Policy

## 1. Segregation of Duties
To protect client capital and uphold fiduciary controls:
- **VIEWER**: Read-only inquiry and reporting privileges. Cannot initiate rebalancing or submit approval tickets.
- **ADVISOR**: Can review portfolios, run suitability checks, and submit recommendations.
- **OPERATIONS_ANALYST**: Can execute portfolio analyses, generate deviation reports, calculate VaR/Sharpe, and formulate draft rebalance proposals.
- **RISK_OFFICER**: Holds sole authority to approve or reject rebalance tickets flagged as sensitive, high-risk, or exceeding drift thresholds.
- **ADMIN**: Manages platform configurations, security keys, audit review, and user directories.

## 2. AI Agent Boundary Controls
AI agents act as intelligent analytical assistants and process orchestrators. Under no circumstances is an AI agent permitted to unilaterally route financial orders to custodial settlement networks without deterministic verification of human sign-off in the immutable audit log.
"""
    },
    {
        "title": "Risk Management & Value-at-Risk (VaR) Oversight Policy",
        "category": "RISK_MANAGEMENT",
        "version": "v2.0",
        "summary": "Quantitative risk metrics, parametric VaR calculations, and Sharpe ratio thresholds.",
        "content": """# Risk Management & Value-at-Risk (VaR) Oversight Policy

## 1. Parametric VaR Standards
Daily portfolio risk is assessed using 95% 1-day Parametric Value at Risk (VaR):
- Conservative Portfolios: Max permitted 1-day 95% VaR is 1.2% (approx 7.0% annualized).
- Moderate Portfolios: Max permitted 1-day 95% VaR is 2.2% (approx 12.0% annualized).
- Growth Portfolios: Max permitted 1-day 95% VaR is 3.5% (approx 18.0% annualized).
- Aggressive Portfolios: Max permitted 1-day 95% VaR is 4.8% (approx 24.0% annualized).

## 2. Sharpe Ratio Benchmarks
Accounts are monitored against asset-class risk-free adjusted returns. Portfolios with rolling Sharpe ratios below 0.60 trigger a suitability review with the designated wealth advisor.
"""
    },
    {
        "title": "Client Suitability and Fiduciary Standards Guidelines",
        "category": "SUITABILITY",
        "version": "v1.5",
        "summary": "KYC, risk tolerance alignment, and portfolio suitability verification.",
        "content": """# Client Suitability and Fiduciary Standards Guidelines

## 1. Fiduciary Duty
All operational recommendations must align with the documented best interest of the client, taking into account investment horizon, liquidity needs, and risk tolerance profile.
Any change in asset allocation that increases portfolio volatility beyond the client's documented risk tier requires updated suitability disclosures and explicit advisor sign-off.
"""
    }
]


CLIENT_SEED_DATA = [
    {
        "id": "C1024",
        "name": "Arthur Pendelton",
        "email": "arthur.pendelton@acmepartners.com",
        "risk_tolerance": "Moderate",
        "net_worth": 4200000.0,
        "aum": 2850000.0,
        # Moderate: IPS Equity 40-60%. We set current holdings to 67.2% -> FLAGSHIP BREACH
        "policy": {
            "policy_name": "Moderate Balanced Growth IPS",
            "min_equity_pct": 40.0, "max_equity_pct": 60.0, "target_equity_pct": 50.0,
            "min_fixed_income_pct": 25.0, "max_fixed_income_pct": 45.0, "target_fixed_income_pct": 35.0,
            "min_alternatives_pct": 0.0, "max_alternatives_pct": 10.0, "target_alternatives_pct": 5.0,
            "min_cash_pct": 5.0, "max_cash_pct": 15.0, "target_cash_pct": 10.0,
        },
        "holdings": [
            {"ticker": "AAPL", "name": "Apple Inc.", "asset_class": "Equities", "value": 550000.0, "price": 224.50},
            {"ticker": "MSFT", "name": "Microsoft Corp.", "asset_class": "Equities", "value": 680000.0, "price": 448.20},
            {"ticker": "NVDA", "name": "NVIDIA Corp.", "asset_class": "Equities", "value": 420000.0, "price": 128.00},
            {"ticker": "SPY", "name": "SPDR S&P 500 ETF Trust", "asset_class": "Equities", "value": 265000.0, "price": 545.10},
            {"ticker": "BND", "name": "Vanguard Total Bond Market ETF", "asset_class": "Fixed Income", "value": 620000.0, "price": 72.80},
            {"ticker": "AGG", "name": "iShares Core US Aggregate Bond", "asset_class": "Fixed Income", "value": 95000.0, "price": 98.40},
            {"ticker": "GLD", "name": "SPDR Gold Shares", "asset_class": "Alternatives", "value": 85000.0, "price": 230.10},
            {"ticker": "USD_CASH", "name": "US Dollar Institutional Cash", "asset_class": "Cash", "value": 135000.0, "price": 1.00},
        ]
    },
    {
        "id": "C1098",
        "name": "Claire Dupont",
        "email": "claire.dupont@genevaholdings.ch",
        "risk_tolerance": "Conservative",
        "net_worth": 6500000.0,
        "aum": 4100000.0,
        # Conservative: IPS Equity 20-40%. Current equity: 48.5% -> FLAGSHIP BREACH
        "policy": {
            "policy_name": "Conservative Capital Preservation IPS",
            "min_equity_pct": 20.0, "max_equity_pct": 40.0, "target_equity_pct": 30.0,
            "min_fixed_income_pct": 45.0, "max_fixed_income_pct": 70.0, "target_fixed_income_pct": 55.0,
            "min_alternatives_pct": 0.0, "max_alternatives_pct": 10.0, "target_alternatives_pct": 5.0,
            "min_cash_pct": 5.0, "max_cash_pct": 20.0, "target_cash_pct": 10.0,
        },
        "holdings": [
            {"ticker": "VOO", "name": "Vanguard S&P 500 ETF", "asset_class": "Equities", "value": 1200000.0, "price": 500.00},
            {"ticker": "MSFT", "name": "Microsoft Corp.", "asset_class": "Equities", "value": 790000.0, "price": 448.20},
            {"ticker": "TLT", "name": "iShares 20+ Year Treasury Bond", "asset_class": "Fixed Income", "value": 1300000.0, "price": 94.50},
            {"ticker": "BND", "name": "Vanguard Total Bond Market ETF", "asset_class": "Fixed Income", "value": 450000.0, "price": 72.80},
            {"ticker": "VNQ", "name": "Vanguard Real Estate ETF", "asset_class": "Alternatives", "value": 160000.0, "price": 86.40},
            {"ticker": "USD_CASH", "name": "Treasury Money Market", "asset_class": "Cash", "value": 200000.0, "price": 1.00},
        ]
    },
    {
        "id": "C1132",
        "name": "Vikram Malhotra",
        "email": "vikram.m@horizonfin.in",
        "risk_tolerance": "Growth",
        "net_worth": 3100000.0,
        "aum": 2100000.0,
        # Growth: IPS Equity 50-70%. Current equity: 74.3% -> BREACH
        "policy": {
            "policy_name": "Long-Term Growth IPS",
            "min_equity_pct": 50.0, "max_equity_pct": 70.0, "target_equity_pct": 65.0,
            "min_fixed_income_pct": 15.0, "max_fixed_income_pct": 35.0, "target_fixed_income_pct": 25.0,
            "min_alternatives_pct": 0.0, "max_alternatives_pct": 15.0, "target_alternatives_pct": 5.0,
            "min_cash_pct": 2.0, "max_cash_pct": 10.0, "target_cash_pct": 5.0,
        },
        "holdings": [
            {"ticker": "GOOGL", "name": "Alphabet Inc.", "asset_class": "Equities", "value": 620000.0, "price": 178.50},
            {"ticker": "NVDA", "name": "NVIDIA Corp.", "asset_class": "Equities", "value": 540000.0, "price": 128.00},
            {"ticker": "AMZN", "name": "Amazon.com Inc.", "asset_class": "Equities", "value": 400000.0, "price": 185.00},
            {"ticker": "AGG", "name": "iShares Core US Aggregate Bond", "asset_class": "Fixed Income", "value": 380000.0, "price": 98.40},
            {"ticker": "GLD", "name": "SPDR Gold Shares", "asset_class": "Alternatives", "value": 80000.0, "price": 230.10},
            {"ticker": "USD_CASH", "name": "Cash Sweep", "asset_class": "Cash", "value": 80000.0, "price": 1.00},
        ]
    },
    {
        "id": "C1201",
        "name": "Elena Rostova Family Trust",
        "email": "rostova.trust@familyoffice.org",
        "risk_tolerance": "Moderate",
        "net_worth": 12500000.0,
        "aum": 8400000.0,
        # Moderate: IPS Equity 45-65%. Current equity: 69.1% -> BREACH
        "policy": {
            "policy_name": "Multi-Generational Wealth Preservation IPS",
            "min_equity_pct": 45.0, "max_equity_pct": 65.0, "target_equity_pct": 55.0,
            "min_fixed_income_pct": 25.0, "max_fixed_income_pct": 45.0, "target_fixed_income_pct": 35.0,
            "min_alternatives_pct": 0.0, "max_alternatives_pct": 15.0, "target_alternatives_pct": 5.0,
            "min_cash_pct": 3.0, "max_cash_pct": 12.0, "target_cash_pct": 5.0,
        },
        "holdings": [
            {"ticker": "SPY", "name": "SPDR S&P 500 ETF Trust", "asset_class": "Equities", "value": 3500000.0, "price": 545.10},
            {"ticker": "AAPL", "name": "Apple Inc.", "asset_class": "Equities", "value": 2300000.0, "price": 224.50},
            {"ticker": "BND", "name": "Vanguard Total Bond Market ETF", "asset_class": "Fixed Income", "value": 1800000.0, "price": 72.80},
            {"ticker": "GLD", "name": "SPDR Gold Shares", "asset_class": "Alternatives", "value": 400000.0, "price": 230.10},
            {"ticker": "USD_CASH", "name": "Institutional Yield Sweep", "asset_class": "Cash", "value": 400000.0, "price": 1.00},
        ]
    },
    {
        "id": "C1001",
        "name": "David Sterling",
        "email": "david.sterling@sterlingcap.com",
        "risk_tolerance": "Growth",
        "net_worth": 5400000.0,
        "aum": 3200000.0,
        # Fully COMPLIANT: Target 65%, Current 62.5%
        "policy": {
            "policy_name": "Core Growth Strategy IPS",
            "min_equity_pct": 50.0, "max_equity_pct": 75.0, "target_equity_pct": 65.0,
            "min_fixed_income_pct": 15.0, "max_fixed_income_pct": 35.0, "target_fixed_income_pct": 25.0,
            "min_alternatives_pct": 0.0, "max_alternatives_pct": 15.0, "target_alternatives_pct": 5.0,
            "min_cash_pct": 2.0, "max_cash_pct": 10.0, "target_cash_pct": 5.0,
        },
        "holdings": [
            {"ticker": "VOO", "name": "Vanguard S&P 500 ETF", "asset_class": "Equities", "value": 1400000.0, "price": 500.00},
            {"ticker": "MSFT", "name": "Microsoft Corp.", "asset_class": "Equities", "value": 600000.0, "price": 448.20},
            {"ticker": "BND", "name": "Vanguard Total Bond Market ETF", "asset_class": "Fixed Income", "value": 800000.0, "price": 72.80},
            {"ticker": "VNQ", "name": "Vanguard Real Estate ETF", "asset_class": "Alternatives", "value": 200000.0, "price": 86.40},
            {"ticker": "USD_CASH", "name": "Cash Sweep", "asset_class": "Cash", "value": 200000.0, "price": 1.00},
        ]
    }
]

# Generate additional clients C1002 to C1020 to populate a full 20+ client operational universe
for idx in range(2, 21):
    c_id = f"C100{idx}" if idx < 10 else f"C10{idx}"
    CLIENT_SEED_DATA.append({
        "id": c_id,
        "name": f"Client Account {c_id}",
        "email": f"account.{c_id.lower()}@clientdomain.com",
        "risk_tolerance": "Moderate" if idx % 2 == 0 else "Growth",
        "net_worth": 2000000.0 + (idx * 150000.0),
        "aum": 1200000.0 + (idx * 90000.0),
        "policy": {
            "policy_name": f"Custom Portfolio IPS ({c_id})",
            "min_equity_pct": 40.0, "max_equity_pct": 65.0, "target_equity_pct": 55.0,
            "min_fixed_income_pct": 20.0, "max_fixed_income_pct": 45.0, "target_fixed_income_pct": 35.0,
            "min_alternatives_pct": 0.0, "max_alternatives_pct": 10.0, "target_alternatives_pct": 5.0,
            "min_cash_pct": 2.0, "max_cash_pct": 15.0, "target_cash_pct": 5.0,
        },
        "holdings": [
            {"ticker": "SPY", "name": "SPDR S&P 500 ETF", "asset_class": "Equities", "value": 600000.0 + (idx * 40000.0), "price": 545.10},
            {"ticker": "BND", "name": "Vanguard Total Bond ETF", "asset_class": "Fixed Income", "value": 400000.0 + (idx * 30000.0), "price": 72.80},
            {"ticker": "GLD", "name": "SPDR Gold Trust", "asset_class": "Alternatives", "value": 100000.0 + (idx * 10000.0), "price": 230.10},
            {"ticker": "USD_CASH", "name": "Cash Sweep", "asset_class": "Cash", "value": 100000.0 + (idx * 10000.0), "price": 1.00},
        ]
    })


async def seed_database():
    """Initializes schema and populates synthetic wealth management data."""
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(Client))
        existing = result.scalars().first()
        if existing:
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding Policy Documents...")
        for p_data in POLICIES_DATA:
            doc = PolicyDocument(
                title=p_data["title"],
                category=p_data["category"],
                version=p_data["version"],
                summary=p_data["summary"],
                content=p_data["content"].strip(),
            )
            session.add(doc)

        print("Seeding Clients, Portfolios, Holdings, and IPS Policies...")
        for c_data in CLIENT_SEED_DATA:
            client = Client(
                id=c_data["id"],
                name=c_data["name"],
                email=c_data["email"],
                risk_tolerance=c_data["risk_tolerance"],
                net_worth=c_data["net_worth"],
                aum=c_data["aum"],
                status="ACTIVE",
            )
            session.add(client)

            # Investment Policy
            pol_info = c_data["policy"]
            policy = InvestmentPolicy(
                client_id=client.id,
                policy_name=pol_info["policy_name"],
                min_equity_pct=pol_info["min_equity_pct"],
                max_equity_pct=pol_info["max_equity_pct"],
                target_equity_pct=pol_info["target_equity_pct"],
                min_fixed_income_pct=pol_info["min_fixed_income_pct"],
                max_fixed_income_pct=pol_info["max_fixed_income_pct"],
                target_fixed_income_pct=pol_info["target_fixed_income_pct"],
                min_alternatives_pct=pol_info["min_alternatives_pct"],
                max_alternatives_pct=pol_info["max_alternatives_pct"],
                target_alternatives_pct=pol_info["target_alternatives_pct"],
                min_cash_pct=pol_info["min_cash_pct"],
                max_cash_pct=pol_info["max_cash_pct"],
                target_cash_pct=pol_info["target_cash_pct"],
                max_var_95_pct=12.0,
            )
            session.add(policy)

            # Calculate total portfolio value and holdings
            holdings_list = c_data["holdings"]
            total_val = sum(h["value"] for h in holdings_list)
            cash_val = sum(h["value"] for h in holdings_list if h["asset_class"] == "Cash")

            portfolio = Portfolio(
                client_id=client.id,
                total_value=total_val,
                cash_balance=cash_val,
                currency="USD",
            )
            session.add(portfolio)
            await session.flush()

            for h in holdings_list:
                weight = (h["value"] / total_val * 100.0) if total_val > 0 else 0.0
                holding = Holding(
                    portfolio_id=portfolio.id,
                    ticker=h["ticker"],
                    name=h["name"],
                    asset_class=h["asset_class"],
                    quantity=round(h["value"] / h["price"], 4),
                    current_price=h["price"],
                    market_value=h["value"],
                    cost_basis=round(h["value"] * 0.92, 2),
                    weight_pct=round(weight, 2),
                )
                session.add(holding)

        # Create one initial sample approval request to demonstrate HITL queue immediately
        sample_approval = ApprovalRequest(
            client_id="C1024",
            action_type="REBALANCE_RECOMMENDATION",
            status="PENDING",
            risk_level="HIGH",
            reason="Equity allocation is 67.2%, breaching documented IPS maximum of 60.0% (+7.2% breach). Proposed trim of $205,200.00 across AAPL and MSFT.",
            estimated_value=205200.0,
            policy_reference="Institutional Investment Policy Statement (IPS) Standard Framework (v2.4)",
            proposed_payload=json.dumps({
                "client_id": "C1024",
                "current_equity_pct": 67.2,
                "target_equity_pct": 50.0,
                "recommended_trim_equity_pct": 7.2,
                "target_adjustments": [
                    {"ticker": "AAPL", "action": "SELL", "amount_usd": 105200.0},
                    {"ticker": "MSFT", "action": "SELL", "amount_usd": 100000.0},
                    {"ticker": "BND", "action": "BUY", "amount_usd": 150000.0},
                    {"ticker": "USD_CASH", "action": "DEPOSIT", "amount_usd": 55200.0},
                ]
            }),
            requested_by_user_id="usr_ops_01",
            requested_by_role="OPERATIONS_ANALYST",
        )
        session.add(sample_approval)

        # Initial seed audit log
        sample_audit = AuditLog(
            request_id="req_init_seed_01",
            user_id="usr_admin_01",
            user_role="ADMIN",
            action="SYSTEM_INITIALIZE",
            intent="SYSTEM_SEED",
            client_id="C1024",
            tools_used=json.dumps(["init_database", "seed_synthetic_clients", "load_policy_store"]),
            policy_references=json.dumps(["IPS-Framework-v2.4", "SOP-WM-402"]),
            decision="SYSTEM_READY",
            status="SUCCESS",
            metadata_json=json.dumps({"seeded_clients": len(CLIENT_SEED_DATA), "policies": len(POLICIES_DATA)}),
        )
        session.add(sample_audit)

        await session.commit()
        print(f"Seeded {len(CLIENT_SEED_DATA)} clients, portfolios, and {len(POLICIES_DATA)} institutional policies.")


if __name__ == "__main__":
    asyncio.run(seed_database())
