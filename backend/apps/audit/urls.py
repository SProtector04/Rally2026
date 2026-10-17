from fastapi import APIRouter, status

from apps.audit import views

router = APIRouter(prefix="/audit", tags=["audit"])

router.add_api_route(
    "",
    views.audit_status,
    methods=["GET"],
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
