from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey
from src.database import Base


class ProjectsORM(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    description: Mapped[str]

    users: Mapped[list["UserORM"]] = relationship(
        back_populates="projects",
        secondary="user_projects"
    )