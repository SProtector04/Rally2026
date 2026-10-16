import asyncio
import json
import logging

import aiomqtt

from app.core.config import get_settings
from app.core.redis import redis_client
from app.db.session import async_session_factory
from app.models import Reading, Sensor
from app.schemas import ReadingCreate, ReadingRead
from app.services.analyzer import classify_reading

logger = logging.getLogger(__name__)
settings = get_settings()


async def handle_reading(payload: dict) -> None:
    data = ReadingCreate.model_validate(payload)
    async with async_session_factory() as session:
        sensor = await session.get(Sensor, data.sensor_id)
        if sensor is None:
            logger.warning("Ignoring reading for unknown sensor %s", data.sensor_id)
            return

        reading_status = classify_reading(
            data.value, sensor.low_threshold, sensor.high_threshold
        )
        reading = Reading(
            sensor_id=data.sensor_id, value=data.value, status=reading_status
        )
        session.add(reading)
        await session.commit()
        await session.refresh(reading)
        message = ReadingRead.model_validate(reading).model_dump_json()

    await redis_client.publish(settings.readings_channel, message)


async def mqtt_ingest() -> None:
    reconnect_interval = 5
    while True:
        try:
            async with aiomqtt.Client(
                hostname=settings.mqtt_host,
                port=settings.mqtt_port,
                username=settings.mqtt_username,
                password=settings.mqtt_password,
            ) as client:
                await client.subscribe(settings.mqtt_topic)
                logger.info(
                    "MQTT connected to %s:%s, topic %s",
                    settings.mqtt_host,
                    settings.mqtt_port,
                    settings.mqtt_topic,
                )
                async for message in client.messages:
                    try:
                        payload = json.loads(message.payload)
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        logger.warning("Invalid JSON payload on %s", str(message.topic))
                        continue
                    try:
                        await handle_reading(payload)
                    except Exception:
                        logger.exception("Failed to process reading")
        except aiomqtt.MqttError as exc:
            logger.error(
                "MQTT error: %s. Reconnecting in %ss", exc, reconnect_interval
            )
            await asyncio.sleep(reconnect_interval)
