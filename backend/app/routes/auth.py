from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response, status
from pwdlib import PasswordHash
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import COOKIE_DOMAIN, COOKIE_SAMESITE, COOKIE_SECURE
from app.models import Admin, Student
from app.schemas import (
    AccessTokenResponse,
    StudentRegistrationRequest,
    StudentRegistrationResponse,
    StudentLoginRequest,
    StudentLoginResponse,
)
from app.security import create_access_token
from app.refresh_tokens import (
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
    REFRESH_COOKIE_NAME,
    RefreshSessionError,
    create_refresh_session,
    create_admin_refresh_session,
    revoke_refresh_session,
    rotate_refresh_session,
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])
password_hasher = PasswordHash.recommended()


def _set_refresh_cookies(response: Response, grant) -> None:
    expires_at = grant.session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    max_age = max(int((expires_at - datetime.now(timezone.utc)).total_seconds()), 0)
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=grant.refresh_token,
        max_age=max_age,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/api/auth",
        domain=COOKIE_DOMAIN,
    )
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=grant.csrf_token,
        max_age=max_age,
        httponly=False,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
        domain=COOKIE_DOMAIN,
    )


def _clear_refresh_cookies(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/auth",
        domain=COOKIE_DOMAIN,
        secure=COOKIE_SECURE,
        httponly=True,
        samesite=COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key=CSRF_COOKIE_NAME,
        path="/",
        domain=COOKIE_DOMAIN,
        secure=COOKIE_SECURE,
        httponly=False,
        samesite=COOKIE_SAMESITE,
    )


def _refresh_error_response(error: RefreshSessionError) -> JSONResponse:
    response = JSONResponse(
        status_code=error.status_code,
        content={"detail": error.detail},
    )
    if error.status_code == status.HTTP_401_UNAUTHORIZED:
        _clear_refresh_cookies(response)
    return response


def _duplicate_detail(db: Session, payload: StudentRegistrationRequest) -> str | None:
    normalized_email = payload.email.lower()
    normalized_student_id = payload.student_id.lower()
    email_exists = db.scalar(
        select(Student.id).where(func.lower(Student.email) == normalized_email)
    ) is not None
    student_id_exists = db.scalar(
        select(Student.id).where(func.lower(Student.student_id) == normalized_student_id)
    ) is not None
    admin_email_exists = db.scalar(
        select(Admin.id).where(func.lower(Admin.email) == normalized_email)
    ) is not None
    admin_student_id_exists = db.scalar(
        select(Admin.id).where(func.lower(Admin.email) == normalized_student_id)
    ) is not None

    if (email_exists or admin_email_exists) and (
        student_id_exists or admin_student_id_exists
    ):
        return "Email and student ID are already registered."
    if email_exists or admin_email_exists:
        return "Email is already registered."
    if student_id_exists or admin_student_id_exists:
        return "Student ID is already registered."
    return None


@router.post(
    "/register",
    response_model=StudentRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_student(
    payload: StudentRegistrationRequest,
    db: Session = Depends(get_db),
) -> StudentRegistrationResponse:
    normalized_email = payload.email.lower()
    normalized_student_id = payload.student_id.lower()
    try:
        existing_student = db.scalar(
            select(Student.id).where(
                or_(
                    func.lower(Student.email) == normalized_email,
                    func.lower(Student.student_id) == normalized_student_id,
                )
            )
        )
        existing_admin = db.scalar(
            select(Admin.id).where(
                or_(
                    func.lower(Admin.email) == normalized_email,
                    func.lower(Admin.email) == normalized_student_id,
                )
            )
        )
        if existing_student is not None or existing_admin is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=_duplicate_detail(db, payload),
            )

        student = Student(
            full_name=payload.full_name,
            student_id=normalized_student_id,
            college_name=payload.college_name,
            email=normalized_email,
            hashed_password=password_hasher.hash(payload.password),
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        try:
            duplicate_detail = _duplicate_detail(db, payload)
        except SQLAlchemyError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration could not be completed.",
            ) from None
        if duplicate_detail is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=duplicate_detail,
            ) from None
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration could not be completed.",
        ) from None
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration could not be completed.",
        ) from None

    return StudentRegistrationResponse(
        message="Student registered successfully.",
        id=student.id,
        student_id=student.student_id,
    )


@router.post(
    "/login",
    response_model=StudentLoginResponse,
    status_code=status.HTTP_200_OK,
)
def login_student(
    payload: StudentLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> StudentLoginResponse:
    identifier = payload.identifier.strip()
    normalized_identifier = identifier.lower()
    admin = db.scalar(
        select(Admin).where(func.lower(Admin.email) == normalized_identifier)
    )
    if admin is not None:
        if not admin.is_active or not password_hasher.verify(
            payload.password,
            admin.hashed_password,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or Student ID, or password.",
            )
        account_id = admin.id
        account_type = "admin"
        full_name = admin.full_name
        student_id = None
        create_refresh = create_admin_refresh_session
    else:
        student = db.scalar(
            select(Student).where(
                or_(
                    func.lower(Student.email) == normalized_identifier,
                    func.lower(Student.student_id) == normalized_identifier,
                )
            )
        )
        if student is None or not password_hasher.verify(
            payload.password,
            student.hashed_password,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or Student ID, or password.",
            )
        account_id = student.id
        account_type = "student"
        full_name = student.full_name
        student_id = student.student_id
        create_refresh = create_refresh_session

    try:
        refresh_grant = create_refresh(
            db,
            account_id,
            remember_me=payload.remember_me,
        )
    except RefreshSessionError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.detail,
        ) from None

    _set_refresh_cookies(response, refresh_grant)
    return StudentLoginResponse(
        message="Login successful.",
        id=account_id,
        student_id=student_id,
        full_name=full_name,
        access_token=create_access_token(account_id, account_type=account_type),
        token_type="bearer",
        account_type=account_type,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_access_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    csrf_cookie: str | None = Cookie(default=None, alias=CSRF_COOKIE_NAME),
    csrf_header: str | None = Header(default=None, alias=CSRF_HEADER_NAME),
    origin: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AccessTokenResponse | JSONResponse:
    try:
        grant = rotate_refresh_session(
            db,
            refresh_token,
            csrf_cookie,
            csrf_header,
            origin,
        )
    except RefreshSessionError as error:
        return _refresh_error_response(error)

    _set_refresh_cookies(response, grant)
    return AccessTokenResponse(
        access_token=create_access_token(
            grant.account_id,
            account_type=grant.account_type,
        )
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout_student(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    csrf_cookie: str | None = Cookie(default=None, alias=CSRF_COOKIE_NAME),
    csrf_header: str | None = Header(default=None, alias=CSRF_HEADER_NAME),
    origin: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Response:
    try:
        revoke_refresh_session(
            db,
            refresh_token,
            csrf_cookie,
            csrf_header,
            origin,
        )
    except RefreshSessionError as error:
        return _refresh_error_response(error)

    _clear_refresh_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response