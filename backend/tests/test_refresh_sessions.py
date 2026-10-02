import secrets
import unittest
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Response
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

import app.security as security
from app.config import FRONTEND_URL
from app.database import Base
from app.models import RefreshSession, Student
from app.refresh_tokens import (
    CSRF_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    RefreshSessionError,
    create_refresh_session,
    revoke_refresh_session,
    rotate_refresh_session,
)
from app.routes.auth import login_student, logout_student, password_hasher, refresh_access_token
from app.schemas import StudentLoginRequest


class RefreshSessionTests(unittest.TestCase):
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
            full_name="Refresh Test Student",
            student_id="REFRESH-TEST-1",
            college_name="Test College",
            email="refresh-test@example.edu",
            hashed_password=password_hasher.hash("TestPassword123!"),
        )
        self.db.add(self.student)
        self.db.commit()
        self.db.refresh(self.student)

    def tearDown(self):
        self.db.close()
        self.engine.dispose()
        security.SECRET_KEY = self.previous_secret

    def test_access_token_expiry_is_rejected(self):
        now = datetime.now(timezone.utc)
        expired_access_token = jwt.encode(
            {
                "sub": str(self.student.id),
                "iat": now - timedelta(hours=1),
                "exp": now - timedelta(seconds=1),
                "token_type": "access",
            },
            security.SECRET_KEY,
            algorithm=security.TOKEN_ALGORITHM,
        )

        with self.assertRaises(HTTPException) as error:
            security.get_current_student(
                HTTPAuthorizationCredentials(
                    scheme="Bearer",
                    credentials=expired_access_token,
                ),
                self.db,
            )

        self.assertEqual(error.exception.status_code, 401)

    def test_login_issues_httponly_refresh_cookie(self):
        response = Response()
        login_response = login_student(
            StudentLoginRequest(
                identifier=self.student.email,
                password="TestPassword123!",
                remember_me=True,
            ),
            response,
            self.db,
        )
        cookies = response.headers.getlist("set-cookie")

        self.assertTrue(login_response.access_token)
        self.assertTrue(any(REFRESH_COOKIE_NAME in cookie and "httponly" in cookie.lower() for cookie in cookies))
        self.assertTrue(any(CSRF_COOKIE_NAME in cookie and "httponly" not in cookie.lower() for cookie in cookies))
        self.assertNotIn(REFRESH_COOKIE_NAME, login_response.model_dump_json())
        stored_session = self.db.scalar(
            select(RefreshSession).where(RefreshSession.student_id == self.student.id)
        )
        self.assertNotEqual(stored_session.token_hash, cookies[0].split("=", 1)[-1].split(";", 1)[0])

    def test_refresh_rotates_tokens_and_csrf_cookie(self):
        grant = create_refresh_session(self.db, self.student.id, remember_me=False)
        old_hash = grant.session.token_hash
        response = Response()

        access_response = refresh_access_token(
            response,
            refresh_token=grant.refresh_token,
            csrf_cookie=grant.csrf_token,
            csrf_header=grant.csrf_token,
            origin=FRONTEND_URL,
            db=self.db,
        )

        sessions = list(
            self.db.scalars(
                select(RefreshSession).where(
                    RefreshSession.family_id == grant.session.family_id
                )
            ).all()
        )
        self.assertTrue(access_response.access_token)
        self.assertEqual(len(sessions), 2)
        self.assertNotEqual(sessions[1].token_hash, old_hash)
        self.assertTrue(any(REFRESH_COOKIE_NAME in cookie for cookie in response.headers.getlist("set-cookie")))
        self.assertTrue(any(CSRF_COOKIE_NAME in cookie for cookie in response.headers.getlist("set-cookie")))
        self.assertEqual(
            sessions[1].expires_at,
            sessions[0].expires_at,
        )

    def test_reuse_revokes_active_family(self):
        first = create_refresh_session(self.db, self.student.id, remember_me=False)
        second = rotate_refresh_session(
            self.db,
            first.refresh_token,
            first.csrf_token,
            first.csrf_token,
            FRONTEND_URL,
        )

        with self.assertRaises(RefreshSessionError) as error:
            rotate_refresh_session(
                self.db,
                first.refresh_token,
                first.csrf_token,
                first.csrf_token,
                FRONTEND_URL,
            )

        self.assertEqual(error.exception.status_code, 401)
        self.assertIsNotNone(self.db.get(RefreshSession, second.session.id).revoked_at)

    def test_expired_refresh_session_is_rejected(self):
        grant = create_refresh_session(self.db, self.student.id, remember_me=False)
        row = self.db.get(RefreshSession, grant.session.id)
        row.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
        self.db.commit()

        with self.assertRaises(RefreshSessionError) as error:
            rotate_refresh_session(
                self.db,
                grant.refresh_token,
                grant.csrf_token,
                grant.csrf_token,
                FRONTEND_URL,
            )

        self.assertEqual(error.exception.status_code, 401)

    def test_invalid_refresh_token_is_rejected(self):
        with self.assertRaises(RefreshSessionError) as error:
            rotate_refresh_session(
                self.db,
                "not-a-valid-refresh-token",
                "csrf-value",
                "csrf-value",
                FRONTEND_URL,
            )

        self.assertEqual(error.exception.status_code, 401)

    def test_logout_revokes_session_and_clears_cookies(self):
        grant = create_refresh_session(self.db, self.student.id, remember_me=False)
        response = Response()

        result = logout_student(
            response,
            refresh_token=grant.refresh_token,
            csrf_cookie=grant.csrf_token,
            csrf_header=grant.csrf_token,
            origin=FRONTEND_URL,
            db=self.db,
        )

        self.assertEqual(result.status_code, 204)
        self.assertIsNotNone(self.db.get(RefreshSession, grant.session.id).revoked_at)
        self.assertEqual(len(response.headers.getlist("set-cookie")), 2)

    def test_remember_me_controls_refresh_lifetime(self):
        regular = create_refresh_session(self.db, self.student.id, remember_me=False)
        remembered = create_refresh_session(self.db, self.student.id, remember_me=True)

        self.assertGreater(
            remembered.session.expires_at,
            regular.session.expires_at + timedelta(days=29),
        )

    def test_csrf_and_origin_are_required(self):
        grant = create_refresh_session(self.db, self.student.id, remember_me=False)

        with self.assertRaises(RefreshSessionError) as csrf_error:
            rotate_refresh_session(
                self.db,
                grant.refresh_token,
                grant.csrf_token,
                "wrong-csrf-value",
                FRONTEND_URL,
            )
        self.assertEqual(csrf_error.exception.status_code, 403)

        with self.assertRaises(RefreshSessionError) as origin_error:
            rotate_refresh_session(
                self.db,
                grant.refresh_token,
                grant.csrf_token,
                grant.csrf_token,
                "https://unexpected.example",
            )
        self.assertEqual(origin_error.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()