from fastapi import APIRouter, status

from apps.community import views

router = APIRouter(prefix="/community", tags=["community"])

router.add_api_route(
    "",
    views.community_status,
    methods=["GET"],
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
