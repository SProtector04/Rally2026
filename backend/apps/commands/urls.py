from fastapi import APIRouter, status

from apps.commands import views

router = APIRouter(prefix="/commands", tags=["commands"])

router.add_api_route(
    "",
    views.commands_status,
    methods=["GET"],
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
