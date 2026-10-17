from uuid import UUID

from fastapi import Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.ingestion.repository import get_sensor
from apps.persistence.models import Reading
from apps.persistence.repository import create_reading, list_readings
from apps.persistence.schemas import ReadingCreate
from apps.rules.services import classify
from config.db import get_db


async def list_historical_readings(
    sensor_id: UUID | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
) -> list[Reading]:
    return await list_readings(db, sensor_id, limit)


async def create_reading_endpoint(
    payload: ReadingCreate, db: AsyncSession = Depends(get_db)
) -> Reading:
    sensor = await get_sensor(db, payload.sensor_id)
    if sensor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")

    status_value = classify(payload.value, sensor.low_threshold, sensor.high_threshold)
    return await create_reading(db, payload.sensor_id, payload.value, status_value)
