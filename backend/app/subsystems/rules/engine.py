"""Rules engine: alerts, anomalies, hydraulic risk and operational policies.

``classify`` delegates to the threshold classifier — the current, naive
implementation. ``detect_anomalies`` and ``assess_hydraulic_risk`` are stubs
for the richer models still to come (rate of change, multi-sensor correlation,
risk scoring).
"""
from typing import Any

from app.subsystems.rules.classifier import classify_reading


def classify(value: float, low: float | None, high: float | None) -> str:
    return classify_reading(value, low, high)


def detect_anomalies(reading: Any) -> list[dict]:
    raise NotImplementedError("Anomaly detection is not implemented")


def assess_hydraulic_risk(reading: Any) -> float:
    raise NotImplementedError("Hydraulic risk assessment is not implemented")
