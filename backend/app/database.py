from collections.abc import Generator

from fastapi import HTTPException
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import DATABASE_URL


class Base(DeclarativeBase):
    pass


engine = create_engine(DATABASE_URL, pool_pre_ping=True) if DATABASE_URL else None
SessionLocal = (
    sessionmaker(bind=engine, autoflush=False, autocommit=False)
    if engine is not None
    else None
)


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database is not configured.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_database_tables() -> None:
    if engine is None:
        return

    from app.models import (
        Admin,
        AdminRefreshSession,
        Project,
        RefreshSession,
        Student,
    )

    Base.metadata.create_all(
        bind=engine,
        tables=[
            Student.__table__,
            Project.__table__,
            RefreshSession.__table__,
            Admin.__table__,
            AdminRefreshSession.__table__,
        ],
    )


def ensure_project_moderation_schema() -> None:
    if engine is None:
        return

    columns = {
        column["name"] for column in inspect(engine).get_columns("projects")
    }
    dialect = engine.dialect.name
    timestamp_type = "TIMESTAMP WITH TIME ZONE" if dialect == "postgresql" else "DATETIME"
    additive_columns = {
        "moderation_status": (
            "VARCHAR(32) NOT NULL DEFAULT 'Pending'"
        ),
        "review_feedback": "TEXT NULL",
        "reviewed_by_admin_id": (
            "INTEGER REFERENCES admins(id) ON DELETE SET NULL"
        ),
        "reviewed_at": f"{timestamp_type} NULL",
    }

    missing_columns = [
        (name, definition)
        for name, definition in additive_columns.items()
        if name not in columns
    ]
    if not missing_columns:
        return

    with engine.begin() as connection:
        for name, definition in missing_columns:
            connection.execute(
                text(f"ALTER TABLE projects ADD COLUMN {name} {definition}")
            )