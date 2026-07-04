from fastapi import HTTPException


class ClaudeAgentExceptions(Exception):
    detail = "Неизвестная ошибка"

    def __init__(self, *args, **kwargs):
        super().__init__(self.detail, args, **kwargs)

class ObjectNotFoundException(ClaudeAgentExceptions):
    detail = "Объект не найден"

class UserAlreadyExistsException(ClaudeAgentExceptions):
    detail = "Пользователь уже существует"

class WrongPasswordException(ClaudeAgentExceptions):
    detail = "Неправильный пароль"

class UserIsBlockedException(ClaudeAgentExceptions):
    detail = "Пользователь заблокирован"

class ClaudeAgentHTTPExceptions(HTTPException):
    status_code = 500
    detail = None

    def __init__(self):
        super().__init__(status_code=self.status_code, detail=self.detail)

class ObjectNotFoundHTTPException(ClaudeAgentHTTPExceptions):
    status_code = 404
    detail = "Такого объекта не существует"

class WrongPasswordHTTPException(ClaudeAgentHTTPExceptions):
    status_code = 401
    detail = "Неправильный пароль"

class CookieExpiredHTTPException(ClaudeAgentHTTPExceptions):
    status_code = 401
    detail = "Токен истек"

class UserIsBlockedHTTPException(ClaudeAgentHTTPExceptions):
    status_code = 403
    detail = "Вы заблокированы!"