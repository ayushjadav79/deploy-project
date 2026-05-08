from fastapi import FastAPI
from database import engine
import models
from routers import auth, users

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="User API")

app.include_router(auth.router)
app.include_router(users.router)
