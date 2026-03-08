# Import app first to trigger monkeypatch
try:
    import app
    print("Imported app (triggered monkeypatch)")
except ImportError:
    # If app import fails due to relative path, try sys.path hack
    import sys
    import os
    sys.path.append(os.getcwd())
    import app
    print("Imported app from CWD")

import yfinance as yf
import requests

def test_ticker(symbol):
    print(f"Testing {symbol}...")
    try:
        session = requests.Session()
        session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        })
        
        ticker = yf.Ticker(symbol, session=session)
        # Verify cache is patched?
        # yf.cache.get_tz_cache().lookup("TCS.NS") -> "UTC"
        
        history = ticker.history(period="1mo", interval="1d")
        
        if history.empty:
            print("History is empty.")
            return

        print("Columns:", history.columns)
        print("First row:", history.iloc[0])
        print("SUCCESS! Data fetched.")

    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ticker("TCS.NS")
    test_ticker("AAPL")
