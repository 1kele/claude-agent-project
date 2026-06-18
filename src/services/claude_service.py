import os
import subprocess
import uuid
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