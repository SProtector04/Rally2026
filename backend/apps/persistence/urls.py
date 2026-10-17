from fastapi import APIRouter, status

from apps.persistence import views
from apps.persistence.schemas import ReadingCreate, ReadingRead

router = APIRouter(prefix="/readings", tags=["persistence"])

router.add_api_route(
    "",
    views.list_historical_readings,
    methods=["GET"],
    response_model=list[ReadingRead],
)

router.add_api_route(
    "",
    views.create_reading_endpoint,
    methods=["POST"],
    response_model=ReadingRead,
    status_code=status.HTTP_201_CREATED,
)

router.add_api_route(
    "/{reading_id}",
    views.update_reading_endpoint,
    methods=["PATCH"],
    response_model=ReadingRead,
)
