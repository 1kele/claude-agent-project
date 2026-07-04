from pydantic import BaseModel, ConfigDict


class Projects(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str

class ProjectRequest(BaseModel):
    name: str
    description: str