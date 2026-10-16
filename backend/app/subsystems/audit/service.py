"""Audit and observability.

Records decisions, errors, latencies, orders and confirmations for later
inspection. Intended entry points; the implementation is pending.
"""
from typing import Any


async def record_event(
    event_type: str, payload: dict[str, Any], latency_ms: float | None = None
) -> None:
    raise NotImplementedError("Audit event recording is not implemented")
