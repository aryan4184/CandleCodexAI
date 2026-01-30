# app/routers/auth_social.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime, timedelta
import random

from app.db import get_db
from app.db import User, OTP
from app.services.auth import create_access_token # Your existing JWT function
from app.services.social_auth import send_otp_email
import os

router = APIRouter(tags=["Social Auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# --- 1. GOOGLE LOGIN ---
@router.post("/auth/google")
async def google_login(token_data: dict, db: Session = Depends(get_db)):
    try:
        # Verify the token with Google
        id_info = id_token.verify_oauth2_token(
            token_data['credential'], 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        email = id_info['email']
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user automatically
            user = User(
                email=email,
                username=email.split("@")[0], # Generate username
                auth_provider="google",
                hashed_password=None
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # Issue JWT
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google Token")

# --- 2. OTP LOGIN ---
@router.post("/auth/otp/request")
async def request_otp(
    request: Request,
    db: Session = Depends(get_db)
):

    data = await request.json()

    identifier = data.get("identifier")


    if not identifier:
        raise HTTPException(status_code=400, detail="Email or mobile is required")
    if "@" in identifier:
        email = identifier
        phone = None
    else:
        phone = identifier
        email = None

    # ✅ db is now defined
    if email:
        user = db.query(User).filter(User.email == email).first()
    else:
        user = db.query(User).filter(User.phone == phone).first()

    if not user:
        raise HTTPException(status_code=404, detail="User Not Found.")
    # Generate 6 digit code
    code = str(random.randint(100000, 999999))
    
    # Save to DB with 5 min expiry
    otp_entry = OTP(
        email=email, 
        code=code, 
        expires_at=datetime.utcnow() + timedelta(minutes=5)
    )
    db.add(otp_entry)
    db.commit()
    
    # Send Email
    await send_otp_email(email, code)
    return {"message": "OTP Sent"}

@router.post("/auth/otp/verify")
async def verify_otp(
    request: Request,
    db: Session = Depends(get_db)
):
    data = await request.json()

    identifier = data.get("identifier")
    otp = data.get("otp")

    if not identifier or not otp:
        raise HTTPException(
            status_code=400,
            detail="Identifier and OTP are required"
        )

    #  Detect email vs mobile
    if "@" in identifier:
        email = identifier
        phone = None
    else:
        phone = identifier
        email = None

    # 🔐 Check OTP record
    query = db.query(OTP).filter(
        OTP.code == otp,
        OTP.expires_at > datetime.utcnow()
    )

    if email:
        query = query.filter(OTP.email == email)
    else:
        query = query.filter(OTP.phone == phone)

    record = query.first()

    if not record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OTP"
        )

    # 🧹 Cleanup OTP (important)
    db.delete(record)
    db.commit()

    # 👤 Find user
    if email:
        user = db.query(User).filter(User.email == email).first()
    else:
        user = db.query(User).filter(User.phone == phone).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User does not exist"
        )

    # 🎟️ Issue JWT
    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
