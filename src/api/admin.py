from fastapi import APIRouter, Query, HTTPException

from src.api.dependencis import AdminDep, DBDep
from src.exceptions import ObjectNotFoundHTTPException, ObjectNotFoundException
from src.schemas.project import ProjectRequest
from src.schemas.user_projects import UserProjectsRequest

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
async def get_all_users(
    db: DBDep,
    current_user: AdminDep,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, lt=30),

):
    result = await db.user.get_all_users(
        offset=(page-1)*per_page,
        limit=per_page,
    )

    return {"status": "OK", "data": result}

@router.get("/user")
async def get_user(
    db: DBDep,
    current_user: AdminDep,
    user_id: int | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, lt=30),
):
    try:
        if user_id:
            result = await db.user.get_all_user_projects(
                user_id=user_id,
                offset=(page - 1) * per_page,
                limit=per_page,
            )
        else:
            raise HTTPException(status_code=403, detail="Укажите ID пользователя")
    except ObjectNotFoundException:
        raise ObjectNotFoundHTTPException

    return {"status": "OK", "data": result}

@router.get("/projects")
async def get_all_projects(
    current_user: AdminDep,
    db: DBDep,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, lt=30),
):
    result = await db.project.get_all_projects(
        offset=(page - 1) * per_page,
        limit=per_page,
    )
    return {"status": "OK", "data": result}

@router.post("/projects")
async def add_project(
    db: DBDep,
    current_user: AdminDep,
    data: ProjectRequest
):
    await db.project.add(data)
    await db.commit()

    return {"status": "OK"}


@router.delete("/projects/{project_id}")
async def delete_project(
    db: DBDep,
    current_user: AdminDep,
    project_id: int
):
    await db.project.delete(id=project_id)
    await db.commit()

    return {"status": "OK"}

@router.post("")
async def grant_access_to_user(
    db: DBDep,
    current_user: AdminDep,
    user_login: str | None = None,
    user_id: int | None = None,
    allowed_projects: list[int] | None = None,
):
    if user_login:
        granted_user = await db.user.get_one(login=user_login)
    elif user_id:
        granted_user = await db.user.get_one(id=user_id)
    else:
        raise HTTPException(status_code=403, detail="Укажите логин или ID пользователя")

    user_project = [UserProjectsRequest(user_id=granted_user.id, project_id=project_id) for project_id in allowed_projects]
    await db.user_project.add_bulk(user_project)
    await db.commit()

    return {"status": "OK"}