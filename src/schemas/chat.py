from pydantic import BaseModel


class ChatRequest(BaseModel):
    user_id: str
    prompt: str
    file_path: str | None = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class SaveChatRequest(BaseModel):
    chat_history: list