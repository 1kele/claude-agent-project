from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey
from src.database import Base


class UserProjectsORM(Base):
    __tablename__ = "user_projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))


