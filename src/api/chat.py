from fastapi import APIRouter

from src.schemas.chat import ChatRequest
from src.services.claude_service import chat

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("")
async def send_message(data: ChatRequest):
    result = await chat(
        user_id=data.user_id,
        prompt=data.prompt,
        file_path=data.file_path)

    return {"status": "OK", "result": result}