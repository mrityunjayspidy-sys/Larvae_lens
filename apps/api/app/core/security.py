import base64
import json
import logging
from typing import Optional, Dict, Any
from fastapi import Depends, Header
from jose import jwt, JWTError
from .config import settings
from .errors import UnauthorizedError, ForbiddenError
from ..schemas.common import UserRole

logger = logging.getLogger("larvalens.security")

class AuthenticatedUser:
    def __init__(self, user_id: str, email: str, role: UserRole, full_name: Optional[str] = None):
        self.id = user_id
        self.email = email
        self.role = role
        self.full_name = full_name or email.split("@")[0]

    @property
    def is_reviewer(self) -> bool:
        return self.role in [UserRole.REVIEWER, UserRole.ADMIN]

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing or invalid Authorization header. Expected Bearer token.")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise UnauthorizedError("Empty bearer token.")

    # Check for local fallback token format
    if token.startswith("local-jwt-"):
        try:
            payload_bytes = base64.b64decode(token[len("local-jwt-"):])
            data = json.loads(payload_bytes.decode("utf-8"))
            user_id = data.get("id", "local-user")
            email = data.get("email", "local@larvalens.org")
            role_str = data.get("role", "field_worker")
            full_name = data.get("full_name", email.split("@")[0])
            try:
                role = UserRole(role_str)
            except ValueError:
                role = UserRole.FIELD_WORKER
            return AuthenticatedUser(user_id=user_id, email=email, role=role, full_name=full_name)
        except Exception as e:
            logger.warning(f"Local token decoding failed: {e}")
            raise UnauthorizedError("Invalid local session format.")

    # Supabase JWT token decoding
    try:
        claims = jwt.get_unverified_claims(token)
        user_id = claims.get("sub")
        if not user_id:
            raise UnauthorizedError("Token does not contain valid user id ('sub').")

        email = claims.get("email", f"{user_id}@larvalens.internal")
        
        # Determine role from claims or default
        app_meta = claims.get("app_metadata", {})
        user_meta = claims.get("user_metadata", {})
        
        role_str = app_meta.get("role") or user_meta.get("role", "field_worker")
        try:
            role = UserRole(role_str)
        except ValueError:
            role = UserRole.FIELD_WORKER

        full_name = user_meta.get("full_name", email.split("@")[0])
        return AuthenticatedUser(user_id=user_id, email=email, role=role, full_name=full_name)

    except JWTError as e:
        logger.warning(f"JWT parsing failed: {e}")
        raise UnauthorizedError("Invalid or expired authentication token.")
    except Exception as e:
        logger.warning(f"Authentication failed: {e}")
        raise UnauthorizedError("Could not validate credentials.")

def require_role(allowed_roles: list[UserRole]):
    async def role_checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if user.role not in allowed_roles:
            raise ForbiddenError(f"Access forbidden. Required role in {[r.value for r in allowed_roles]}, user has '{user.role.value}'.")
        return user
    return role_checker
