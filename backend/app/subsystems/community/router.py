from fastapi import APIRouter, status

router = APIRouter(prefix="/community", tags=["community"])


@router.get("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def community_status() -> dict:
    return {"detail": "Community management is not implemented yet"}
