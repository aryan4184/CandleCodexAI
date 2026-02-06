from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db import get_db, User, PaymentOrder
from app.services.auth import get_current_user
from app.services.payments import create_order as razorpay_create_order, verify_payment as razorpay_verify_payment
from app.schemas import PaymentRequest, PaymentVerifyRequest
from app.constants.plans import PLANS
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(tags=["payment"])


# ----------------------------
# Create Razorpay Order
# ----------------------------
@router.post("/create-order")
def create_payment_order(
    payment: PaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    if payment.plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    """
    Create a Razorpay order for the authenticated user.
    """
    try:
        
        plan = PLANS[payment.plan_id]
        # Convert amount to paise
        amount = plan["amount"]
        tokens = plan["tokens"]
        # Create Razorpay order via service
        razorpay_order = razorpay_create_order(
            user_id=current_user.id,
            amount=amount,
            tokens=tokens
        )

        # Save order in DB
        db_order = PaymentOrder(
            user_id=current_user.id,
            razorpay_order_id=razorpay_order["id"],
            amount=amount,
            tokens=tokens,
            status="created"
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)

        return {
            "order_id": razorpay_order["id"],
            "amount": amount,
            "currency": razorpay_order["currency"],
            "tokens": tokens,
            "key_id": os.getenv("RAZORPAY_KEY_ID")
        }

    except Exception as e:
        logger.exception("Failed to create Razorpay order")
        raise HTTPException(status_code=500, detail="Error creating payment order")

# ----------------------------
# Verify Payment
# ----------------------------
@router.post("/verify-payment")
async def verify_payment_endpoint(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    """
    Verify Razorpay payment signature and credit tokens.
    """
    try:

        raw_body = await request.json()
        # print("Raw body:", raw_body)

        data = PaymentVerifyRequest(**raw_body)
        # print("Parsed data:", data.dict())
        # print(f"User: {current_user.id} - {current_user.email}")
        # Fetch order from DB
        db_order = db.query(PaymentOrder).filter_by(
            razorpay_order_id=data.razorpay_order_id,
            user_id=current_user.id
        ).first()

        # print("fetched order from db:", db_order)


        if not db_order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Verify payment signature
        # try:
        is_valid = razorpay_verify_payment(
            order_id=data.razorpay_order_id,
            payment_id=data.razorpay_payment_id,
            signature=data.razorpay_signature,
            db = db
        )
        # except Exception as e:
        #     print("Razorpay verification error:", e)
        #     raise

        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid payment signature")


        # Update order status
        db_order.status = "paid"
        db_order.razorpay_payment_id = data.razorpay_payment_id
        db.commit()
        db.refresh(db_order)

        # print("order updated:", db_order.tokens)

        # Credit tokens to user
        current_user.token_balance += db_order.tokens
        db.commit()
        db.refresh(current_user)

        # print("user updated:", current_user.token_balance)
        return {
            "message": "Payment verified and tokens credited",
            "tokens_credited": db_order.tokens,
            "current_balance": current_user.token_balance
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception("Payment verification failed")
        raise HTTPException(status_code=500, detail="Error verifying payment")
