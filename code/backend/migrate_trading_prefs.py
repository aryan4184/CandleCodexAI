from app.db import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as connection:
        # Check if column exists (optional, but good for safety)
        # For simplicity in this raw script, we use "ADD COLUMN IF NOT EXISTS" logic 
        # But postgres "IF NOT EXISTS" for columns requires a procedure or newer version.
        # simpler: catch the error or just run it.
        
        try:
            query = text("ALTER TABLE users ADD COLUMN trading_preferences TEXT DEFAULT '{\"symbol\": \"BINANCE:BTCUSDT\"}';")
            connection.execute(query)
            connection.commit()
            print("Successfully added trading_preferences column.")
        except Exception as e:
            print(f"Migration failed (maybe column exists?): {e}")

if __name__ == "__main__":
    migrate()
