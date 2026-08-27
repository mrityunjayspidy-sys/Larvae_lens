from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(tags=["Health"])

@router.get("/health")
async def get_health():
    """
    Public service liveness check.
    Does not expose private keys, credentials, or internal filesystem paths.
    """
    return {
        "status": "healthy",
        "service": "LarvaLens API",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
