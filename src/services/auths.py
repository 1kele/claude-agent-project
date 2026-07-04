
from pwdlib import PasswordHash
from sqlalchemy.exc import IntegrityError

from src.api.dependencis import DBDep, CurrentUserDep
from src.exceptions import UserAlreadyExistsException, UserIsBlockedHTTPException, ObjectNotFoundException, \
    ObjectNotFoundHTTPException, WrongPasswordHTTPException, WrongPasswordException, UserIsBlockedException
from src.schemas.user import UserRequest, UserAddRequest, UserLogin, UserResponse
from src.services.auth import Authentication
from src.services.base import BaseService
from fastapi import Response

password_hash = PasswordHash.recommended()

class AuthenticationService(BaseService):

    @staticmethod
    def verify_password(plain_password, hashed_password):
        return password_hash.verify(plain_password, hashed_password)

    async def register_new_user(self, user: UserRequest):
        hashed_password = Authentication.get_password_hash(user.password)
        new_user = UserAddRequest(
            login=user.login,
            hashed_password=hashed_password,
        )

        try:
            await self.db.user.add(new_user)
            await self.db.commit()
        except IntegrityError:
            raise UserAlreadyExistsException

    async def login_user(self,
        user: UserLogin,
        response: Response
    ) -> str:
        try:
            result = await self.db.user.get_one(login=user.login)
            if not result.is_active:
                raise UserIsBlockedException
        except ObjectNotFoundException:
            raise

        if not self.verify_password(user.password, result.hashed_password):
            raise WrongPasswordException

        access_token = Authentication.create_access_token(data={"user_id": result.id})
        response.set_cookie("access_token", access_token)

        return access_token

    @staticmethod
    async def get_user(current_user: CurrentUserDep):
        return UserResponse.model_validate(current_user)

    @staticmethod
    async def logout_user(response: Response):
        response.delete_cookie("access_token")