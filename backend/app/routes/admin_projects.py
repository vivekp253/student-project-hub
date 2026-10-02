from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Admin, Project
from app.schemas import ProjectModerationStatus, ProjectResponse, ProjectReviewRequest
from app.security import get_current_admin

router = APIRouter(prefix="/api/admin/projects", tags=["admin-projects"])
FINAL_STATUSES = {"Approved", "Rejected"}
REVIEWABLE_STATUSES = {"Pending", "Changes Requested"}


def _get_project(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    return project


def _record_review(
    project: Project,
    moderation_status: ProjectModerationStatus,
    payload: ProjectReviewRequest | None,
    admin: Admin,
    db: Session,
    require_feedback: bool,
) -> ProjectResponse:
    if project.moderation_status in FINAL_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project has already been {project.moderation_status.lower()}.",
        )
    if project.moderation_status not in REVIEWABLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project is not in a reviewable moderation state.",
        )

    feedback = payload.feedback.strip() if payload and payload.feedback else None
    if require_feedback and not feedback:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Feedback is required for this review decision.",
        )

    project.moderation_status = moderation_status
    project.review_feedback = feedback
    project.reviewed_by_admin_id = admin.id
    project.reviewed_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(project)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Project review could not be saved.",
        ) from None

    return project


@router.get("", response_model=list[ProjectResponse])
def list_submitted_projects(
    moderation_status: ProjectModerationStatus | None = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
) -> list[ProjectResponse]:
    statement = select(Project)
    if moderation_status is not None:
        statement = statement.where(Project.moderation_status == moderation_status)

    try:
        return list(
            db.scalars(
                statement.order_by(Project.created_at.desc(), Project.id.desc())
            ).all()
        )
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Projects could not be retrieved.",
        ) from None


@router.get("/{project_id}", response_model=ProjectResponse)
def get_submitted_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
) -> ProjectResponse:
    return _get_project(db, project_id)


@router.post("/{project_id}/approve", response_model=ProjectResponse)
def approve_project(
    project_id: int,
    payload: ProjectReviewRequest | None = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
) -> ProjectResponse:
    return _record_review(
        _get_project(db, project_id),
        "Approved",
        payload,
        current_admin,
        db,
        require_feedback=False,
    )


@router.post("/{project_id}/reject", response_model=ProjectResponse)
def reject_project(
    project_id: int,
    payload: ProjectReviewRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
) -> ProjectResponse:
    return _record_review(
        _get_project(db, project_id),
        "Rejected",
        payload,
        current_admin,
        db,
        require_feedback=True,
    )


@router.post("/{project_id}/request-changes", response_model=ProjectResponse)
def request_project_changes(
    project_id: int,
    payload: ProjectReviewRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
) -> ProjectResponse:
    return _record_review(
        _get_project(db, project_id),
        "Changes Requested",
        payload,
        current_admin,
        db,
        require_feedback=True,
    )
