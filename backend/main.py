from fastapi import FastAPI
from db.session import engine
from db.base import Base
import models.user # ensures model is registered with Base before create_all
from routers import auth, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="User API")

app.include_router(auth.router)
app.include_router(users.router)
