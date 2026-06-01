from sqlalchemy.orm import Session
from repositories.user_repo import get_user_by_username, create_user
from core.security import verify_password, create_access_token
from datetime import timedelta
from core.config import ACCESS_TOKEN_EXPIRE_MINUTES

def register_user(db: Session, username: str, password: str):
    existing = get_user_by_username(db, username)
    if existing:
        return None  # caller raises HTTP error
    return create_user(db, username, password)

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def generate_token(username: str) -> str:
    return create_access_token(
        data={"sub": username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
