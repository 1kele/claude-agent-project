from fastapi import APIRouter
from src.api.dependencis import DBDep, CurrentUserDep
from src.exceptions import ObjectNotFoundException, ObjectNotFoundHTTPException, WrongPasswordHTTPException, \
    UserIsBlockedHTTPException, WrongPasswordException, UserIsBlockedException
from src.schemas.user import UserRequest, UserLogin
from pwdlib import PasswordHash
from fastapi import Response

from src.services.auths import AuthenticationService

router = APIRouter(prefix="/auth", tags=["authentication"])

password_hash = PasswordHash.recommended()

def get_password_hash(password):
    return password_hash.hash(password)

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)

@router.post("/register")
async def register(
    user: UserRequest,
    db: DBDep
):
    await AuthenticationService(db).register_new_user(user)
    return {"status": "OK"}


@router.post("/login")
async def login(
    user: UserLogin,
    db: DBDep,
    response: Response,
):
    try:
        result = await AuthenticationService(db).login_user(user,response)
    except ObjectNotFoundException:
        raise ObjectNotFoundHTTPException
    except WrongPasswordException:
        raise WrongPasswordHTTPException
    except UserIsBlockedException:
        raise UserIsBlockedHTTPException

    return {"access_token": result}

@router.get("/getme")
async def get_me(
    current_user: CurrentUserDep,
    db: DBDep
):
    result = await AuthenticationService(db).get_user(current_user)
    return {"data" : result}


@router.delete("/logout")
async def logout(
    db: DBDep,
    response: Response,
):
    await AuthenticationService(db).logout_user(response)
    return {"status": "OK"}