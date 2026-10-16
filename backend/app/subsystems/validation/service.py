"""Validation and normalization service.

Checks identity, permissions, units, timestamps, duplicates and physical
plausibility, then normalizes raw telemetry into a canonical shape.

Implemented today: identity (UUID) and physical plausibility (numeric, finite).
Still to come: unit consistency against the device, timestamp trust policy,
duplicate suppression, and per-user/device permission checks.
"""
import math
from dataclasses import dataclass
from uuid import UUID


class ValidationError(ValueError):
    """Raised when a payload fails validation and must be rejected."""


@dataclass(frozen=True)
class NormalizedReading:
    sensor_id: UUID
    value: float


def normalize_and_validate(payload: dict) -> NormalizedReading:
    if not isinstance(payload, dict):
        raise ValidationError("payload must be a JSON object")

    try:
        sensor_id = UUID(str(payload["sensor_id"]))
    except (KeyError, ValueError):
        raise ValidationError("sensor_id is missing or not a valid UUID")

    try:
        value = float(payload["value"])
    except (KeyError, TypeError, ValueError):
        raise ValidationError("value is missing or not numeric")

    if not math.isfinite(value):
        raise ValidationError("value must be a finite number")

    return NormalizedReading(sensor_id=sensor_id, value=value)
