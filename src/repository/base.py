from pydantic import BaseModel
from sqlalchemy import insert, select, delete, Sequence

from src.exceptions import ObjectNotFoundException


class BaseRepository:
    model = None
    schema = None

    def __init__(self, session):
        self.session = session

    async def add(self, data: BaseModel):
        query = insert(self.model).values(**data.model_dump())
        result = await self.session.execute(query)
        return result.scalars().all()

    async def add_bulk(self, data: Sequence[BaseModel]):
        add_data_stmt = insert(self.model).values([item.model_dump() for item in data])
        await self.session.execute(add_data_stmt)

    async def get_one(self, **filter_by):
        query = select(self.model).filter_by(**filter_by)
        result = await self.session.execute(query)
        obj = result.scalars().one_or_none()
        if not obj:
            raise ObjectNotFoundException

        return obj

    async def get_filter_by(self, **filter_by):
        query = select(self.model).filter_by(**filter_by)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def delete(self, **filter_by):
        query = delete(self.model).filter_by(**filter_by)
        await self.session.execute(query)