import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReadingCreate(BaseModel):
    sensor_id: uuid.UUID
    value: float


class ReadingRead(ReadingCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    timestamp: datetime
