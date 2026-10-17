from uuid import UUID

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.persistence.models import Reading


async def create_reading(
    db: AsyncSession,
    sensor_id: UUID,
    value: float,
    status: str,
    timestamp: datetime | None = None,
) -> Reading:
    reading = Reading(
        sensor_id=sensor_id,
        value=value,
        status=status,
        timestamp=timestamp,
    )
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


async def get_reading(db: AsyncSession, reading_id: int) -> Reading | None:
    return await db.get(Reading, reading_id)


async def update_reading(
    db: AsyncSession,
    reading: Reading,
    *,
    sensor_id: UUID | None = None,
    value: float | None = None,
    status: str | None = None,
    timestamp: datetime | None = None,
) -> Reading:
    if sensor_id is not None:
        reading.sensor_id = sensor_id
    if value is not None:
        reading.value = value
    if status is not None:
        reading.status = status
    if timestamp is not None:
        reading.timestamp = timestamp
    await db.commit()
    await db.refresh(reading)
    return reading
