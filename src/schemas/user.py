from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict

from src.schemas.project import Projects


class UserRole(str, Enum):
    admin = 'admin'
    user = 'user'

class User(BaseModel):
    id: int
    login: str
    hashed_password: str
    is_active: bool
    role: UserRole
    created_at: datetime

class UserRequest(BaseModel):
    login: str
    password: str

class UserLogin(BaseModel):
    login: str
    password: str

class UserAddRequest(BaseModel):
    login: str
    hashed_password: str

class UserResponse(BaseModel):
    id: int
    login: str
    role: UserRole
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserResponseWithRels(UserResponse):
    projects: list[Projects]