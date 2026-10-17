import uuid
from datetime import datetime

from typing import Literal

from pydantic import BaseModel, ConfigDict


class ReadingCreate(BaseModel):
    sensor_id: uuid.UUID
    value: float
    timestamp: datetime | None = None
    status: Literal["ok", "warning", "alert"] | None = None


class ReadingUpdate(BaseModel):
    sensor_id: uuid.UUID | None = None
    value: float | None = None
    timestamp: datetime | None = None
    status: Literal["ok", "warning", "alert"] | None = None


class ReadingRead(ReadingCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    timestamp: datetime
