import secrets
import unittest
from http.cookies import SimpleCookie

import jwt
from fastapi import HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

import app.security as security
from app.config import FRONTEND_URL
from app.database import Base
from app.models import Admin, AdminRefreshSession, Student
from app.provision_admin import provision_admin_account
from app.refresh_tokens import CSRF_COOKIE_NAME, REFRESH_COOKIE_NAME
from app.routes.auth import login_student, password_hasher, refresh_access_token, register_student
from app.schemas import StudentLoginRequest, StudentRegistrationRequest


class AdminAuthenticationTests(unittest.TestCase):
    def setUp(self):
        self.previous_secret = security.SECRET_KEY
        security.SECRET_KEY = secrets.token_hex(32)
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.student = Student(
            full_name="Student Account",
            student_id="ROLE-TEST-1",
            college_name="Test College",
            email="role-student@example.edu",
            hashed_password=password_hasher.hash("StudentPassword123!"),
        )
        self.admin = Admin(
            full_name="Admin Account",
            email="role-admin@example.edu",
            hashed_password=password_hasher.hash("AdminPassword123!"),
            is_active=True,
        )
        self.db.add_all([self.student, self.admin])
        self.db.commit()
        self.db.refresh(self.student)
        self.db.refresh(self.admin)

    def tearDown(self):
        self.db.close()
        self.engine.dispose()
        security.SECRET_KEY = self.previous_secret

    def _credentials(self, access_token):
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials=access_token)

    def test_admin_login_and_refresh_keep_admin_role(self):
        response = Response()
        login = login_student(
            StudentLoginRequest(
                identifier=self.admin.email,
                password="AdminPassword123!",
            ),
            response,
            self.db,
        )
        self.assertEqual(login.account_type, "admin")
        self.assertIsNone(login.student_id)
        claims = jwt.decode(
            login.access_token,
            security.SECRET_KEY,
            algorithms=[security.TOKEN_ALGORITHM],
        )
        self.assertEqual(claims["account_type"], "admin")

        cookie_values = SimpleCookie()
        for cookie in response.headers.getlist("set-cookie"):
            cookie_values.load(cookie)
        refresh_token = cookie_values[REFRESH_COOKIE_NAME].value
        csrf_token = cookie_values[CSRF_COOKIE_NAME].value
        refresh_response = Response()
        refreshed = refresh_access_token(
            refresh_response,
            refresh_token=refresh_token,
            csrf_cookie=csrf_token,
            csrf_header=csrf_token,
            origin=FRONTEND_URL,
            db=self.db,
        )
        refreshed_claims = jwt.decode(
            refreshed.access_token,
            security.SECRET_KEY,
            algorithms=[security.TOKEN_ALGORITHM],
        )
        self.assertEqual(refreshed_claims["account_type"], "admin")
        self.assertEqual(
            security.get_current_admin(self._credentials(refreshed.access_token), self.db).id,
            self.admin.id,
        )

        with self.assertRaises(HTTPException) as error:
            security.get_current_student(self._credentials(refreshed.access_token), self.db)
        self.assertEqual(error.exception.status_code, 403)
        self.assertEqual(
            self.db.scalar(
                select(AdminRefreshSession).where(
                    AdminRefreshSession.admin_id == self.admin.id
                )
            ).admin_id,
            self.admin.id,
        )

    def test_student_token_cannot_authorize_as_admin(self):
        login = login_student(
            StudentLoginRequest(
                identifier=self.student.student_id,
                password="StudentPassword123!",
            ),
            Response(),
            self.db,
        )
        self.assertEqual(login.account_type, "student")
        self.assertEqual(
            security.get_current_student(self._credentials(login.access_token), self.db).id,
            self.student.id,
        )
        with self.assertRaises(HTTPException) as error:
            security.get_current_admin(self._credentials(login.access_token), self.db)
        self.assertEqual(error.exception.status_code, 403)

    def test_student_login_accepts_student_id_case_insensitively(self):
        login = login_student(
            StudentLoginRequest(
                identifier=self.student.student_id.lower(),
                password="StudentPassword123!",
            ),
            Response(),
            self.db,
        )
        self.assertEqual(login.account_type, "student")
        self.assertEqual(login.student_id, self.student.student_id)
        self.assertEqual(login.full_name, self.student.full_name)

    def test_missing_credentials_cannot_access_admin_dependency(self):
        with self.assertRaises(HTTPException) as error:
            security.get_current_admin(None, self.db)
        self.assertEqual(error.exception.status_code, 401)

    def test_admin_role_in_registration_body_does_not_create_admin(self):
        admin_count = len(self.db.scalars(select(Admin)).all())
        payload = StudentRegistrationRequest.model_validate(
            {
                "full_name": "Public Student",
                "student_id": "PUBLIC-1",
                "college_name": "Test College",
                "email": "public-student@example.edu",
                "password": "PublicPassword123!",
                "role": "admin",
            }
        )
        register_student(payload, self.db)
        created_student = self.db.scalar(
            select(Student).where(Student.email == "public-student@example.edu")
        )
        self.assertIsNotNone(created_student)
        self.assertFalse(hasattr(created_student, "role"))
        self.assertEqual(len(self.db.scalars(select(Admin)).all()), admin_count)

    def test_student_registration_cannot_claim_provisioned_admin_email(self):
        payload = StudentRegistrationRequest(
            full_name="Collision Student",
            student_id="COLLISION-1",
            college_name="Test College",
            email=self.admin.email,
            password="CollisionPassword123!",
        )
        with self.assertRaises(HTTPException) as error:
            register_student(payload, self.db)
        self.assertEqual(error.exception.status_code, 409)

    def test_student_id_cannot_collide_with_provisioned_admin_email(self):
        payload = StudentRegistrationRequest(
            full_name="Collision Student",
            student_id=self.admin.email.upper(),
            college_name="Test College",
            email="another-student@example.edu",
            password="CollisionPassword123!",
        )
        with self.assertRaises(HTTPException) as error:
            register_student(payload, self.db)
        self.assertEqual(error.exception.status_code, 409)

    def test_provisioning_hashes_password_and_never_overwrites_existing_admin(self):
        created = provision_admin_account(
            self.db,
            "new-admin@example.edu",
            "New Admin",
            "VeryStrongProvisionPassword123!",
        )
        self.assertTrue(created)
        admin = self.db.scalar(
            select(Admin).where(Admin.email == "new-admin@example.edu")
        )
        original_hash = admin.hashed_password
        self.assertNotEqual(original_hash, "VeryStrongProvisionPassword123!")

        created_again = provision_admin_account(
            self.db,
            "new-admin@example.edu",
            "Changed Name",
            "DifferentStrongPassword123!",
        )
        self.assertFalse(created_again)
        self.assertEqual(admin.full_name, "New Admin")
        self.assertEqual(admin.hashed_password, original_hash)


if __name__ == "__main__":
    unittest.main()
