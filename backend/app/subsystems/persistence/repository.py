from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.subsystems.persistence.models import Reading


async def create_reading(
    db: AsyncSession, sensor_id: UUID, value: float, status: str
) -> Reading:
    reading = Reading(sensor_id=sensor_id, value=value, status=status)
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return reading


async def list_readings(
    db: AsyncSession, sensor_id: UUID | None, limit: int
) -> list[Reading]:
    query = select(Reading).order_by(Reading.timestamp.desc()).limit(limit)
    if sensor_id is not None:
        query = query.where(Reading.sensor_id == sensor_id)
    result = await db.execute(query)
    return list(result.scalars().all())
