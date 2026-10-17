import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SensorBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: str = Field(min_length=1, max_length=50)
    unit: str = Field(min_length=1, max_length=20)
    latitude: float | None = None
    longitude: float | None = None
    low_threshold: float | None = None
    high_threshold: float | None = None
    zone: str | None = None


class SensorCreate(SensorBase):
    pass


class SensorRead(SensorBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
