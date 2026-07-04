
from datetime import datetime, timezone, timedelta

import jwt
from pwdlib import PasswordHash

from src.config import settings


password_hash = PasswordHash.recommended()

class Authentication:

    @staticmethod
    def get_password_hash(password) -> str:
        return password_hash.hash(password)

    @staticmethod
    def create_access_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> dict:
        return jwt.decode(token, settings.SECRET_KEY, algorithm=settings.ALGORITHM)