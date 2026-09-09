class WealthOpsBaseException(Exception):
    """Base exception for WealthOps platform."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: dict = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class UnauthorizedToolAccessError(WealthOpsBaseException):
    """Raised when a user or agent role attempts to call an unauthorized financial tool."""
    def __init__(self, tool_name: str, user_role: str, allowed_roles: list):
        message = f"Role '{user_role}' is not authorized to invoke tool '{tool_name}'. Permitted roles: {allowed_roles}"
        super().__init__(message, code="UNAUTHORIZED_TOOL_ACCESS", details={"tool": tool_name, "role": user_role, "allowed": allowed_roles})


class GuardrailViolationError(WealthOpsBaseException):
    """Raised when deterministic guardrails detect a critical breach or safety violation."""
    def __init__(self, reason: str, details: dict = None):
        super().__init__(f"Guardrail violation: {reason}", code="GUARDRAIL_VIOLATION", details=details)


class PolicyMissingError(WealthOpsBaseException):
    """Raised when an operation requires an active Investment Policy Statement (IPS) that is missing."""
    def __init__(self, client_id: str):
        super().__init__(f"No active Investment Policy Statement (IPS) found for client '{client_id}'", code="POLICY_MISSING", details={"client_id": client_id})


class ClientNotFoundError(WealthOpsBaseException):
    """Raised when a client lookup fails."""
    def __init__(self, client_id: str):
        super().__init__(f"Client '{client_id}' not found in wealth management system", code="CLIENT_NOT_FOUND", details={"client_id": client_id})


class InsufficientConfidenceError(WealthOpsBaseException):
    """Raised when model or intent confidence falls below required institutional threshold."""
    def __init__(self, confidence: float, threshold: float):
        super().__init__(f"Agent confidence {confidence:.2f} is below compliance threshold {threshold:.2f}", code="LOW_CONFIDENCE", details={"confidence": confidence, "threshold": threshold})


class ApprovalRequiredException(WealthOpsBaseException):
    """Raised/returned when an action cannot proceed automatically without authorized human approval."""
    def __init__(self, action: str, reason: str, approval_id: str, risk_level: str = "HIGH"):
        super().__init__(f"Action '{action}' halted: Human approval required ({reason})", code="APPROVAL_REQUIRED", details={"action": action, "reason": reason, "approval_id": approval_id, "risk_level": risk_level})
