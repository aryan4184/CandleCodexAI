from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from app.db import Base, engine
from .routers.users import router as users_router
from .routers.chat import router as chat_router
from .routers.payments import router as payment_router
from .routers.social_auth import router as gauth_otp
from .routers.trading import router as trading_router
from app.core.redis import get_redis_pool
# from fastapi_limiter import FastAPILimiter

from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


# Create FastAPI app first
app = FastAPI(title="Authentication API", version="1.0.0")

@app.on_event("startup")
async def startup():
    redis = await get_redis_pool()
    # await FastAPILimiter.init(redis)


origins = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers.stocks import router as stocks_router

# Include routers
app.include_router(users_router, tags=["authentication"])
app.include_router(chat_router, tags=["chat"])
app.include_router(payment_router, prefix="/payment", tags=["payment"])
app.include_router(gauth_otp, tags=["Social Auth"])
app.include_router(trading_router, prefix="/trading", tags=["trading"])
app.include_router(stocks_router, prefix="/stocks", tags=["stocks"])

@app.get("/")
def root():
    return {"message": "Authentication API is running"}

# Create database tables after app is defined
Base.metadata.create_all(bind=engine)
