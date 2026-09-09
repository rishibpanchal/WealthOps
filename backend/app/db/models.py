from datetime import datetime, timezone
import uuid
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Client(Base):
    __tablename__ = "clients"

    id = Column(String(50), primary_key=True)  # e.g., "C1024"
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    risk_tolerance = Column(String(50), nullable=False)  # Conservative, Moderate, Growth, Aggressive
    net_worth = Column(Float, default=0.0)
    aum = Column(Float, default=0.0)
    advisor_id = Column(String(50), default="usr_adv_01")
    status = Column(String(20), default="ACTIVE")  # ACTIVE, PENDING_REVIEW, RESTRICTED
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    portfolios = relationship("Portfolio", back_populates="client", cascade="all, delete-orphan")
    policy = relationship("InvestmentPolicy", back_populates="client", uselist=False, cascade="all, delete-orphan")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    client_id = Column(String(50), ForeignKey("clients.id"), nullable=False)
    total_value = Column(Float, default=0.0)
    cash_balance = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    last_rebalanced_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    client = relationship("Client", back_populates="portfolios")
    holdings = relationship("Holding", back_populates="portfolio", cascade="all, delete-orphan")


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    portfolio_id = Column(String(50), ForeignKey("portfolios.id"), nullable=False)
    ticker = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    asset_class = Column(String(50), nullable=False)  # Equities, Fixed Income, Cash, Alternatives
    quantity = Column(Float, default=0.0)
    current_price = Column(Float, default=0.0)
    market_value = Column(Float, default=0.0)
    cost_basis = Column(Float, default=0.0)
    weight_pct = Column(Float, default=0.0)

    portfolio = relationship("Portfolio", back_populates="holdings")


class InvestmentPolicy(Base):
    __tablename__ = "investment_policies"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    client_id = Column(String(50), ForeignKey("clients.id"), nullable=False, unique=True)
    policy_name = Column(String(100), default="Custom Investment Policy Statement")

    # Permitted ranges in percentages (0 - 100)
    min_equity_pct = Column(Float, default=40.0)
    max_equity_pct = Column(Float, default=60.0)
    target_equity_pct = Column(Float, default=50.0)

    min_fixed_income_pct = Column(Float, default=25.0)
    max_fixed_income_pct = Column(Float, default=45.0)
    target_fixed_income_pct = Column(Float, default=35.0)

    min_alternatives_pct = Column(Float, default=0.0)
    max_alternatives_pct = Column(Float, default=10.0)
    target_alternatives_pct = Column(Float, default=5.0)

    min_cash_pct = Column(Float, default=5.0)
    max_cash_pct = Column(Float, default=15.0)
    target_cash_pct = Column(Float, default=10.0)

    max_var_95_pct = Column(Float, default=12.0)  # Max daily/monthly Value at Risk permitted
    max_turnover_pct = Column(Float, default=30.0)
    review_status = Column(String(30), default="APPROVED")
    effective_date = Column(DateTime, default=utc_now)

    client = relationship("Client", back_populates="policy")


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    user_id = Column(String(50), nullable=False)
    user_role = Column(String(50), nullable=False)
    input_query = Column(Text, nullable=False)
    intent = Column(String(50), nullable=True)
    client_id = Column(String(50), nullable=True)
    status = Column(String(30), default="RUNNING")  # RUNNING, COMPLETED, APPROVAL_PENDING, FAILED, ESCALATED
    confidence = Column(Float, default=1.0)
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH
    proposed_action = Column(Text, nullable=True)
    final_response = Column(Text, nullable=True)
    latency_ms = Column(Float, default=0.0)
    started_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    steps = relationship("AgentStep", back_populates="workflow_run", cascade="all, delete-orphan")
    tools = relationship("ToolExecution", back_populates="workflow_run", cascade="all, delete-orphan")
    approvals = relationship("ApprovalRequest", back_populates="workflow_run", cascade="all, delete-orphan")


class AgentStep(Base):
    __tablename__ = "agent_steps"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    workflow_run_id = Column(String(50), ForeignKey("workflow_runs.id"), nullable=False)
    step_order = Column(Integer, default=0)
    node_name = Column(String(50), nullable=False)  # e.g., classify_intent, retrieve_policy, execute_tools
    status = Column(String(30), default="COMPLETED")  # STARTED, COMPLETED, FAILED, SKIPPED
    summary = Column(Text, nullable=True)
    input_state = Column(Text, nullable=True)   # JSON string
    output_state = Column(Text, nullable=True)  # JSON string
    duration_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)

    workflow_run = relationship("WorkflowRun", back_populates="steps")


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    workflow_run_id = Column(String(50), ForeignKey("workflow_runs.id"), nullable=False)
    tool_name = Column(String(100), nullable=False)
    arguments_json = Column(Text, default="{}")
    result_json = Column(Text, default="{}")
    status = Column(String(30), default="SUCCESS")  # SUCCESS, FAILED, BLOCKED_BY_GUARDRAIL
    duration_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)

    workflow_run = relationship("WorkflowRun", back_populates="tools")


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    workflow_run_id = Column(String(50), ForeignKey("workflow_runs.id"), nullable=True)
    client_id = Column(String(50), nullable=False)
    action_type = Column(String(100), nullable=False)  # REBALANCE_PORTFOLIO, EXCEPTION_OVERRIDE, ALLOCATION_SHIFT
    status = Column(String(30), default="PENDING")     # PENDING, APPROVED, REJECTED, CANCELLED
    risk_level = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    reason = Column(Text, nullable=False)
    proposed_payload = Column(Text, default="{}")     # JSON with trade/rebalance parameters
    estimated_value = Column(Float, default=0.0)
    policy_reference = Column(String(100), nullable=True)

    requested_by_user_id = Column(String(50), nullable=False)
    requested_by_role = Column(String(50), nullable=False)
    resolved_by_user_id = Column(String(50), nullable=True)
    resolved_by_role = Column(String(50), nullable=True)
    resolution_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utc_now)
    resolved_at = Column(DateTime, nullable=True)

    workflow_run = relationship("WorkflowRun", back_populates="approvals")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    request_id = Column(String(50), nullable=False)
    workflow_run_id = Column(String(50), nullable=True)
    user_id = Column(String(50), nullable=False)
    user_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    intent = Column(String(50), nullable=True)
    client_id = Column(String(50), nullable=True)
    tools_used = Column(Text, default="[]")           # JSON list of tools
    policy_references = Column(Text, default="[]")    # JSON list of documents cited
    decision = Column(String(50), nullable=False)     # e.g., POLICY_BREACH, COMPLIANT, REBALANCE_RECOMMENDED, BLOCKED
    status = Column(String(30), default="SUCCESS")    # SUCCESS, APPROVAL_PENDING, REJECTED, FAILED
    metadata_json = Column(Text, default="{}")
    timestamp = Column(DateTime, default=utc_now)


class PolicyDocument(Base):
    __tablename__ = "policy_documents"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)   # IPS, RISK_MANAGEMENT, SUITABILITY, REBALANCING, GOVERNANCE
    version = Column(String(20), default="v1.0")
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
