"""Deterministic seed for the La Maravilla micropresa demo fleet.

Populates the sensor table (new restricted taxonomy + zones) and a small
time-series of readings per sensor so the dashboard and map render populated
out of the box. Reconciles the demo fleet when the seed version changes.
"""
import math
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select, text

from apps.ingestion.models import Sensor
from apps.persistence.models import Reading
from apps.rules.classifier import classify_reading
from config.db import async_session_factory

LA_MARAVILLA = {
    "lat": 12.128772951717632,
    "lng": -86.18159277757499,
}

ZONE_OFFSETS = {
    "Corona": {"lat": (0.0005, 0.001), "lng": (-0.001, 0.001)},
    "Vertedero": {"lat": (0.0002, 0.0008), "lng": (0.0005, 0.0012)},
    "Obra de toma": {"lat": (-0.0008, -0.0002), "lng": (0.0005, 0.0012)},
    "Talud aguas arriba": {"lat": (0.0003, 0.0009), "lng": (-0.0012, -0.0005)},
    "Talud aguas abajo": {"lat": (-0.0009, -0.0003), "lng": (-0.0012, -0.0005)},
    "Cuencas tributarias": {"lat": (-0.0005, 0.0005), "lng": (-0.001, -0.0002)},
    "Zona ambiental": {"lat": (-0.001, -0.0005), "lng": (-0.0005, 0.0008)},
    "Embalse central": {"lat": (-0.0004, 0.0004), "lng": (-0.0004, 0.0004)},
}

# (zone, name, type, unit, low, high)
# 11 sensors — all zones remain represented in the demo fleet.
SENSOR_SPECS = [
    # ── Corona (2) ────────────────────────────────────────────────────────────
    ("Corona", "Nivel boya — Corona A", "nivel_boya", "m", 2.5, 8.5),
    ("Corona", "Turbidez — Corona", "turbidez", "NTU", 0.0, 20.0),
    # ── Vertedero (2) ─────────────────────────────────────────────────────────
    ("Vertedero", "Nivel boya — Vertedero A", "nivel_boya", "m", 2.5, 8.5),
    # ── Obra de toma (2) ──────────────────────────────────────────────────────
    ("Obra de toma", "Nivel hidrostático — Toma A", "nivel_hidrostatico", "m", 2.5, 8.5),
    ("Obra de toma", "Turbidez — Toma", "turbidez", "NTU", 0.0, 20.0),
    # ── Talud aguas arriba (1) ────────────────────────────────────────────────
    ("Talud aguas arriba", "Nivel hidrostático — Talud arriba A", "nivel_hidrostatico", "m", 2.5, 8.5),
    # ── Talud aguas abajo (1) ─────────────────────────────────────────────────
    ("Talud aguas abajo", "Nivel hidrostático — Talud abajo A", "nivel_hidrostatico", "m", 2.5, 8.5),
    # ── Cuencas tributarias (1) ───────────────────────────────────────────────
    ("Cuencas tributarias", "Nivel boya — Arroyo norte", "nivel_boya", "m", 0.3, 3.0),
    # ── Zona ambiental (1) ────────────────────────────────────────────────────
    ("Zona ambiental", "Precipitación — Estación meteo A", "precipitacion", "mm", 0.0, 50.0),
    # ── Embalse central (2) ───────────────────────────────────────────────────
    ("Embalse central", "Nivel boya — Centro A", "nivel_boya", "m", 2.5, 8.5),
    ("Embalse central", "Nivel boya — Centro B", "nivel_boya", "m", 2.5, 8.5),
]

# noise and rain_spike are expressed as fractions of the high threshold, so a
# single profile adapts to sensors that share a type but use different ranges.
SENSOR_PROFILES = {
    "nivel_boya": {"noise": 0.02, "rain_spike": 0.09},
    "nivel_hidrostatico": {"noise": 0.015, "rain_spike": 0.08},
    "precipitacion": {"noise": 0.02, "rain_spike": 0.36},
    "turbidez": {"noise": 0.06, "rain_spike": 0.6},
}

READINGS_PER_SENSOR = 24
READING_INTERVAL_MIN = 5
SEED_VERSION = "3"

