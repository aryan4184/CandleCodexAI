from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db, User
from app.services.auth import get_current_user
from pydantic import BaseModel
import json

router = APIRouter(tags=["trading"])

class TradingPreferencesRequest(BaseModel):
    symbol: str
    interval: str = "D"

@router.get("/preferences")
def get_trading_preferences(
    current_user: User = Depends(get_current_user),
):
    """
    Get user's saved trading chart preferences.
    """
    try:
        prefs = json.loads(current_user.trading_preferences) if current_user.trading_preferences else {}
        return prefs
    except:
        return {"symbol": "NSE:NIFTY"}

@router.post("/preferences")
def update_trading_preferences(
    prefs: TradingPreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user's trading chart preferences.
    """
    current_data = {}
    try:
        current_data = json.loads(current_user.trading_preferences) if current_user.trading_preferences else {}
    except:
        pass

    # Update fields
    current_data["symbol"] = prefs.symbol
    if prefs.interval:
        current_data["interval"] = prefs.interval

    current_user.trading_preferences = json.dumps(current_data)
    db.commit()
    db.refresh(current_user)
    
    return current_data
