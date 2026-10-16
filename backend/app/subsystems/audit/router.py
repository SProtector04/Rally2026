from fastapi import APIRouter, status

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def audit_status() -> dict:
    return {"detail": "Audit and observability is not implemented yet"}
