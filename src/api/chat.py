from fastapi import APIRouter, Query

from src.api.dependencis import CurrentUserDep, DBDep
from src.exceptions import ObjectNotFoundHTTPException
from src.schemas.chat import ChatRequest, SaveChatRequest
from src.services.claude_service import chat, get_chat_history, save_chat_history, delete_chat_history, \
    list_chat_history

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("")
async def send_message(data: ChatRequest):
    result = await chat(
        user_id=data.user_id,
        prompt=data.prompt,
        file_path=data.file_path)

    return {"status": "OK", "result": result}

@router.post("/{project}/{chat_id}")
async def save_chat(
    chat_id: str,
    project: str,
    data: SaveChatRequest
):
    return await save_chat_history(data.chat_history, project, chat_id)

@router.get("/{project}/files")
async def get_all_files(
    project: str,
):
    return await list_chat_history(project)

@router.get("/{project}/{chat_id}")
async def get_history(
    chat_id: str,
    project: str,
):
    return await get_chat_history(chat_id, project)

@router.delete("/{project}/{chat_id}")
async def delete_chat(
    chat_id: str,
    project: str,
):
    return await delete_chat_history(chat_id, project)

@router.get("")
async def list_allowed_projects(
    db: DBDep,
    current_user: CurrentUserDep,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, lt=30),
):
    result = await db.user.get_all_user_projects(
        current_user.id,
        offset=(page - 1) * per_page,
        limit=per_page,
    )
    if not result:
        raise ObjectNotFoundHTTPException

    return {"status": "OK", "data": result}