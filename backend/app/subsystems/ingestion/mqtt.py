import asyncio
import json
import logging

import aiomqtt

from app.core.config import get_settings
from app.subsystems.ingestion.service import process_reading
from app.subsystems.validation.service import ValidationError

logger = logging.getLogger(__name__)
settings = get_settings()


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
                        await process_reading(payload)
                    except ValidationError:
                        logger.warning("Rejected reading: %r", payload)
                    except Exception:
                        logger.exception("Failed to process reading")
        except aiomqtt.MqttError as exc:
            logger.error(
                "MQTT error: %s. Reconnecting in %ss", exc, reconnect_interval
            )
            await asyncio.sleep(reconnect_interval)
