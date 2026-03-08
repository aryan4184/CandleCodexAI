# Monkeypatch yfinance to avoid SQLite dependency (broken on this env)
try:
    import yfinance.cache
    
    class MockCache:
        def lookup(self, ticker):
            return "Asia/Kolkata" # Default to IST to avoid empty data window issues
        def store(self, *args, **kwargs):
            pass
            
    # Override the cache function
    yfinance.cache.get_tz_cache = lambda: MockCache()
    # Also override valid initialization just in case
    yfinance.cache.initialise = lambda *args: None
    
except ImportError:
    pass
except Exception as e:
    print(f"Failed to patch yfinance: {e}")