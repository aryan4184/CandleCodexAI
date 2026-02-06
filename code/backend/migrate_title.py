import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        # Add title column
        try:
            connection.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS title VARCHAR;"))
            connection.commit()
            print("Successfully added title column to conversations table.")
        except Exception as e:
            print(f"Error executing migration: {e}")

if __name__ == "__main__":
    migrate()
