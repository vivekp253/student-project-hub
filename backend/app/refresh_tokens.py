import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import FRONTEND_ORIGINS
from app.models import RefreshSession

REFRESH_COOKIE_NAME = "student_hub_refresh"
CSRF_COOKIE_NAME = "student_hub_csrf"
CSRF_HEADER_NAME = "X-CSRF-Token"
NORMAL_REFRESH_LIFETIME = timedelta(hours=12)
REMEMBERED_REFRESH_LIFETIME = timedelta(days=30)


class RefreshSessionError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


@dataclass(frozen=True)
class RefreshGrant:
    session: RefreshSession
    refresh_token: str
    csrf_token: str


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def _validate_origin(origin: str | None) -> None:
    if origin is None or origin.rstrip("/") not in FRONTEND_ORIGINS:
        raise RefreshSessionError(403, "Request origin is not allowed.")


def _validate_csrf(
    session: RefreshSession,
    csrf_cookie: str | None,
    csrf_header: str | None,
) -> None:
    if not csrf_cookie or not csrf_header:
        raise RefreshSessionError(403, "CSRF validation failed.")
    if not hmac.compare_digest(csrf_cookie, csrf_header):
        raise RefreshSessionError(403, "CSRF validation failed.")
    if not hmac.compare_digest(_token_hash(csrf_header), session.csrf_token_hash):
        raise RefreshSessionError(403, "CSRF validation failed.")


def _create_grant(
    db: Session,
    student_id: int,
    remember_me: bool,
    family_id: str,
    expires_at: datetime | None = None,
) -> RefreshGrant:
    refresh_token = secrets.token_urlsafe(48)
    csrf_token = secrets.token_urlsafe(32)
    lifetime = (
        REMEMBERED_REFRESH_LIFETIME if remember_me else NORMAL_REFRESH_LIFETIME
    )
    expires_at = expires_at or (_now() + lifetime)
    session = RefreshSession(
        student_id=student_id,
        family_id=family_id,
        token_hash=_token_hash(refresh_token),
        csrf_token_hash=_token_hash(csrf_token),
        expires_at=expires_at,
        remember_me=remember_me,
    )
    db.add(session)
    db.flush()
    return RefreshGrant(session, refresh_token, csrf_token)


def create_refresh_session(
    db: Session,
    student_id: int,
    remember_me: bool,
) -> RefreshGrant:
    try:
        grant = _create_grant(
            db,
            student_id,
            remember_me,
            family_id=secrets.token_hex(24),
        )
        db.commit()
        db.refresh(grant.session)
        return grant
    except SQLAlchemyError:
        db.rollback()
        raise RefreshSessionError(503, "Authentication session could not be created.") from None


def _revoke_family(db: Session, family_id: str, now: datetime) -> None:
    db.execute(
        update(RefreshSession)
        .where(
            RefreshSession.family_id == family_id,
            RefreshSession.revoked_at.is_(None),
        )
        .values(revoked_at=now)
        .execution_options(synchronize_session=False)
    )
    db.commit()


def rotate_refresh_session(
    db: Session,
    refresh_token: str | None,
    csrf_cookie: str | None,
    csrf_header: str | None,
    origin: str | None,
) -> RefreshGrant:
    _validate_origin(origin)
    if not refresh_token:
        raise RefreshSessionError(401, "Refresh session is missing or expired.")

    session = db.scalar(
        select(RefreshSession).where(
            RefreshSession.token_hash == _token_hash(refresh_token)
        )
    )
    if session is None:
        raise RefreshSessionError(401, "Refresh session is invalid or expired.")

    _validate_csrf(session, csrf_cookie, csrf_header)
    now = _now()

    if session.revoked_at is not None:
        try:
            _revoke_family(db, session.family_id, now)
        except SQLAlchemyError:
            db.rollback()
            raise RefreshSessionError(503, "Authentication session could not be verified.") from None
        raise RefreshSessionError(401, "Refresh token reuse detected; log in again.")

    if _as_utc(session.expires_at) <= now:
        try:
            _revoke_family(db, session.family_id, now)
        except SQLAlchemyError:
            db.rollback()
            raise RefreshSessionError(503, "Authentication session could not be updated.") from None
        raise RefreshSessionError(401, "Refresh session is expired; log in again.")

    try:
        rotation = db.execute(
            update(RefreshSession)
            .where(
                RefreshSession.id == session.id,
                RefreshSession.revoked_at.is_(None),
                RefreshSession.expires_at > now,
            )
            .values(revoked_at=now)
            .execution_options(synchronize_session=False)
        )
        if rotation.rowcount != 1:
            db.rollback()
            _revoke_family(db, session.family_id, now)
            raise RefreshSessionError(401, "Refresh token reuse detected; log in again.")

        grant = _create_grant(
            db,
            session.student_id,
            session.remember_me,
            session.family_id,
            expires_at=_as_utc(session.expires_at),
        )
        db.commit()
        db.refresh(grant.session)
        return grant
    except RefreshSessionError:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise RefreshSessionError(503, "Authentication session could not be rotated.") from None


def revoke_refresh_session(
    db: Session,
    refresh_token: str | None,
    csrf_cookie: str | None,
    csrf_header: str | None,
    origin: str | None,
) -> None:
    if not refresh_token:
        return

    _validate_origin(origin)
    if not csrf_cookie or not csrf_header or not hmac.compare_digest(
        csrf_cookie, csrf_header
    ):
        raise RefreshSessionError(403, "CSRF validation failed.")

    session = db.scalar(
        select(RefreshSession).where(
            RefreshSession.token_hash == _token_hash(refresh_token)
        )
    )
    if session is None:
        return

    _validate_csrf(session, csrf_cookie, csrf_header)
    try:
        db.execute(
            update(RefreshSession)
            .where(
                RefreshSession.family_id == session.family_id,
                RefreshSession.revoked_at.is_(None),
            )
            .values(revoked_at=_now())
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise RefreshSessionError(503, "Authentication session could not be revoked.") from None
