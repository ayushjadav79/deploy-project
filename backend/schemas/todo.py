from pydantic import BaseModel

class TodoCreate(BaseModel):
    title: str

class TodoUpdate(BaseModel):
    title: str | None = None
    completed: bool | None = None

class TodoResponse(BaseModel):
    id: int
    title: str
    completed: bool
    user_id: int
    
    class Config:
        from_attributes = True