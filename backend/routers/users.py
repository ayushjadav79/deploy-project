from fastapi import APIRouter, Depends
import models, schemas
from dependencies import get_current_user

router = APIRouter(tags=["Users"])

@router.get("/home", response_model=schemas.UserResponse)
def home(current_user: models.User = Depends(get_current_user)):
    return current_user
