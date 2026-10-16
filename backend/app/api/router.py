from fastapi import APIRouter

from app.api.routes import health
from app.subsystems.audit.router import router as audit_router
from app.subsystems.commands.router import router as commands_router
from app.subsystems.community.router import router as community_router
from app.subsystems.ingestion.router import router as ingestion_router
from app.subsystems.persistence.router import router as persistence_router

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(ingestion_router)
api_router.include_router(persistence_router)
api_router.include_router(commands_router)
api_router.include_router(community_router)
api_router.include_router(audit_router)
