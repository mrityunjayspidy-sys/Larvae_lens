from fastapi import APIRouter, Depends
from ...core.security import get_current_user, AuthenticatedUser
from ...inference.model_registry import model_registry
from ...schemas.models import ModelsStatusResponse

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("/status", response_model=ModelsStatusResponse)
async def get_models_status(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Authenticated endpoint to inspect active model status, SHA-256 verification, and readiness.
    """
    return model_registry.get_status_response()
