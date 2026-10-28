import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FLAGD_PATH = BASE_DIR / "otel-demo" / "src" / "flagd" / "demo.flagd.json"

class Settings(BaseModel):
    app_name: str = "TriageLens"
    database_url: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR / 'triagelens.db'}")
    flagd_file_path: str = os.getenv("FLAGD_PATH", str(FLAGD_PATH))
    prometheus_url: str = os.getenv("PROMETHEUS_URL", "http://localhost:9090")
    jaeger_url: str = os.getenv("JAEGER_URL", "http://localhost:16686")
    opensearch_url: str = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
    ollama_url: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")
    ollama_timeout_seconds: float = float(os.getenv("OLLAMA_TIMEOUT", "20.0"))

settings = Settings()
