from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from app.db import Base, engine
from .routers.users import router as users_router
from .routers.chat import router as chat_router
from .routers.payments import router as payment_router
from .routers.social_auth import router as gauth_otp
from app.core.redis import get_redis_pool
from fastapi_limiter import FastAPILimiter

from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


# Create FastAPI app first
app = FastAPI(title="Authentication API", version="1.0.0")

@app.on_event("startup")
async def startup():
    redis = await get_redis_pool()
    await FastAPILimiter.init(redis)



origins = os.getenv("CORS_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(users_router, tags=["authentication"])
app.include_router(chat_router, tags=["chat"])
app.include_router(payment_router, tags=["payment"])
app.include_router(gauth_otp, tags=["Social Auth"])

@app.get("/")
def root():
    return {"message": "Authentication API is running"}

# Create database tables after app is defined
Base.metadata.create_all(bind=engine)
