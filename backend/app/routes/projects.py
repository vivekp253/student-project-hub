from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project, Student
from app.schemas import ProjectCreateRequest, ProjectResponse, ProjectUpdateRequest
from app.security import get_current_student

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _get_owned_project(
    project_id: int,
    db: Session,
    current_student: Student,
) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    if project.owner_id != current_student.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this project.",
        )
    return project


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    payload: ProjectCreateRequest,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
) -> ProjectResponse:
    project = Project(
        owner_id=current_student.id,
        title=payload.title,
        category=payload.category,
        description=payload.description,
        abstract=payload.abstract,
        technologies=payload.technologies,
        status=payload.status,
    )

    try:
        db.add(project)
        db.commit()
        db.refresh(project)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Project could not be saved.",
        ) from None

    return project


@router.get("", response_model=list[ProjectResponse])
def list_student_projects(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
) -> list[ProjectResponse]:
    try:
        return list(
            db.scalars(
                select(Project)
                .where(Project.owner_id == current_student.id)
                .order_by(Project.created_at.desc(), Project.id.desc())
            ).all()
        )
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Projects could not be retrieved.",
        ) from None


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    payload: ProjectUpdateRequest,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
) -> ProjectResponse:
    project = _get_owned_project(project_id, db, current_student)

    for field, value in payload.model_dump().items():
        setattr(project, field, value)

    try:
        db.commit()
        db.refresh(project)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Project could not be updated.",
        ) from None

    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student),
) -> Response:
    project = _get_owned_project(project_id, db, current_student)

    try:
        db.delete(project)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Project could not be deleted.",
        ) from None

    return Response(status_code=status.HTTP_204_NO_CONTENT)