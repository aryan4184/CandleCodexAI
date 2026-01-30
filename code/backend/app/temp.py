import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

print(MAIL_PASSWORD)
print(MAIL_USERNAME)
try:
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()  # Enable TLS
    server.login(MAIL_USERNAME, MAIL_PASSWORD)
    print("Login successful!")
    server.quit()
except smtplib.SMTPAuthenticationError as e:
    print("Login failed:", e)
