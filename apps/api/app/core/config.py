from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_ORIGIN: str = "http://localhost:5173"
    
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    
    MODEL_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models", "active"))
    MAX_VIDEO_MB: int = 80
    MAX_VIDEO_SECONDS: int = 15
    ALLOWED_VIDEO_MIME_TYPES: str = "video/mp4,video/webm,video/quicktime,video/x-matroska,image/jpeg,image/png,image/webp,image/jpg"
    ENABLE_SPECIES_MODEL: bool = False
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def allowed_mime_types_list(self) -> List[str]:
        return [mime.strip() for mime in self.ALLOWED_VIDEO_MIME_TYPES.split(",") if mime.strip()]

    @property
    def max_video_bytes(self) -> int:
        return self.MAX_VIDEO_MB * 1024 * 1024

    @property
    def is_supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and (self.SUPABASE_SERVICE_ROLE_KEY or self.SUPABASE_ANON_KEY))

settings = Settings()
