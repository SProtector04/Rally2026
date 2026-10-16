import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Reading(Base):
    __tablename__ = "readings"

    id: Mapped[int] = mapped_column(primary_key=True)
    sensor_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("sensors.id", ondelete="CASCADE"), index=True
    )
    value: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="ok")
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
