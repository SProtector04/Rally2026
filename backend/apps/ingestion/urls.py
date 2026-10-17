from fastapi import APIRouter, status

from apps.ingestion import views
from apps.ingestion.schemas import SensorCreate, SensorRead

router = APIRouter(prefix="/sensors", tags=["ingestion"])

router.add_api_route(
    "",
    views.list_devices,
    methods=["GET"],
    response_model=list[SensorRead],
)

router.add_api_route(
    "",
    views.create_device,
    methods=["POST"],
    response_model=SensorRead,
    status_code=status.HTTP_201_CREATED,
)

router.add_api_route(
    "/{sensor_id}",
    views.get_device,
    methods=["GET"],
    response_model=SensorRead,
)
