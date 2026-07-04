import uvicorn
from fastapi import FastAPI
from src.api.chat import router as chat_router
from src.api.authentication import router as authentication_router
from src.api.admin import router as admin_router
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.include_router(chat_router)
app.include_router(authentication_router)
app.include_router(admin_router)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def index():
    return FileResponse("static/index.html")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", reload=True)