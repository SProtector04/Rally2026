import logging

from app.core.config import get_settings
from app.core.redis import redis_client
from app.db.session import async_session_factory
from app.subsystems.ingestion.repository import get_sensor
from app.subsystems.persistence.repository import create_reading
from app.subsystems.persistence.schemas import ReadingRead
from app.subsystems.rules.engine import classify
from app.subsystems.validation.service import normalize_and_validate

logger = logging.getLogger(__name__)
settings = get_settings()


async def process_reading(payload: dict) -> None:
    """Run a raw telemetry payload through the ingest pipeline.

    Normalization/validation -> identity lookup -> rules -> persistence ->
    realtime fan-out.
    """
    data = normalize_and_validate(payload)

    async with async_session_factory() as session:
        sensor = await get_sensor(session, data.sensor_id)
        if sensor is None:
            logger.warning("Ignoring reading for unknown sensor %s", data.sensor_id)
            return

        status = classify(data.value, sensor.low_threshold, sensor.high_threshold)
        reading = await create_reading(session, data.sensor_id, data.value, status)
        message = ReadingRead.model_validate(reading).model_dump_json()

    await redis_client.publish(settings.readings_channel, message)
