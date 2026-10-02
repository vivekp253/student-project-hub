import os
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

APP_NAME = os.getenv("APP_NAME", "Student Project Hub API")
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
SECRET_KEY = os.getenv("SECRET_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173")
FRONTEND_ORIGINS = tuple(
	origin.strip().rstrip("/")
	for origin in os.getenv("FRONTEND_ORIGINS", FRONTEND_URL).split(",")
	if origin.strip()
)
COOKIE_SECURE = os.getenv(
	"COOKIE_SECURE", "true" if FRONTEND_URL.lower().startswith("https://") else "false"
).strip().lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").strip().lower()
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", "").strip() or None

if COOKIE_SAMESITE not in {"lax", "strict", "none"}:
	raise RuntimeError("COOKIE_SAMESITE must be Lax, Strict, or None.")
if COOKIE_SAMESITE == "none" and not COOKIE_SECURE:
	raise RuntimeError("COOKIE_SAMESITE=None requires COOKIE_SECURE=true.")
