from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import Reading, Sensor
from app.schemas import ReadingCreate, ReadingRead
from app.services.analyzer import classify_reading

router = APIRouter(prefix="/readings", tags=["readings"])


@router.get("", response_model=list[ReadingRead])
async def list_readings(
    sensor_id: UUID | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
) -> list[Reading]:
    query = select(Reading).order_by(Reading.timestamp.desc()).limit(limit)
    if sensor_id is not None:
        query = query.where(Reading.sensor_id == sensor_id)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=ReadingRead, status_code=status.HTTP_201_CREATED)
async def create_reading(
    payload: ReadingCreate, db: AsyncSession = Depends(get_db)
) -> Reading:
    sensor = await db.get(Sensor, payload.sensor_id)
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")

    reading_status = classify_reading(
        payload.value, sensor.low_threshold, sensor.high_threshold
    )
    reading = Reading(
        sensor_id=payload.sensor_id, value=payload.value, status=reading_status
    )
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return reading
