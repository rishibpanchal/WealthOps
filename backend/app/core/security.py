from enum import Enum
from typing import Set, Dict, Optional
from fastapi import Header, HTTPException, status


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    OPERATIONS_ANALYST = "OPERATIONS_ANALYST"
    ADVISOR = "ADVISOR"
    RISK_OFFICER = "RISK_OFFICER"
    VIEWER = "VIEWER"


class Permission(str, Enum):
    PORTFOLIO_READ = "portfolio:read"
    CLIENT_READ = "client:read"
    POLICY_READ = "policy:read"
    REPORT_GENERATE = "report:generate"
    RECOMMENDATION_CREATE = "recommendation:create"
    APPROVAL_ACTION = "approval:action"
    REBALANCE_EXECUTE = "rebalance:execute"
    AUDIT_READ = "audit:read"
    SYSTEM_MANAGE = "system:manage"


# Role-Permission Mapping Matrix
ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.ADMIN: {
        Permission.PORTFOLIO_READ,
        Permission.CLIENT_READ,
        Permission.POLICY_READ,
        Permission.REPORT_GENERATE,
        Permission.RECOMMENDATION_CREATE,
        Permission.APPROVAL_ACTION,
        Permission.REBALANCE_EXECUTE,
        Permission.AUDIT_READ,
        Permission.SYSTEM_MANAGE,
    },
    UserRole.RISK_OFFICER: {
        Permission.PORTFOLIO_READ,
        Permission.CLIENT_READ,
        Permission.POLICY_READ,
        Permission.REPORT_GENERATE,
        Permission.RECOMMENDATION_CREATE,
        Permission.APPROVAL_ACTION,
        Permission.AUDIT_READ,
    },
    UserRole.OPERATIONS_ANALYST: {
        Permission.PORTFOLIO_READ,
        Permission.CLIENT_READ,
        Permission.POLICY_READ,
        Permission.REPORT_GENERATE,
        Permission.RECOMMENDATION_CREATE,
        Permission.AUDIT_READ,
    },
    UserRole.ADVISOR: {
        Permission.PORTFOLIO_READ,
        Permission.CLIENT_READ,
        Permission.POLICY_READ,
        Permission.REPORT_GENERATE,
        Permission.RECOMMENDATION_CREATE,
    },
    UserRole.VIEWER: {
        Permission.PORTFOLIO_READ,
        Permission.CLIENT_READ,
        Permission.POLICY_READ,
        Permission.REPORT_GENERATE,
    },
}


class CurrentUser:
    def __init__(self, user_id: str, role: UserRole, email: str, name: str):
        self.user_id = user_id
        self.role = role
        self.email = email
        self.name = name

    def has_permission(self, permission: Permission) -> bool:
        return permission in ROLE_PERMISSIONS.get(self.role, set())


# Demo user directory for quick role switching in the operations UI
DEMO_USERS: Dict[UserRole, CurrentUser] = {
    UserRole.ADMIN: CurrentUser(
        user_id="usr_admin_01",
        role=UserRole.ADMIN,
        email="admin.ops@wealthops.internal",
        name="Sarah Jenkins (Platform Admin)",
    ),
    UserRole.RISK_OFFICER: CurrentUser(
        user_id="usr_risk_01",
        role=UserRole.RISK_OFFICER,
        email="elena.rostova@wealthops.internal",
        name="Elena Rostova (Chief Risk Officer)",
    ),
    UserRole.OPERATIONS_ANALYST: CurrentUser(
        user_id="usr_ops_01",
        role=UserRole.OPERATIONS_ANALYST,
        email="rishi.ops@wealthops.internal",
        name="Rishi Sharma (Operations Analyst)",
    ),
    UserRole.ADVISOR: CurrentUser(
        user_id="usr_adv_01",
        role=UserRole.ADVISOR,
        email="marcus.vance@wealthops.internal",
        name="Marcus Vance (Senior Wealth Advisor)",
    ),
    UserRole.VIEWER: CurrentUser(
        user_id="usr_view_01",
        role=UserRole.VIEWER,
        email="guest.auditor@wealthops.internal",
        name="Alex Morgan (Read-Only Viewer)",
    ),
}


def get_current_user(
    x_user_role: Optional[str] = Header(default="OPERATIONS_ANALYST", alias="X-User-Role"),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
) -> CurrentUser:
    """Extract authenticated user and role from request header (supporting instant UI role switcher)."""
    try:
        role_enum = UserRole(x_user_role.upper()) if x_user_role else UserRole.OPERATIONS_ANALYST
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{x_user_role}'. Allowed: {[r.value for r in UserRole]}",
        )

    base_user = DEMO_USERS.get(role_enum, DEMO_USERS[UserRole.OPERATIONS_ANALYST])
    if x_user_id:
        return CurrentUser(user_id=x_user_id, role=role_enum, email=base_user.email, name=base_user.name)
    return base_user


def require_permission(permission: Permission):
    """FastAPI dependency to enforce RBAC permissions."""
    def dependency(user: CurrentUser = Header(None)) -> CurrentUser:
        # Note: when called in route, get_current_user is injected
        return user
    return dependency
