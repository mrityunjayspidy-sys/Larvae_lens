import logging
from typing import Optional, Any
from ..core.config import settings

logger = logging.getLogger("larvalens.db")

_supabase_client = None

def get_supabase_client():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if settings.is_supabase_configured:
        try:
            from supabase import create_client, Client
            key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
            _supabase_client = create_client(settings.SUPABASE_URL, key)
            logger.info("Connected to Supabase client successfully.")
            return _supabase_client
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    else:
        logger.info("Supabase is not configured; using local repository adapter.")
        return None
