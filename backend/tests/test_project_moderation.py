import secrets
import unittest
from datetime import datetime, timezone

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

import app.database as database
import app.security as security
from app.database import Base
from app.models import Admin, Project, Student
from app.routes.admin_projects import (
    approve_project,
    get_submitted_project,
    list_submitted_projects,
    reject_project,
    request_project_changes,
)
from app.routes.projects import create_project, list_student_projects
from app.schemas import ProjectCreateRequest, ProjectReviewRequest


class ProjectModerationTests(unittest.TestCase):
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
            full_name="Project Owner",
            student_id="MOD-STUDENT-1",
            college_name="Test College",
            email="moderation-student@example.edu",
            hashed_password="test-hash",
        )
        self.other_student = Student(
            full_name="Other Student",
            student_id="MOD-STUDENT-2",
            college_name="Test College",
            email="moderation-other@example.edu",
            hashed_password="test-hash",
        )
        self.admin = Admin(
            full_name="Project Reviewer",
            email="moderation-admin@example.edu",
            hashed_password="test-hash",
            is_active=True,
        )
        self.db.add_all([self.student, self.other_student, self.admin])
        self.db.commit()
        self.db.refresh(self.student)
        self.db.refresh(self.other_student)
        self.db.refresh(self.admin)

    def tearDown(self):
        self.db.close()
        self.engine.dispose()
        security.SECRET_KEY = self.previous_secret

    def _create_project(self, student=None, title="Moderation Test Project"):
        owner = student or self.student
        return create_project(
            ProjectCreateRequest(
                title=title,
                category="Data Science",
                description="Submitted project description.",
                status="Completed",
            ),
            self.db,
            owner,
        )

    def _project_for_review(self, title="Review Project"):
        return self._create_project(title=title)

    def test_new_project_is_pending_and_completion_status_is_separate(self):
        project = self._create_project()
        self.assertEqual(project.moderation_status, "Pending")
        self.assertEqual(project.status, "Completed")

    def test_student_token_cannot_access_admin_dependency(self):
        token = security.create_access_token(
            self.student.id,
            account_type="student",
        )
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token,
        )
        with self.assertRaises(HTTPException) as error:
            security.get_current_admin(credentials, self.db)
        self.assertEqual(error.exception.status_code, 403)

    def test_admin_token_cannot_access_student_project_dependency(self):
        token = security.create_access_token(
            self.admin.id,
            account_type="admin",
        )
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token,
        )
        with self.assertRaises(HTTPException) as error:
            security.get_current_student(credentials, self.db)
        self.assertEqual(error.exception.status_code, 403)
        self.assertEqual(security.get_current_admin(credentials, self.db).id, self.admin.id)

    def test_student_project_listing_remains_owner_scoped(self):
        own_project = self._create_project(self.student, "Owner Project")
        self._create_project(self.other_student, "Other Project")
        projects = list_student_projects(self.db, self.student)
        self.assertEqual([project.id for project in projects], [own_project.id])

    def test_admin_can_list_and_view_submitted_projects(self):
        project = self._project_for_review()
        projects = list_submitted_projects(None, self.db, self.admin)
        self.assertIn(project.id, [item.id for item in projects])
        self.assertEqual(
            get_submitted_project(project.id, self.db, self.admin).id,
            project.id,
        )

    def test_approval_records_admin_and_timestamp_without_changing_completion(self):
        project = self._project_for_review()
        reviewed = approve_project(project.id, None, self.db, self.admin)
        self.assertEqual(reviewed.moderation_status, "Approved")
        self.assertEqual(reviewed.status, "Completed")
        self.assertEqual(reviewed.reviewed_by_admin_id, self.admin.id)
        self.assertIsNotNone(reviewed.reviewed_at)

    def test_reject_and_request_changes_require_feedback(self):
        rejected_project = self._project_for_review("Reject Me")
        changes_project = self._project_for_review("Request Changes")

        with self.assertRaises(HTTPException) as reject_error:
            reject_project(
                rejected_project.id,
                ProjectReviewRequest(feedback="  "),
                self.db,
                self.admin,
            )
        self.assertEqual(reject_error.exception.status_code, 422)

        rejected = reject_project(
            rejected_project.id,
            ProjectReviewRequest(feedback="Please address the review notes."),
            self.db,
            self.admin,
        )
        self.assertEqual(rejected.moderation_status, "Rejected")
        self.assertEqual(rejected.review_feedback, "Please address the review notes.")
        self.assertEqual(rejected.reviewed_by_admin_id, self.admin.id)

        requested = request_project_changes(
            changes_project.id,
            ProjectReviewRequest(feedback="Please add the missing details."),
            self.db,
            self.admin,
        )
        self.assertEqual(requested.moderation_status, "Changes Requested")
        self.assertEqual(requested.reviewed_by_admin_id, self.admin.id)
        self.assertIsInstance(requested.reviewed_at, datetime)

    def test_final_review_state_cannot_be_replaced(self):
        project = self._project_for_review()
        approve_project(project.id, None, self.db, self.admin)
        with self.assertRaises(HTTPException) as error:
            reject_project(
                project.id,
                ProjectReviewRequest(feedback="Reject after approval"),
                self.db,
                self.admin,
            )
        self.assertEqual(error.exception.status_code, 409)

    def test_additive_migration_preserves_existing_project_rows(self):
        legacy_engine = create_engine("sqlite://", poolclass=StaticPool)
        connection = legacy_engine.connect()
        connection.execute(text("CREATE TABLE students (id INTEGER PRIMARY KEY)"))
        connection.execute(text("CREATE TABLE admins (id INTEGER PRIMARY KEY)"))
        connection.execute(
            text(
                "CREATE TABLE projects (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL, "
                "title VARCHAR(200) NOT NULL, description TEXT NOT NULL, created_at DATETIME NOT NULL)"
            )
        )
        connection.execute(
            text(
                "INSERT INTO projects (id, owner_id, title, description, created_at) "
                "VALUES (1, 9, 'Legacy Project', 'Keep this row', CURRENT_TIMESTAMP)"
            )
        )
        connection.commit()
        previous_engine = database.engine
        try:
            database.engine = legacy_engine
            database.ensure_project_moderation_schema()
            row = connection.execute(
                text(
                    "SELECT id, title, description, moderation_status "
                    "FROM projects WHERE id = 1"
                )
            ).one()
            self.assertEqual(row, (1, "Legacy Project", "Keep this row", "Pending"))
        finally:
            database.engine = previous_engine
            connection.close()
            legacy_engine.dispose()


if __name__ == "__main__":
    unittest.main()
