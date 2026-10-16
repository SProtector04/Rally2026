MARGIN = 0.10


def classify_reading(value: float, low: float | None, high: float | None) -> str:
    """Naive threshold classifier.

    Placeholder for the real risk/condition model. Returns one of "ok",
    "warning" or "alert" based on the sensor's configured thresholds.
    """
    if high is not None and value >= high:
        return "alert"
    if low is not None and value <= low:
        return "alert"

    if high is not None and high != 0 and value >= high - abs(high) * MARGIN:
        return "warning"
    if low is not None and low != 0 and value <= low + abs(low) * MARGIN:
        return "warning"

    return "ok"
