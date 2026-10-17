from uuid import UUID

from fastapi import Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.ingestion.repository import get_sensor
from apps.persistence.models import Reading
from apps.persistence.repository import (
    create_reading,
    get_reading,
    list_readings,
    update_reading,
)
from apps.persistence.schemas import ReadingCreate, ReadingUpdate
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

    status_value = payload.status or classify(payload.value, sensor.low_threshold, sensor.high_threshold)
    return await create_reading(
        db,
        payload.sensor_id,
        payload.value,
        status_value,
        payload.timestamp,
    )


async def update_reading_endpoint(
    reading_id: int,
    payload: ReadingUpdate,
    db: AsyncSession = Depends(get_db),
) -> Reading:
    reading = await get_reading(db, reading_id)
    if reading is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reading not found")

    if payload.sensor_id is not None and await get_sensor(db, payload.sensor_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")

    return await update_reading(
        db,
        reading,
        sensor_id=payload.sensor_id,
        value=payload.value,
        status=payload.status,
        timestamp=payload.timestamp,
    )
