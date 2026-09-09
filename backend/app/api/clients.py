from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.security import get_current_user, CurrentUser
from app.db.database import AsyncSessionLocal
from app.db.models import Client, Portfolio, Holding, InvestmentPolicy
from app.tools.financial_tools import check_policy, calculate_var, calculate_sharpe


router = APIRouter(prefix="/clients", tags=["Clients & Portfolios"])


@router.get("")
async def list_clients(current_user: CurrentUser = Depends(get_current_user)):
    """List all clients with AUM, risk profile, and live IPS breach compliance status."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Client)
            .options(selectinload(Client.portfolios).selectinload(Portfolio.holdings), selectinload(Client.policy))
            .order_by(Client.id)
        )
        clients = result.scalars().all()

        client_list = []
        for c in clients:
            port = c.portfolios[0] if c.portfolios else None
            status_val = "COMPLIANT"
            breach_count = 0
            equity_pct = 0.0

            if port and c.policy:
                tot = port.total_value if port.total_value > 0 else 1.0
                eq_val = sum(h.market_value for h in port.holdings if h.asset_class == "Equities")
                equity_pct = round((eq_val / tot) * 100.0, 1)

                if equity_pct > c.policy.max_equity_pct:
                    status_val = "BREACH"
                    breach_count += 1
                elif equity_pct < c.policy.min_equity_pct:
                    status_val = "BREACH"
                    breach_count += 1

            client_list.append({
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "risk_tolerance": c.risk_tolerance,
                "aum": c.aum,
                "equity_pct": equity_pct,
                "policy_status": status_val,
                "breach_count": breach_count,
                "status": c.status,
            })

        return client_list


@router.get("/{client_id}")
async def get_client_detail(client_id: str, current_user: CurrentUser = Depends(get_current_user)):
    """Retrieve in-depth client portfolio, asset breakdown, holdings, and policy rules."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Client)
            .where(Client.id == client_id)
            .options(selectinload(Client.portfolios).selectinload(Portfolio.holdings), selectinload(Client.policy))
        )
        client = result.scalars().first()
        if not client:
            raise HTTPException(status_code=404, detail=f"Client '{client_id}' not found")

        portfolio = client.portfolios[0] if client.portfolios else None
        holdings = portfolio.holdings if portfolio else []

        # Policy check
        pol_check = await check_policy(client_id, session=session)
        var_data = await calculate_var(client_id, session=session)
        sharpe_data = await calculate_sharpe(client_id, session=session)

        return {
            "client": {
                "id": client.id,
                "name": client.name,
                "email": client.email,
                "risk_tolerance": client.risk_tolerance,
                "net_worth": client.net_worth,
                "aum": client.aum,
                "advisor_id": client.advisor_id,
                "status": client.status,
            },
            "portfolio": {
                "id": portfolio.id if portfolio else None,
                "total_value": portfolio.total_value if portfolio else 0.0,
                "cash_balance": portfolio.cash_balance if portfolio else 0.0,
                "currency": portfolio.currency if portfolio else "USD",
                "holdings": [
                    {
                        "ticker": h.ticker,
                        "name": h.name,
                        "asset_class": h.asset_class,
                        "quantity": h.quantity,
                        "current_price": h.current_price,
                        "market_value": h.market_value,
                        "weight_pct": h.weight_pct,
                    }
                    for h in holdings
                ]
            },
            "policy": {
                "policy_name": client.policy.policy_name if client.policy else "Standard IPS",
                "min_equity_pct": client.policy.min_equity_pct if client.policy else 40.0,
                "max_equity_pct": client.policy.max_equity_pct if client.policy else 60.0,
                "target_equity_pct": client.policy.target_equity_pct if client.policy else 50.0,
                "min_fixed_income_pct": client.policy.min_fixed_income_pct if client.policy else 25.0,
                "max_fixed_income_pct": client.policy.max_fixed_income_pct if client.policy else 45.0,
                "target_fixed_income_pct": client.policy.target_fixed_income_pct if client.policy else 35.0,
                "min_cash_pct": client.policy.min_cash_pct if client.policy else 5.0,
                "max_cash_pct": client.policy.max_cash_pct if client.policy else 15.0,
                "status": pol_check["status"],
                "breaches": pol_check["breaches"],
            },
            "risk_metrics": {
                "var_pct_1d": var_data["var_pct_1d"],
                "var_amount_usd": var_data["var_amount_usd"],
                "sharpe_ratio": sharpe_data["sharpe_ratio"],
                "sharpe_rating": sharpe_data["rating"],
            }
        }
