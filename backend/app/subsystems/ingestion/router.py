from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.subsystems.ingestion.models import Sensor
from app.subsystems.ingestion.repository import get_sensor, list_sensors
from app.subsystems.ingestion.schemas import SensorCreate, SensorRead

router = APIRouter(prefix="/sensors", tags=["ingestion"])


@router.get("", response_model=list[SensorRead])
async def list_devices(db: AsyncSession = Depends(get_db)) -> list[Sensor]:
    return await list_sensors(db)


@router.post("", response_model=SensorRead, status_code=status.HTTP_201_CREATED)
async def create_device(
    payload: SensorCreate, db: AsyncSession = Depends(get_db)
) -> Sensor:
    sensor = Sensor(**payload.model_dump())
    db.add(sensor)
    await db.commit()
    await db.refresh(sensor)
    return sensor


@router.get("/{sensor_id}", response_model=SensorRead)
async def get_device(
    sensor_id: UUID, db: AsyncSession = Depends(get_db)
) -> Sensor:
    sensor = await get_sensor(db, sensor_id)
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor
