from typing import TypedDict, List, Dict, Any, Optional


class StepEvent(TypedDict):
    step_order: int
    node_name: str
    title: str
    status: str  # "STARTED", "COMPLETED", "WARNING", "BLOCKED", "FAILED"
    summary: str
    details: Optional[Dict[str, Any]]
    duration_ms: float


class AgentState(TypedDict):
    # User & session context
    user_id: str
    user_role: str  # UserRole enum value string

    # Input request
    original_request: str
    run_id: str

    # Agent reasoning state
    intent: Optional[str]
    confidence: float
    client_id: Optional[str]
    plan: List[Dict[str, Any]]

    # Knowledge & tool state
    retrieved_context: List[Dict[str, Any]]
    selected_tools: List[str]
    tool_results: Dict[str, Any]

    # Risk & Guardrails state
    risk_level: str  # "LOW", "MEDIUM", "HIGH"
    proposed_action: Optional[str]
    validation_result: Dict[str, Any]

    # Governance & Approval
    approval_required: bool
    approval_id: Optional[str]
    approval_status: Optional[str]

    # Output & observability
    final_response: str
    steps_log: List[StepEvent]
    audit_id: Optional[str]
    error: Optional[str]
