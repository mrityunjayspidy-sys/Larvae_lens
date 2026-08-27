import os
import shutil
import logging
from typing import Optional
from ..core.config import settings
from ..db.supabase_client import get_supabase_client

logger = logging.getLogger("larvalens.storage")

class StorageService:
    @staticmethod
    def get_local_storage_base() -> str:
        base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
        os.makedirs(base, exist_ok=True)
        return base

    @classmethod
    def save_source_video(cls, owner_id: str, scan_id: str, temp_file_path: str, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower() or ".mp4"
        storage_rel_path = f"{owner_id}/{scan_id}/source{ext}"

        client = get_supabase_client()
        if client:
            try:
                with open(temp_file_path, "rb") as f:
                    client.storage.from_("scan-videos").upload(
                        path=storage_rel_path,
                        file=f,
                        file_options={"cache-control": "3600", "upsert": "true"}
                    )
                logger.info(f"Uploaded video to Supabase Storage: scan-videos/{storage_rel_path}")
                return storage_rel_path
            except Exception as e:
                logger.warning(f"Supabase upload failed, using local storage: {e}")

        # Local storage fallback
        dest_full = os.path.join(cls.get_local_storage_base(), "scan-videos", storage_rel_path.replace("/", os.sep))
        os.makedirs(os.path.dirname(dest_full), exist_ok=True)
        shutil.copy2(temp_file_path, dest_full)
        return storage_rel_path

    @classmethod
    def get_signed_video_url(cls, owner_id: str, scan_id: str, source_path: str, expires_in: int = 3600) -> Optional[str]:
        client = get_supabase_client()
        if client:
            try:
                res = client.storage.from_("scan-videos").create_signed_url(source_path, expires_in)
                if res and "signedURL" in res:
                    return res["signedURL"]
            except Exception as e:
                logger.warning(f"Failed to generate Supabase signed URL: {e}")

        # Fallback local stream URL
        return f"/api/v1/scans/{scan_id}/video"
