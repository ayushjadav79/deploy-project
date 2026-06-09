import re
from pydantic import BaseModel, field_validator


class UserCreate(BaseModel):
    username: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        errors = []
        if not (8 <= len(v) <= 14):
            errors.append("must be 8–14 characters long")
        if not re.search(r"[A-Z]", v):
            errors.append("must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            errors.append("must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            errors.append("must contain at least one number")
        if not re.search(r"[^A-Za-z0-9]", v):
            errors.append("must contain at least one special character")
        if errors:
            raise ValueError("Password " + "; ".join(errors))
        return v


class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True
