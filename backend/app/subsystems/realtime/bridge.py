import logging

from app.core.config import get_settings
from app.core.redis import redis_client
from app.subsystems.realtime.manager import manager

logger = logging.getLogger(__name__)
settings = get_settings()


async def bridge_redis_to_websocket() -> None:
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(settings.readings_channel)
    logger.info("Subscribed to Redis channel %r", settings.readings_channel)
    try:
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            await manager.broadcast(message["data"])
    finally:
        await pubsub.close()
