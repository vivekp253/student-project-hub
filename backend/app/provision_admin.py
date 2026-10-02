from pydantic import EmailStr, TypeAdapter, ValidationError
from pwdlib import PasswordHash
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import ADMIN_EMAIL, ADMIN_FULL_NAME, ADMIN_PASSWORD
from app.database import SessionLocal, create_database_tables
from app.models import Admin, Student

password_hasher = PasswordHash.recommended()
email_adapter = TypeAdapter(EmailStr)


def provision_admin_account(
    db: Session,
    email: str,
    full_name: str,
    password: str,
) -> bool:
    normalized_email = email.strip().lower()
    normalized_name = full_name.strip()
    if not normalized_email or not normalized_name or not password:
        raise ValueError(
            "ADMIN_EMAIL, ADMIN_FULL_NAME, and ADMIN_PASSWORD must be configured."
        )
    if len(password) < 12:
        raise ValueError("ADMIN_PASSWORD must be at least 12 characters long.")
    if len(normalized_name) > 150:
        raise ValueError("ADMIN_FULL_NAME must be 150 characters or fewer.")
    try:
        normalized_email = str(email_adapter.validate_python(normalized_email))
    except ValidationError:
        raise ValueError("ADMIN_EMAIL must be a valid email address.") from None

    existing_admin = db.scalar(select(Admin).where(Admin.email == normalized_email))
    if existing_admin is not None:
        return False

    existing_student = db.scalar(
        select(Student.id).where(
            or_(
                Student.email == normalized_email,
                func.lower(Student.student_id) == normalized_email,
            )
        )
    )
    if existing_student is not None:
        raise ValueError(
            "ADMIN_EMAIL is already registered to a student; choose a separate address."
        )

    admin = Admin(
        full_name=normalized_name,
        email=normalized_email,
        hashed_password=password_hasher.hash(password),
        is_active=True,
    )
    try:
        db.add(admin)
        db.commit()
    except IntegrityError:
        db.rollback()
        if db.scalar(select(Admin.id).where(Admin.email == normalized_email)) is not None:
            return False
        raise ValueError("Admin account could not be provisioned.") from None
    except SQLAlchemyError:
        db.rollback()
        raise ValueError("Admin account could not be provisioned.") from None

    return True


def main() -> None:
    if SessionLocal is None:
        raise SystemExit("Database is not configured; set DATABASE_URL first.")

    try:
        create_database_tables()
        with SessionLocal() as db:
            created = provision_admin_account(
                db,
                ADMIN_EMAIL,
                ADMIN_FULL_NAME,
                ADMIN_PASSWORD,
            )
    except (SQLAlchemyError, ValueError) as error:
        raise SystemExit(str(error)) from None

    print("Admin account provisioned." if created else "Admin account already exists; unchanged.")


if __name__ == "__main__":
    main()
