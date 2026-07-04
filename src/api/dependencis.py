import jwt
from fastapi import Depends, Request, HTTPException
from typing import Annotated

from src.config import settings
from src.database import async_session_maker
from src.db_manager import DBManager
from src.exceptions import ObjectNotFoundException
from src.schemas.user import User, UserRole


async def get_db():
    async with DBManager(session_factory=async_session_maker) as db:
        yield db


DBDep = Annotated[DBManager, Depends(get_db)]

def decode_token(token: str) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Токен не найден")

    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Токен истек")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Невалидный токен")

async def get_current_user(request: Request, db: DBDep):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Вы не авторизованы")

    payload = decode_token(token)
    user_id = payload.get("user_id")

    try:
        current_user = await db.user.get_one(id=user_id)
    except ObjectNotFoundException:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return current_user

CurrentUserDep = Annotated[User, Depends(get_current_user)]


async def get_current_admin(current_user: CurrentUserDep):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    return current_user

AdminDep = Annotated[User, Depends(get_current_admin)]