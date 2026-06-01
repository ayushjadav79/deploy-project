from fastapi import APIRouter, Depends
from schemas.user import UserResponse
from models.user import User
from dependencies.auth import get_current_user
from cache.redis_client import cache_set, cache_get

router = APIRouter(tags=["Users"])

@router.get("/home", response_model=UserResponse)
def home(current_user: User = Depends(get_current_user)):
    cache_key = f"user:{current_user.username}"

    # 1. Try cache first
    cached = cache_get(cache_key)
    if cached:
        return cached  # Pydantic will validate this dict

    # 2. Cache miss — build the response and store it
    user_data = {"id": current_user.id, "username": current_user.username}
    cache_set(cache_key, user_data, ttl_seconds=60)
    return current_user
