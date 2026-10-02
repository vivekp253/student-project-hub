import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import FRONTEND_ORIGINS
from app.models import Admin, AdminRefreshSession, RefreshSession

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
    session: RefreshSession | AdminRefreshSession
    refresh_token: str
    csrf_token: str
    account_type: str
    account_id: int


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
    account_id: int,
    account_type: str,
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
    session_model = AdminRefreshSession if account_type == "admin" else RefreshSession
    owner_field = "admin_id" if account_type == "admin" else "student_id"
    session = session_model(
        **{owner_field: account_id},
        family_id=family_id,
        token_hash=_token_hash(refresh_token),
        csrf_token_hash=_token_hash(csrf_token),
        expires_at=expires_at,
        remember_me=remember_me,
    )
    db.add(session)
    db.flush()
    return RefreshGrant(session, refresh_token, csrf_token, account_type, account_id)


def create_refresh_session(
    db: Session,
    student_id: int,
    remember_me: bool,
) -> RefreshGrant:
    try:
        grant = _create_grant(
            db,
            student_id,
            "student",
            remember_me,
            family_id=secrets.token_hex(24),
        )
        db.commit()
        db.refresh(grant.session)
        return grant
    except SQLAlchemyError:
        db.rollback()
        raise RefreshSessionError(503, "Authentication session could not be created.") from None


def create_admin_refresh_session(
    db: Session,
    admin_id: int,
    remember_me: bool,
) -> RefreshGrant:
    try:
        grant = _create_grant(
            db,
            admin_id,
            "admin",
            remember_me,
            family_id=secrets.token_hex(24),
        )
        db.commit()
        db.refresh(grant.session)
        return grant
    except SQLAlchemyError:
        db.rollback()
        raise RefreshSessionError(503, "Authentication session could not be created.") from None


def _revoke_family(
    db: Session,
    family_id: str,
    now: datetime,
    session_model: type[RefreshSession] | type[AdminRefreshSession],
) -> None:
    db.execute(
        update(session_model)
        .where(
            session_model.family_id == family_id,
            session_model.revoked_at.is_(None),
        )
        .values(revoked_at=now)
        .execution_options(synchronize_session=False)
    )
    db.commit()


def _find_session(db: Session, token_hash: str):
    student_session = db.scalar(
        select(RefreshSession).where(RefreshSession.token_hash == token_hash)
    )
    if student_session is not None:
        return (
            student_session,
            "student",
            student_session.student_id,
            RefreshSession,
        )

    admin_session = db.scalar(
        select(AdminRefreshSession).where(
            AdminRefreshSession.token_hash == token_hash
        )
    )
    if admin_session is not None:
        return admin_session, "admin", admin_session.admin_id, AdminRefreshSession
    return None


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

    found_session = _find_session(db, _token_hash(refresh_token))
    if found_session is None:
        raise RefreshSessionError(401, "Refresh session is invalid or expired.")
    session, account_type, account_id, session_model = found_session

    _validate_csrf(session, csrf_cookie, csrf_header)
    now = _now()

    if account_type == "admin":
        admin = db.get(Admin, account_id)
        if admin is None or not admin.is_active:
            try:
                _revoke_family(db, session.family_id, now, session_model)
            except SQLAlchemyError:
                db.rollback()
                raise RefreshSessionError(
                    503,
                    "Authentication session could not be verified.",
                ) from None
            raise RefreshSessionError(401, "Admin account is inactive; log in again.")

    if session.revoked_at is not None:
        try:
            _revoke_family(db, session.family_id, now, session_model)
        except SQLAlchemyError:
            db.rollback()
            raise RefreshSessionError(503, "Authentication session could not be verified.") from None
        raise RefreshSessionError(401, "Refresh token reuse detected; log in again.")

    if _as_utc(session.expires_at) <= now:
        try:
            _revoke_family(db, session.family_id, now, session_model)
        except SQLAlchemyError:
            db.rollback()
            raise RefreshSessionError(503, "Authentication session could not be updated.") from None
        raise RefreshSessionError(401, "Refresh session is expired; log in again.")

    try:
        rotation = db.execute(
            update(session_model)
            .where(
                session_model.id == session.id,
                session_model.revoked_at.is_(None),
                session_model.expires_at > now,
            )
            .values(revoked_at=now)
            .execution_options(synchronize_session=False)
        )
        if rotation.rowcount != 1:
            db.rollback()
            _revoke_family(db, session.family_id, now, session_model)
            raise RefreshSessionError(401, "Refresh token reuse detected; log in again.")

        grant = _create_grant(
            db,
            account_id,
            account_type,
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

    found_session = _find_session(db, _token_hash(refresh_token))
    if found_session is None:
        return
    session, _, _, session_model = found_session

    _validate_csrf(session, csrf_cookie, csrf_header)
    try:
        db.execute(
            update(session_model)
            .where(
                session_model.family_id == session.family_id,
                session_model.revoked_at.is_(None),
            )
            .values(revoked_at=_now())
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise RefreshSessionError(503, "Authentication session could not be revoked.") from None
