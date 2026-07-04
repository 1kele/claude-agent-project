import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import func
from src.database import Base


class UserORM(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    login: Mapped[str] = mapped_column(unique=True)
    hashed_password: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True)
    role: Mapped[str]  = mapped_column(default="user") # user/admin
    created_at: Mapped[datetime.date] = mapped_column(server_default=func.now())

    projects: Mapped[list["ProjectsORM"]] = relationship(
        back_populates="users",
        secondary="user_projects"
    )