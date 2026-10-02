from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.config import SECRET_KEY
from app.database import get_db
from app.models import Student

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


def create_access_token(student_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(student_id),
        "iat": now,
        "exp": now + ACCESS_TOKEN_LIFETIME,
        "token_type": "access",
    }
    return jwt.encode(payload, _get_signing_secret(), algorithm=TOKEN_ALGORITHM)


def get_current_student(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Student:
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
        student_id = int(payload["sub"])
    except (InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return student