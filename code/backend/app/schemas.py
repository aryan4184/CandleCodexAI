from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    mobile: str
    password: str


# ----------------------------
# Request Models
# ----------------------------
class PaymentRequest(BaseModel):
    plan_id: str

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    mobile: str
    is_active: bool
    token_balance: int
    
    class Config:
        form_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


class ConversationUpdate(BaseModel):
    title: str

class ConversationResponse(BaseModel):
    id: int
    title: Optional[str] = None
    created_at: datetime
    # Could add snippet or title later

    class Config:
        form_attributes = True


class MessageCreate(BaseModel):
    content: str
    image_data: Optional[str] = None # Base64 string
    conversation_id: Optional[int] = None # Optional: If None, create new conversation

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    image_url: Optional[str] = None
    timestamp: datetime

    class Config:
        form_attributes = True