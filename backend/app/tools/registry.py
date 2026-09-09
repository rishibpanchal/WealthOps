from dataclasses import dataclass, field
from typing import Callable, List, Dict, Any, Optional
import functools
import inspect
import json
import time
from app.core.security import UserRole
from app.core.exceptions import UnauthorizedToolAccessError


@dataclass
class ToolDefinition:
    name: str
    description: str
    allowed_roles: List[UserRole]
    risk_level: str  # "LOW", "MEDIUM", "HIGH"
    func: Callable
    parameters_schema: Dict[str, Any] = field(default_factory=dict)

    def is_authorized(self, user_role: UserRole) -> bool:
        return user_role in self.allowed_roles


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}

    def register(
        self,
        name: str,
        description: str,
        allowed_roles: List[UserRole],
        risk_level: str = "LOW",
    ):
        """Decorator to register a financial tool with RBAC and risk level."""
        def decorator(func: Callable):
            sig = inspect.signature(func)
            params = {}
            for p_name, param in sig.parameters.items():
                if p_name in ("session", "current_user"):
                    continue
                param_type = str(param.annotation) if param.annotation != inspect.Parameter.empty else "str"
                params[p_name] = {
                    "type": param_type,
                    "default": None if param.default == inspect.Parameter.empty else param.default,
                }

            tool_def = ToolDefinition(
                name=name,
                description=description,
                allowed_roles=allowed_roles,
                risk_level=risk_level,
                func=func,
                parameters_schema=params,
            )
            self._tools[name] = tool_def

            @functools.wraps(func)
            async def wrapper(*args, **kwargs):
                return await func(*args, **kwargs)

            return wrapper
        return decorator

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "allowed_roles": [r.value for r in t.allowed_roles],
                "risk_level": t.risk_level,
                "parameters": t.parameters_schema,
            }
            for t in self._tools.values()
        ]

    def list_authorized_tools(self, user_role: UserRole) -> List[Dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "allowed_roles": [r.value for r in t.allowed_roles],
                "risk_level": t.risk_level,
                "parameters": t.parameters_schema,
            }
            for t in self._tools.values()
            if t.is_authorized(user_role)
        ]

    async def execute_tool(
        self,
        name: str,
        user_role: UserRole,
        kwargs: Dict[str, Any],
        session=None,
    ) -> Dict[str, Any]:
        """Execute a tool with strict deterministic RBAC checks."""
        tool = self._tools.get(name)
        if not tool:
            raise ValueError(f"Tool '{name}' not found in registry")

        if not tool.is_authorized(user_role):
            raise UnauthorizedToolAccessError(
                tool_name=name,
                user_role=user_role.value,
                allowed_roles=[r.value for r in tool.allowed_roles],
            )

        start_time = time.perf_counter()
        call_kwargs = dict(kwargs)

        # Inject session if accepted
        sig = inspect.signature(tool.func)
        if "session" in sig.parameters and session is not None:
            call_kwargs["session"] = session

        try:
            if inspect.iscoroutinefunction(tool.func):
                result = await tool.func(**call_kwargs)
            else:
                result = tool.func(**call_kwargs)

            duration_ms = (time.perf_counter() - start_time) * 1000.0
            return {
                "tool_name": name,
                "status": "SUCCESS",
                "result": result,
                "duration_ms": round(duration_ms, 2),
                "risk_level": tool.risk_level,
            }
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            return {
                "tool_name": name,
                "status": "FAILED",
                "error": str(exc),
                "duration_ms": round(duration_ms, 2),
                "risk_level": tool.risk_level,
            }


# Global tool registry instance
tool_registry = ToolRegistry()
