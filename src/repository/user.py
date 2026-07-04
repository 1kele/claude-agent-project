from src.model import UserORM, UserProjectsORM
from src.repository.base import BaseRepository
from src.schemas.user import User, UserResponse, UserResponseWithRels
from sqlalchemy import select
from sqlalchemy.orm import joinedload

class UserRepository(BaseRepository):
    model = UserORM
    schema = User

    async def get_all_user_projects(self, user_id: int, offset: int, limit: int):
        query = (
            select(self.model)
            .options(joinedload(self.model.projects))
            .filter_by(id=user_id)
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return [UserResponseWithRels.model_validate(model) for model in result.unique().scalars().all()]

    async def get_all_users(self, offset: int, limit: int):
        query = select(self.model).offset(offset).limit(limit)
        result = await self.session.execute(query)

        return [
            UserResponse.model_validate(user_attribute)
            for user_attribute in result.scalars().all()
        ]