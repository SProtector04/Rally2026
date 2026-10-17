"""Ingest pipeline for the ingestion subsystem.

Chains the apps: normalization/validation -> identity lookup -> rules ->
persistence -> realtime fan-out over Redis.
"""
import logging

from apps.ingestion.repository import get_sensor
from apps.persistence.repository import create_reading
from apps.persistence.schemas import ReadingRead
from apps.rules.services import classify
from apps.validation.services import normalize_and_validate
from config.db import async_session_factory
from config.redis import redis_client
from config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def process_reading(payload: dict) -> None:
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
