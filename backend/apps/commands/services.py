"""Command coordinator.

Authorizes, schedules and verifies orders sent to actuators. This is the
intended entry point for the subsystem; the implementation is pending.
"""
from typing import Any


async def authorize(command: Any) -> bool:
    """Check whether a command is permitted for the given actor/device."""
    raise NotImplementedError("Command authorization is not implemented")


async def schedule(command: Any) -> None:
    """Queue a command for delivery to the target actuator."""
    raise NotImplementedError("Command scheduling is not implemented")


async def verify(command_id: str) -> Any:
    """Confirm the actuator applied the command and reconcile state."""
    raise NotImplementedError("Command verification is not implemented")
