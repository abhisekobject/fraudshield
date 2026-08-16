"""
FraudShield — Application Configuration
========================================
Reads all configuration from environment variables (via .env file in development).
No secrets are hardcoded here.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application-wide configuration loaded from environment variables.
    Values fall back to the defaults shown here if the variable is not set.
    In production, all sensitive values must be provided via the environment.
    """

    # --- Application --------------------------------------------------------
    APP_NAME: str = "FraudShield"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # --- API ----------------------------------------------------------------
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_BASE_URL: str = "http://localhost:8000/api/v1"

    # --- Security -----------------------------------------------------------
    SECRET_KEY: str = ""            # Must be set in production
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- Database -----------------------------------------------------------
    DATABASE_URL: str = "postgresql://fraudshield_user:password@localhost:5432/fraudshield_db"

    # --- CORS ---------------------------------------------------------------
    CORS_ORIGINS: str = "http://localhost:3000"

    # --- ML / NLP -----------------------------------------------------------
    ML_MODEL_PATH: str = "ml/models/fraud_model.pkl"
    ML_MODEL_VERSION: str = "ml-v1"
    VOICE_NLP_API_KEY: str = ""
    VOICE_NLP_API_URL: str = ""

    # --- Privacy ------------------------------------------------------------
    # When false (default), raw interaction transcripts are NEVER persisted.
    # They are processed in-memory and only derived signals are stored.
    STORE_RAW_TRANSCRIPT: bool = False

    # --- Logging ------------------------------------------------------------
    LOG_LEVEL: str = "INFO"

    # Pydantic Settings v2 config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance (singleton pattern)."""
    return Settings()


# Module-level singleton — import this directly in other modules.
settings = get_settings()
