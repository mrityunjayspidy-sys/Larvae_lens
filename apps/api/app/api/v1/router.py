from fastapi import APIRouter
from .health import router as health_router
from .auth import router as auth_router
from .models import router as models_router
from .scans import router as scans_router
from .reviews import router as reviews_router
from .hotspots import router as hotspots_router
from .tasks import router as tasks_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(models_router)
api_v1_router.include_router(scans_router)
api_v1_router.include_router(reviews_router)
api_v1_router.include_router(hotspots_router)
api_v1_router.include_router(tasks_router)
