from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -------------------
# Database Models
# -------------------

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=False, nullable=False)
    mobile = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    token_balance = Column(Integer, default=100) # Give 100 free tokens on signup
    is_active = Column(Boolean, default=True)

    # Optional relationship
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")


# In app/models.py
class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount_paid = Column(Float)       # e.g., 5.00
    tokens_added = Column(Integer)    # e.g., 5000
    payment_id = Column(String)       # Stripe Session ID
    status = Column(String)           # 'pending', 'completed', 'failed'
    created_at = Column(DateTime, default=datetime.utcnow)



class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender = Column(String)  # 'user' or 'ai'
    content = Column(Text)
    image_url = Column(Text, nullable=True)  # Stores n8n image result
    timestamp = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages", cascade="all, delete-orphan")





# -------------------
# Database Dependency
# -------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------
# Create tables
# -------------------
# Base.metadata.create_all(engine)  # Run this once to create tables
