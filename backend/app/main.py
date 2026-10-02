from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.config import APP_NAME, FRONTEND_ORIGINS
from app.database import create_database_tables, ensure_project_moderation_schema
from app.routes.auth import router as auth_router
from app.routes.admin_projects import router as admin_projects_router
from app.routes.health import router as health_router
from app.routes.projects import router as projects_router
from app.security import validate_secret_key

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    validate_secret_key()
    try:
        create_database_tables()
        ensure_project_moderation_schema()
    except SQLAlchemyError:
        logger.exception("Database table initialization failed.")
    yield


app = FastAPI(title=APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(FRONTEND_ORIGINS),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type", "X-CSRF-Token"],
)


@app.get("/")
def root():
    return {"message": "Student Project Hub API is running"}


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(admin_projects_router)
app.include_router(projects_router)
