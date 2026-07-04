from src.model import UserProjectsORM
from src.repository.base import BaseRepository
from src.schemas.user_projects import UserProjects


class UserProjectsRepository(BaseRepository):
    model = UserProjectsORM
    schema = UserProjects