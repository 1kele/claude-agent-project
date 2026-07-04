from pydantic import BaseModel


class UserProjects(BaseModel):
    id: int
    user_id: int
    project_id: int

class UserProjectsRequest(BaseModel):
    user_id: int
    project_id: int