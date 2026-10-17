from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from apps.ingestion.models import Sensor
from apps.ingestion.repository import get_sensor, list_sensors
from apps.ingestion.schemas import SensorCreate
from config.db import get_db


async def list_devices(db: AsyncSession = Depends(get_db)) -> list[Sensor]:
    return await list_sensors(db)


async def create_device(
    payload: SensorCreate, db: AsyncSession = Depends(get_db)
) -> Sensor:
    sensor = Sensor(**payload.model_dump())
    db.add(sensor)
    await db.commit()
    await db.refresh(sensor)
    return sensor


async def get_device(
    sensor_id: UUID, db: AsyncSession = Depends(get_db)
) -> Sensor:
    sensor = await get_sensor(db, sensor_id)
    if sensor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")
    return sensor
