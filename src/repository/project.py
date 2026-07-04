from src.model import ProjectsORM
from src.repository.base import BaseRepository
from src.schemas.project import Projects
from sqlalchemy import select

class ProjectRepository(BaseRepository):
    model = ProjectsORM
    schema = Projects

    async def get_all_projects(self, offset: int, limit: int):
        query = (
            select(self.model).
            offset(offset).
            limit(limit)
        )
        result = await self.session.execute(query)

        return [
            Projects.model_validate(user_attribute)
            for user_attribute in result.scalars().all()
        ]