# Latest-reading target levels as a fraction of the high threshold. The final
# three targets intentionally exercise ok, warning and alert KPI states.
LATEST_TARGETS = [0.50, 0.56, 0.62, 0.68, 0.74, 0.80, 0.86, 0.92, 1.05, 0.96, 0.72]


def _zone_coords(zone: str, idx: int) -> tuple[float, float]:
    """Deterministic position inside a zone's bounding box."""
    rng = random.Random(20260115 + idx * 31)
    box = ZONE_OFFSETS[zone]
    lat = LA_MARAVILLA["lat"] + box["lat"][0] + (box["lat"][1] - box["lat"][0]) * rng.random()
    lng = LA_MARAVILLA["lng"] + box["lng"][0] + (box["lng"][1] - box["lng"][0]) * rng.random()
    return round(lat, 7), round(lng, 7)


def _phase_for_target(target: float) -> float:
    """Phase for the deterministic historical sweep."""
    return math.asin(max(-1.0, min(1.0, (target - 0.6) / 0.5)))


def _reading_value(profile: dict, low: float | None, high: float | None, i: int, j: int) -> float:
    rng = random.Random(20260115 + i * 1000 + j)
    scale = high if high else 50.0

    # The final sample is explicit so the dashboard always displays the same
    # deterministic mix of healthy, warning and failed measurements.
    target = LATEST_TARGETS[i % len(LATEST_TARGETS)]
    if j == READINGS_PER_SENSOR - 1:
        return round(scale * target, 1)

    phase = _phase_for_target(target)
    progress = j / (READINGS_PER_SENSOR - 1)
    level = 0.6 + 0.15 * math.sin(2 * math.pi * progress + phase)

    if profile.get("rain_spike") and j % 8 == 5:
        level += profile["rain_spike"] * (0.5 + rng.random())
    level += rng.gauss(0.0, profile.get("noise", 0.0))

    value = scale * max(0.0, level)
    lo = (low * 0.5) if low is not None else 0.0
    hi = (high * 1.15) if high is not None else value + 10.0
    return round(max(lo, min(hi, value)), 1)


async def seed_database() -> None:
    async with async_session_factory() as session:
        await session.execute(
            text(
                "CREATE TABLE IF NOT EXISTS hydropix_seed_metadata "
                "(key VARCHAR(50) PRIMARY KEY, value VARCHAR(50) NOT NULL)"
            )
        )
        version_result = await session.execute(
            text(
                "SELECT value FROM hydropix_seed_metadata "
                "WHERE key = 'seed_version'"
            )
        )
        seed_version = version_result.scalar_one_or_none()
        existing = await session.execute(select(func.count(Sensor.id)))
        sensor_count = existing.scalar_one() or 0
        if sensor_count == len(SENSOR_SPECS) and seed_version == SEED_VERSION:
            return
        if sensor_count > 0 or seed_version is not None:
            # Replace the previous demo fleet so stale sensors/readings do not
            # remain after a seed configuration change.
            await session.execute(delete(Reading))
            await session.execute(delete(Sensor))
            await session.flush()

        now = datetime.now(timezone.utc)
        sensors: list[Sensor] = []

        for i, (zone, name, stype, unit, low, high) in enumerate(SENSOR_SPECS):
            lat, lng = _zone_coords(zone, i)
            sensor = Sensor(
                name=name,
                type=stype,
                unit=unit,
                latitude=lat,
                longitude=lng,
                low_threshold=low,
                high_threshold=high,
                zone=zone,
                created_at=now - timedelta(days=30),
            )
            session.add(sensor)
            sensors.append(sensor)

        await session.flush()

        for i, sensor in enumerate(sensors):
            profile = SENSOR_PROFILES.get(sensor.type, {})
            for j in range(READINGS_PER_SENSOR):
                value = _reading_value(profile, sensor.low_threshold, sensor.high_threshold, i, j)
                status = classify_reading(value, sensor.low_threshold, sensor.high_threshold)
                ts = now - timedelta(minutes=(READINGS_PER_SENSOR - j) * READING_INTERVAL_MIN)
                session.add(Reading(sensor_id=sensor.id, value=value, status=status, timestamp=ts))

        await session.execute(
            text(
                "INSERT INTO hydropix_seed_metadata (key, value) "
                "VALUES ('seed_version', :version) "
                "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
            ),
            {"version": SEED_VERSION},
        )
        await session.commit()
