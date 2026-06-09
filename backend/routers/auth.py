import logging
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from db.session import get_db
from schemas.user import UserCreate, UserResponse
from services.auth_service import register_user, authenticate_user, generate_token
from dependencies.auth import get_current_user
from core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from models.user import User
from cache.redis_client import cache_delete

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    new_user = register_user(db, user.username, user.password)
    if not new_user:
        logger.warning("Registration failed: username '%s' already exists", user.username)
        raise HTTPException(status_code=400, detail="Username already registered")
    logger.info("New user registered: '%s'", new_user.username)
    return new_user


@router.post("/login")
def login(response: Response, user: UserCreate, db: Session = Depends(get_db)):
    db_user = authenticate_user(db, user.username, user.password)
    if not db_user:
        logger.warning("Login failed: invalid credentials for username '%s'", user.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = generate_token(db_user.username)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False  # Set True in production with HTTPS
    )
    logger.info("User '%s' logged in successfully", db_user.username)
    return {"message": "Login successful"}


@router.post("/logout", dependencies=[Depends(get_current_user)])
def logout(response: Response, current_user: User = Depends(get_current_user)):
    cache_delete(f"user:{current_user.username}")
    response.delete_cookie("access_token")
    logger.info("User '%s' logged out", current_user.username)
    return {"message": "Logged out successfully"}
