import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from db.session import engine
from db.base import Base
import models.user  # ensures model is registered with Base before create_all
import models.todo  # ensures todo model is registered with Base before create_all
from routers import auth, users, todos
from prometheus_fastapi_instrumentator import Instrumentator
from core.logging_config import setup_logging

# Initialise logging before anything else
setup_logging()
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="User API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # nginx proxies everything same-origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(todos.router)

Instrumentator().instrument(app).expose(app)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("Request: %s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info("Response: %s %s -> %s", request.method, request.url.path, response.status_code)
    return response