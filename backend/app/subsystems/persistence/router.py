from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.subsystems.ingestion.repository import get_sensor
from app.subsystems.persistence.models import Reading
from app.subsystems.persistence.repository import create_reading, list_readings
from app.subsystems.persistence.schemas import ReadingCreate, ReadingRead
from app.subsystems.rules.engine import classify

router = APIRouter(prefix="/readings", tags=["persistence"])


@router.get("", response_model=list[ReadingRead])
async def list_historical_readings(
    sensor_id: UUID | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
) -> list[Reading]:
    return await list_readings(db, sensor_id, limit)


@router.post("", response_model=ReadingRead, status_code=status.HTTP_201_CREATED)
async def create_reading_endpoint(
    payload: ReadingCreate, db: AsyncSession = Depends(get_db)
) -> Reading:
    sensor = await get_sensor(db, payload.sensor_id)
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")

    status_value = classify(payload.value, sensor.low_threshold, sensor.high_threshold)
    return await create_reading(db, payload.sensor_id, payload.value, status_value)
