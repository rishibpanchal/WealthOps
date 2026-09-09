import pytest
from app.core.security import UserRole, Permission, ROLE_PERMISSIONS, CurrentUser
from app.core.exceptions import UnauthorizedToolAccessError
from app.tools.registry import tool_registry


def test_role_permissions():
    admin = CurrentUser("admin", UserRole.ADMIN, "a@test.com", "Admin")
    analyst = CurrentUser("analyst", UserRole.OPERATIONS_ANALYST, "o@test.com", "Analyst")
    viewer = CurrentUser("viewer", UserRole.VIEWER, "v@test.com", "Viewer")
    risk_officer = CurrentUser("risk", UserRole.RISK_OFFICER, "r@test.com", "Risk")

    assert admin.has_permission(Permission.SYSTEM_MANAGE)
    assert admin.has_permission(Permission.APPROVAL_ACTION)

    assert risk_officer.has_permission(Permission.APPROVAL_ACTION)
    assert not risk_officer.has_permission(Permission.SYSTEM_MANAGE)

    assert analyst.has_permission(Permission.RECOMMENDATION_CREATE)
    assert not analyst.has_permission(Permission.APPROVAL_ACTION)

    assert viewer.has_permission(Permission.PORTFOLIO_READ)
    assert not viewer.has_permission(Permission.RECOMMENDATION_CREATE)
    assert not viewer.has_permission(Permission.APPROVAL_ACTION)


@pytest.mark.asyncio
async def test_tool_registry_rbac_enforcement():
    # Viewer should be blocked from create_rebalance_recommendation
    with pytest.raises(UnauthorizedToolAccessError) as exc_info:
        await tool_registry.execute_tool(
            name="create_rebalance_recommendation",
            user_role=UserRole.VIEWER,
            kwargs={"client_id": "C1024"},
        )
    assert "not authorized" in str(exc_info.value).lower()
