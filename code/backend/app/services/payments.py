import os
import razorpay
from fastapi import HTTPException
from app.db import SessionLocal, User, Transaction
from datetime import datetime
from sqlalchemy.orm import Session


RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


def create_order(user_id: int, amount: float, tokens: int):
    """
    Create a Razorpay order.
    Amount is in INR (float), converted to paise.
    """
    try:
        order_amount = int(amount * 100)  # Razorpay expects amount in paise
        order_currency = "INR"
        order_receipt = f"order_rcptid_{user_id}_{int(datetime.utcnow().timestamp())}"

        order = client.order.create(
            dict(amount=order_amount, currency=order_currency, receipt=order_receipt, payment_capture=1)
        )

        # Save transaction in DB as pending
        db = SessionLocal()
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        tx = Transaction(
            user_id=user_id,
            amount_paid=amount,
            tokens_added=tokens,
            payment_id=order['id'],
            status='pending',
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        db.close()

        return order

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {e}")


def verify_payment(order_id: str, payment_id: str, signature: str, db: Session):
    """
    Verify Razorpay payment signature
    """
    try:
        params_dict = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        }

        client.utility.verify_payment_signature(params_dict)

        # Update transaction and user token balance
        tx = db.query(Transaction).filter(Transaction.payment_id == order_id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")

        tx.status = 'completed'

        user = db.query(User).filter(User.id == tx.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.token_balance += tx.tokens_added
        db.commit()
        db.refresh(user)
        db.refresh(tx)

        return {"status": "success", "tokens_added": tx.tokens_added}

    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment verification error: {e}")
