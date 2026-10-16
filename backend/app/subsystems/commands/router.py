from fastapi import APIRouter, status

router = APIRouter(prefix="/commands", tags=["commands"])


@router.get("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def commands_status() -> dict:
    return {"detail": "Command coordinator is not implemented yet"}
