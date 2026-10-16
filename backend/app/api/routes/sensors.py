from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import Sensor
from app.schemas import SensorCreate, SensorRead

router = APIRouter(prefix="/sensors", tags=["sensors"])


@router.get("", response_model=list[SensorRead])
async def list_sensors(db: AsyncSession = Depends(get_db)) -> list[Sensor]:
    result = await db.execute(select(Sensor).order_by(Sensor.created_at))
    return list(result.scalars().all())


@router.post("", response_model=SensorRead, status_code=status.HTTP_201_CREATED)
async def create_sensor(
    payload: SensorCreate, db: AsyncSession = Depends(get_db)
) -> Sensor:
    sensor = Sensor(**payload.model_dump())
    db.add(sensor)
    await db.commit()
    await db.refresh(sensor)
    return sensor


@router.get("/{sensor_id}", response_model=SensorRead)
async def get_sensor(
    sensor_id: UUID, db: AsyncSession = Depends(get_db)
) -> Sensor:
    sensor = await db.get(Sensor, sensor_id)
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor
