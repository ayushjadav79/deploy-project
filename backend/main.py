from fastapi import FastAPI
from db.session import engine
from db.base import Base
import models.user # ensures model is registered with Base before create_all
import models.todo # ensures todo model is registered with Base before create_all
from routers import auth, users, todos
from prometheus_fastapi_instrumentator import Instrumentator

Base.metadata.create_all(bind=engine)

app = FastAPI(title="User API")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(todos.router)

Instrumentator().instrument(app).expose(app)