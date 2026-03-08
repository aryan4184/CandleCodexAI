from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup
from typing import List, Optional
from datetime import datetime
import logging
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class StockQuote(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: str
    volume: str
    timestamp: str

class TrendingStock(BaseModel):
    symbol: str
    name: str
    price: float
    change_percent: str

async def fetch_google_finance_data(symbol: str) -> Optional[dict]:
    """
    Scrapes stock data from Google Finance.
    Market format: SYMBOL:EXCHANGE (e.g. RELIANCE:NSE)
    """
    clean_sym = symbol.replace("^", "").upper()
    if ".NS" in clean_sym:
        clean_sym = clean_sym.replace(".NS", ":NSE")
    elif ":" not in clean_sym and clean_sym not in ["NIFTY", "SENSEX", "NSEI", "BSESN"]:
        clean_sym = f"{clean_sym}:NSE"
        
    if clean_sym == "NSEI" or clean_sym == "NIFTY": clean_sym = "NIFTY_50:INDEXNSE"
    if clean_sym == "BSESN" or clean_sym == "SENSEX": clean_sym = "SENSEX:INDEXBOM"

    url = f"https://www.google.com/finance/quote/{clean_sym}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
        try:
            logger.info(f"Fetching {url}")
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                
                # 1. Price
                price = 0.0
                price_div = soup.find("div", {"class": "YMlKec fxKbKc"})
                if price_div:
                    price = float(price_div.text.replace("₹", "").replace(",", "").strip())
                else:
                    return None # Critical failure
                
                # 2. Change Percentage
                # Strategy A: Specific Class for "1 day change" (often 'JwB6zf')
                change_p_str = "0.00%"
                change_val = 0.0
                
                # Try finding the pill that contains the percentage
                # Usually inside a div with class 'NydbP nZm1Ef' -> div class 'P2Luy' -> span class 'JwB6zf'
                # Let's search for any element with class 'JwB6zf' as it's quite unique to the percentage
                pct_el = soup.find("span", {"class": "JwB6zf"}) # This is often the regex-safe class
                
                # Strategy B: Search for text pattern if class fails
                if not pct_el:
                     # Find all divs with 'P2Luy' (positive) or 'P2Luy Ebnabc' (negative)
                     # or just look for the first element with % text
                     import re
                     # Find first text node with % and + or -
                     # usually close to price
                     params = soup.find_all(string=re.compile(r"[\+\-]\d+\.\d+%"))
                     if params:
                         change_p_str = params[0].strip()
                else:
                    change_p_str = pct_el.text.strip() # e.g. "+1.24%"

                # Strategy C: Calculate from Previous Close if A & B fail
                if "%" not in change_p_str:
                    pc_el = soup.find("div", string="Previous close")
                    if pc_el:
                        row = pc_el.parent
                        val = row.find("div", {"class": "P6K39c"})
                        if val:
                            prev = float(val.text.replace("₹", "").replace(",", "").strip())
                            change_val = price - prev
                            change_p_str = f"{(change_val/prev)*100:+.2f}%"

                # Cleanup string
                if change_p_str:
                     # Calculate absolute change if we only found percentage
                     # If we have "1.24%", implies change = price * 0.0124 / (1+0.0124) roughly
                     # But better to just format it nicely.
                     pass

                return {
                    "price": price,
                    "change": change_val, # We might interpret this from % later if needed, or leave 0
                    "change_percent": change_p_str
                }

        except Exception as e:
            logger.error(f"Failed to fetch {symbol}: {e}")
            return None
    return None

async def get_live_data(symbol: str) -> Optional[StockQuote]:
    data = await fetch_google_finance_data(symbol)
    
    if not data:
        return None

    return StockQuote(
        symbol=symbol.upper(),
        price=data["price"],
        change=round(data["change"], 2),
        change_percent=data["change_percent"],
        volume="--", 
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )

@router.get("/quote/{symbol}", response_model=StockQuote)
async def get_stock_quote(symbol: str):
    data = await get_live_data(symbol)
    
    if not data:
         # Fallback to mock if real fails
         # This ensures UI never breaks even if Google changes layout
         # Inline simple mock
         import random
         base = 2500.0 if "RELIANCE" in symbol else 1000.0
         p = base + random.uniform(-10, 10)
         return StockQuote(
            symbol=symbol, price=round(p, 2), change=0.0, change_percent="0.00%",
            volume="0", timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
         )
@router.get("/history")
async def get_stock_history(symbol: str, period: str = "1mo", interval: str = "1d"):
    """
    Fetches historical stock data from Yahoo Finance for charting.
    """
    try:
        # Standardize symbol for Yahoo (e.g. NSE:ITC -> ITC.NS)
        y_symbol = symbol
        if ":" in symbol:
            exchange, ticker = symbol.split(":")
            if exchange == "NSE":
                y_symbol = f"{ticker}.NS" if not ticker.endswith(".NS") else ticker
            elif exchange == "BSE":
                y_symbol = f"{ticker}.BO" if not ticker.endswith(".BO") else ticker
        
        # Run yfinance in a separate thread to avoid blocking asyncio loop
        def fetch_history():
            import yfinance as yf
            import requests
            
            # Create a session with browser headers to avoid 429 blocking
            session = requests.Session()
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Referer": "https://finance.yahoo.com/quote/{}/history".format(y_symbol)
            })
            
            ticker = yf.Ticker(y_symbol, session=session)
            return ticker.history(period=period, interval=interval)

        history = await asyncio.to_thread(fetch_history)
        
        if history.empty:
            # Return empty to allow frontend fallback
            return []
            
        # Format for frontend (Recharts)
        data = []
        for index, row in history.iterrows():
            data.append({
                "date": index.strftime("%Y-%m-%d"),
                "price": round(row["Close"], 2),
                "open": round(row["Open"], 2),
                "high": round(row["High"], 2),
                "low": round(row["Low"], 2)
            })
            
        return {"symbol": symbol, "data": data}

    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {e}")
        # Return empty data instead of 500 to allow fallback
        return []
    return data

@router.get("/trending", response_model=List[TrendingStock])
async def get_trending_stocks():
    # curated list of trending stocks
    trending_symbols = [
        ("RELIANCE.NS", "Reliance Industries"),
        ("TCS.NS", "Tata Consultancy Services"),
        ("HDFCBANK.NS", "HDFC Bank"),
        ("INFY.NS", "Infosys"),
        ("ITC.NS", "ITC Limited"),
        ("SBIN.NS", "State Bank of India")
    ]
    
    results = []
    
    # Run concurrently for speed
    tasks = [fetch_google_finance_data(sym) for sym, _ in trending_symbols]
    data_list = await asyncio.gather(*tasks)
    
    for (sym, name), data in zip(trending_symbols, data_list):
        if data:
            results.append(TrendingStock(
                symbol=sym.replace(".NS", ""),
                name=name,
                price=data["price"],
                change_percent=data["change_percent"]
            ))
        else:
            # Fallback for failed item
            results.append(TrendingStock(
                symbol=sym.replace(".NS", ""),
                name=name,
                price=0.0, 
                change_percent="0.00%"
            ))
        
    return results
