from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.ingestion.models import Sensor


async def get_sensor(db: AsyncSession, sensor_id: UUID) -> Sensor | None:
    return await db.get(Sensor, sensor_id)


async def list_sensors(db: AsyncSession) -> list[Sensor]:
    result = await db.execute(select(Sensor).order_by(Sensor.created_at))
    return list(result.scalars().all())
