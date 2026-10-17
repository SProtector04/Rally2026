from fastapi import APIRouter

from apps.audit.urls import router as audit_router
from apps.commands.urls import router as commands_router
from apps.community.urls import router as community_router
from apps.ingestion.urls import router as ingestion_router
from apps.persistence.urls import router as persistence_router
from config.settings import get_settings

api_router = APIRouter()


@api_router.get("/health", tags=["health"])
async def health() -> dict:
    settings = get_settings()
    return {"status": "ok", "app": settings.app_name, "version": settings.app_version}


api_router.include_router(ingestion_router)
api_router.include_router(persistence_router)
api_router.include_router(commands_router)
api_router.include_router(community_router)
api_router.include_router(audit_router)
