import json
import os
import subprocess
import uuid

import aiofiles

from fastapi.responses import FileResponse
active_sessions: dict[str, str] = {}


PROJECTS_BASE_DIR = "projects"

async def chat(user_id: str, prompt: str, file_path: str) -> dict:
    work_dir = f"/tmp/claude_sessions/{user_id}"
    os.makedirs(work_dir, exist_ok=True)

    full_project_path = None
    final_prompt = prompt

    if file_path:
        full_project_path = os.path.abspath(os.path.join(PROJECTS_BASE_DIR, file_path))
        final_prompt = f"Документация находится в папке {full_project_path}. {prompt}"

    if user_id not in active_sessions:
        token_uuid = str(uuid.uuid4())

        cmd = ["claude", "-p", final_prompt,"--effort", "low", "--session-id", f"{token_uuid}"]

        active_sessions[user_id] = token_uuid

    else:
        token_uuid = active_sessions[user_id]
        cmd = ["claude", "-p", final_prompt, "--effort", "low", "--resume", f"{token_uuid}"]

    if full_project_path:
        cmd += ["--add-dir", full_project_path]

    result = subprocess.run(cmd, capture_output=True, text=True, cwd=work_dir)
    print("CMD:", cmd)
    print("FULL PATH EXISTS:", os.path.exists(full_project_path) if full_project_path else None)
    return {"response": result.stdout, "session_id": token_uuid}


async def save_chat_history(chat_history: list, project: str, chat_id: str)-> str:
    doc_dir = os.path.abspath(os.path.join(PROJECTS_BASE_DIR, project, "doc"))
    os.makedirs(doc_dir, exist_ok=True)

    file_path = os.path.join(doc_dir, f"{chat_id}.txt")

    async with aiofiles.open(file_path, 'w', encoding='utf-8') as file:
        await file.write(json.dumps(chat_history, ensure_ascii=False, indent=4))

    return file_path

async def get_chat_history(chat_id: str, project: str):
    doc_dir = os.path.abspath(os.path.join(PROJECTS_BASE_DIR, project, "doc"))
    file_path = os.path.join(doc_dir, f"{chat_id}.txt")

    return FileResponse(path=file_path, filename=f"{chat_id}.txt", media_type="text/plain")

async def delete_chat_history(chat_id: str, project: str) -> dict:
    doc_dir = os.path.abspath(os.path.join(PROJECTS_BASE_DIR, project, "doc"))
    file_path = os.path.join(doc_dir, f"{chat_id}.txt")

    try:
        os.remove(file_path)
        return {"status": "OK", "deleted": file_path}
    except FileNotFoundError:
        pass
    return {"status": "ERROR", "message": "File not found"}

async def list_chat_history(project: str) -> list:
    doc_dir = os.path.abspath(os.path.join(PROJECTS_BASE_DIR, project, "doc"))
    print("DOC DIR:", doc_dir)
    print("EXISTS:", os.path.exists(doc_dir))
    if not os.path.exists(doc_dir):
        return []
    return os.listdir(doc_dir)