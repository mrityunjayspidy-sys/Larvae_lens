import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from ...core.security import get_current_user, AuthenticatedUser
from ...db.repository import Repository
from ...schemas.common import UserRole, UserProfile

logger = logging.getLogger("larvalens.auth")

router = APIRouter(prefix="/auth", tags=["auth"])

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    location_city: Optional[str] = None
    bio: Optional[str] = None

class UpdateRoleRequest(BaseModel):
    role: UserRole

@router.get("/me", response_model=UserProfile)
async def get_my_profile(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieve the current authenticated user's profile from the database.
    """
    profile = Repository.get_profile(current_user.id)
    if not profile:
        profile = Repository.upsert_profile(
            user_id=current_user.id,
            profile_data={
                "full_name": current_user.full_name,
                "role": current_user.role.value,
                "email": current_user.email
            }
        )
    
    return UserProfile(
        id=profile["id"],
        full_name=profile["full_name"],
        role=UserRole(profile["role"]),
        email=profile.get("email", current_user.email),
        phone=profile.get("phone"),
        organization=profile.get("organization"),
        location_city=profile.get("location_city"),
        bio=profile.get("bio"),
        created_at=profile["created_at"],
        updated_at=profile["updated_at"]
    )

@router.patch("/me", response_model=UserProfile)
async def update_my_profile(
    body: UpdateProfileRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Update personal profile information in the database.
    """
    profile_data = {}
    if body.full_name is not None:
        profile_data["full_name"] = body.full_name.strip()
    if body.phone is not None:
        profile_data["phone"] = body.phone.strip()
    if body.organization is not None:
        profile_data["organization"] = body.organization.strip()
    if body.location_city is not None:
        profile_data["location_city"] = body.location_city.strip()
    if body.bio is not None:
        profile_data["bio"] = body.bio.strip()

    updated = Repository.upsert_profile(current_user.id, profile_data)
    return UserProfile(
        id=updated["id"],
        full_name=updated["full_name"],
        role=UserRole(updated["role"]),
        email=updated.get("email", current_user.email),
        phone=updated.get("phone"),
        organization=updated.get("organization"),
        location_city=updated.get("location_city"),
        bio=updated.get("bio"),
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@router.post("/role", response_model=UserProfile)
async def update_user_role(
    body: UpdateRoleRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Update or switch the user's role in the database.
    """
    updated = Repository.update_profile_role(current_user.id, body.role.value)
    return UserProfile(
        id=updated["id"],
        full_name=updated.get("full_name", current_user.full_name),
        role=UserRole(updated["role"]),
        email=updated.get("email", current_user.email),
        phone=updated.get("phone"),
        organization=updated.get("organization"),
        location_city=updated.get("location_city"),
        bio=updated.get("bio"),
        created_at=updated.get("created_at", updated.get("updated_at")),
        updated_at=updated["updated_at"]
    )
