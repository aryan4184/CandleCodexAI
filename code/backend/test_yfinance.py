import yfinance as yf
import pandas as pd

def test_ticker(symbol):
    print(f"Testing {symbol}...")
    try:
        ticker = yf.Ticker(symbol)
        history = ticker.history(period="1mo", interval="1d")
        
        if history.empty:
            print("History is empty.")
            return

        print("Columns:", history.columns)
        print("First row:", history.iloc[0])
        
        for index, row in history.iterrows():
            try:
                print(f"Date: {index}, Close: {row['Close']}")
                break
            except Exception as e:
                print(f"Error iterating row: {e}")

    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ticker("TCS.NS")
    test_ticker("NSE:TCS")
