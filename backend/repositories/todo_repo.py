from sqlalchemy.orm import Session
from models.todo import Todo

def get_todos(db: Session, user_id: int) -> list[Todo]:
    return db.query(Todo).filter(Todo.user_id == user_id).all()

def create_todo(db: Session, title: str, user_id: int) -> Todo:
    todo = Todo(title=title, user_id=user_id)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo

def update_todo(db: Session, todo_id: int, user_id: int, title: str | None, completed: bool | None) -> Todo | None:
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not todo:
        return None
    if title is not None:
        todo.title = title
    if completed is not None:
        todo.completed = completed
    db.commit()
    db.refresh(todo)
    return todo

def delete_todo(db: Session, todo_id: int, user_id: int) -> bool:
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user_id).first()
    if not todo:
        return False
    db.delete(todo)
    db.commit()
    return True