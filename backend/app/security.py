from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.config import SECRET_KEY
from app.database import get_db
from app.models import Admin, Student

TOKEN_ALGORITHM = "HS256"
ACCESS_TOKEN_LIFETIME = timedelta(minutes=30)
MIN_SECRET_KEY_BYTES = 32
bearer_scheme = HTTPBearer(auto_error=False)


def validate_secret_key() -> str:
    if len(SECRET_KEY.encode("utf-8")) < MIN_SECRET_KEY_BYTES:
        raise RuntimeError(
            "Invalid SECRET_KEY configuration. Set at least 32 bytes of "
            "cryptographically secure random data in backend/.env. Generate "
            "one with: python -c \"import secrets; "
            "print(secrets.token_hex(32))\"."
        )
    return SECRET_KEY


def _get_signing_secret() -> str:
    try:
        return validate_secret_key()
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from None


def create_access_token(account_id: int, account_type: str = "student") -> str:
    if account_type not in {"student", "admin"}:
        raise ValueError("Unsupported account type.")
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(account_id),
        "iat": now,
        "exp": now + ACCESS_TOKEN_LIFETIME,
        "token_type": "access",
        "account_type": account_type,
    }
    return jwt.encode(payload, _get_signing_secret(), algorithm=TOKEN_ALGORITHM)


def _get_access_token_account(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> tuple[int, str]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials are required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    secret = _get_signing_secret()
    try:
        payload = jwt.decode(
            credentials.credentials,
            secret,
            algorithms=[TOKEN_ALGORITHM],
        )
        if payload.get("token_type") != "access":
            raise InvalidTokenError("Invalid token type")
        account_id = int(payload["sub"])
        account_type = payload.get("account_type", "student")
        if account_type not in {"student", "admin"}:
            raise InvalidTokenError("Invalid account type")
    except (InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    return account_id, account_type


def get_current_student(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Student:
    account_id, account_type = _get_access_token_account(credentials)
    if account_type != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student account access is required.",
        )

    student = db.get(Student, account_id)
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return student


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Admin:
    account_id, account_type = _get_access_token_account(credentials)
    if account_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account access is required.",
        )

    admin = db.get(Admin, account_id)
    if admin is None or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive admin account.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return admin