# app/routers/auth_social.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime, timedelta
import random

from app.db import get_db
from app.models import User, OTP
from app.core.security import create_access_token # Your existing JWT function
from app.utils.email import send_otp_email

router = APIRouter(tags=["Social Auth"])

GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"

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
async def request_otp(data: dict, db: Session = Depends(get_db)):
    email = data['email']
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
async def verify_otp(data: dict, db: Session = Depends(get_db)):
    email = data['email']
    code = data['code']
    
    # Check DB
    record = db.query(OTP).filter(
        OTP.email == email, 
        OTP.code == code,
        OTP.expires_at > datetime.utcnow()
    ).first()
    
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or Expired OTP")
    
    # Cleanup OTP
    db.delete(record)
    
    # Find or Create User
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, username=email.split("@")[0], auth_provider="email", hashed_password=None)
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}