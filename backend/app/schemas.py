from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


ProjectCategory = Literal[
    "AI/ML",
    "Data Science",
    "Web Development",
    "Mobile App",
    "Other",
]
ProjectStatus = Literal["Completed", "In Progress"]


class StudentRegistrationRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    student_id: str = Field(min_length=1, max_length=64)
    college_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("full_name", "student_id", "college_name", mode="before")
    @classmethod
    def trim_required_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()


class StudentRegistrationResponse(BaseModel):
    message: str
    id: int
    student_id: str



class StudentLoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=320)
    password: str = Field(min_length=8, max_length=128)
    remember_me: bool = False

    @field_validator("identifier", mode="before")
    @classmethod
    def trim_identifier(cls, value):
        return value.strip() if isinstance(value, str) else value


class StudentLoginResponse(BaseModel):
    message: str
    id: int
    student_id: str
    full_name: str
    access_token: str
    token_type: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProjectCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category: ProjectCategory | None = None
    description: str = Field(min_length=1, max_length=5000)
    abstract: str | None = Field(default=None, max_length=20000)
    technologies: str | None = Field(default=None, max_length=2000)
    status: ProjectStatus | None = None

    @field_validator("title", "description", mode="before")
    @classmethod
    def trim_required_project_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("category", "abstract", "technologies", "status", mode="before")
    @classmethod
    def trim_optional_project_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value or value.lower() == "not available yet":
                return None
        return value


class ProjectUpdateRequest(ProjectCreateRequest):
    pass


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: ProjectCategory | None
    description: str
    abstract: str | None
    technologies: str | None
    status: ProjectStatus | None
    created_at: datetime