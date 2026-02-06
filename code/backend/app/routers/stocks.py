from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
from typing import List, Optional
from datetime import datetime

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

STOCK_BASE_PRICES = {
    "RELIANCE": 2450.0,
    "TCS": 3600.0,
    "HDFCBANK": 1650.0,
    "INFY": 1550.0,
    "TATAMOTORS": 980.0,
    "ITC": 440.0,
    "SBIN": 760.0
}

def generate_mock_stock_data(symbol: str) -> StockQuote:
    # Use specific base price if available, otherwise random range
    base_price = STOCK_BASE_PRICES.get(symbol.upper(), random.uniform(500, 3000))
    
    # Add some random variation
    change = random.uniform(-0.02 * base_price, 0.02 * base_price)
    
    return StockQuote(
        symbol=symbol.upper(),
        price=round(base_price + change, 2),
        change=round(change, 2),
        change_percent=f"{(change / base_price) * 100:+.2f}%",
        volume=f"{random.randint(1, 50)}M",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )

@router.get("/quote/{symbol}", response_model=StockQuote)
def get_stock_quote(symbol: str):
    # In a real app, calls a financial API (e.g. Yahoo Finance, AlphaVantage)
    # For now, we mock valid data response
    return generate_mock_stock_data(symbol)

@router.get("/trending", response_model=List[TrendingStock])
def get_trending_stocks():
    trending_symbols = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS"]
    results = []
    
    for sym in trending_symbols:
        data = generate_mock_stock_data(sym)
        results.append(TrendingStock(
            symbol=sym,
            name=sym, # Simplified for mock
            price=data.price,
            change_percent=data.change_percent
        ))
        
    return results
