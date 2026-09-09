import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "WealthOps Agent"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database: Default to local SQLite via aiosqlite, interchangeable with PostgreSQL/pgvector
    DATABASE_URL: str = "sqlite+aiosqlite:///./wealthops.db"

    # CORS origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ]

    # Optional live LLM API Keys (defaults to high-fidelity SmartDeterministicProvider if not provided)
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = "smart_mock"  # "smart_mock", "gemini", "openai", "anthropic"

    # Deterministic Guardrails & Risk Limits (Indian Standard & Fiduciary Thresholds)
    MAX_REBALANCE_CHANGE_PCT: float = 5.0  # Any allocation shift > 5% requires Risk Officer dual approval
    MAX_TRANSACTION_VALUE_INR: float = 1000000.0  # Rebalance value > ₹10,00,000 (10 Lakhs) requires dual approval
    MAX_TRANSACTION_VALUE_USD: float = 1000000.0  # Backward-compatible threshold
    CONFIDENCE_THRESHOLD: float = 0.85  # Model confidence below 0.85 triggers human escalation
    STRICT_POLICY_ENFORCEMENT: bool = True


settings = Settings()
