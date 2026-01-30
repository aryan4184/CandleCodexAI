from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
import os

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

async def send_otp_email(email: EmailStr, otp: str):
    message = MessageSchema(
        subject="Your Login Code",
        recipients=[email],
        body=f"Your OTP code is: {otp}",
        subtype="html"
    )
    fm = FastMail(conf)
    await fm.send_message(message)