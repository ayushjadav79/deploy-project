from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from dependencies.auth import get_current_user
from models.user import User
from schemas.todo import TodoCreate, TodoUpdate, TodoResponse
from repositories import todo_repo

router = APIRouter(prefix="/todos", tags=["Todos"])

@router.get("/", response_model=list[TodoResponse])
def get_todos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return todo_repo.get_todos(db, current_user.id)

@router.post("/", response_model=TodoResponse, status_code=201)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return todo_repo.create_todo(db, todo.title, current_user.id)

@router.patch("/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, todo: TodoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updated = todo_repo.update_todo(db, todo_id, current_user.id, todo.title, todo.completed)
    if not updated:
        raise HTTPException(status_code=404, detail="Todo not found")
    return updated

@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deleted = todo_repo.delete_todo(db, todo_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Todo not found")