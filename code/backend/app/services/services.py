import httpx
import os
import logging
import jwt
import time

logger = logging.getLogger(__name__)

# Load from your .env file
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")  
N8N_JWT_SECRET = os.getenv("N8N_JWT_SECRET")


def generate_n8n_jwt(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "iss": "fastapi-backend",
        "aud": "n8n",
        "iat": int(time.time()),
        "exp": int(time.time()) + 300  # valid for 5 minutes
    }

    token = jwt.encode(
        payload,
        N8N_JWT_SECRET,
        algorithm="HS256"
    )

    return token




async def trigger_n8n_workflow(text: str, user_id: int, history: list = [], image_data: str = None, session_id: str = None):
    """
    Sends text to n8n Webhook and returns the response from n8n.
    Uses JWT (HS256) in Authorization header.
    """

    token = generate_n8n_jwt(user_id)

    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            response = await client.post(
                N8N_WEBHOOK_URL,
                json={
                    "message": text, 
                    "user_id": user_id, 
                    "history": history, 
                    "image": image_data,
                    "session_id": session_id
                },
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                },
            )
            response.raise_for_status()

            # SAFELY parse JSON
            if response.headers.get("content-type", "").startswith("application/json"):
                data = response.json()
                logger.info(f"Raw n8n response: {data}")
            else:
                raise ValueError(f"Non-JSON response from n8n: {response.text}")

            if isinstance(data, list):
                if data:
                    data = data[0]
                else:
                    data = {}

            output_text = (
                data.get("text")
                or data.get("output")
                or data.get("formatted_response")
                or data.get("output_text")
                or data.get("message")
                or data.get("responseBody")
            )

            # Fallback: Construct text from summary/key_points if formatted_response is missing
            if not output_text and data.get("summary"):
                 summary = data.get("summary", "")
                 key_points = data.get("key_points", "")
                 output_text = f"{summary}\n\n{key_points}"

            # Ensure 'text' key is populated for compatibility
            # Provide a valuable error if empty, rather than generic text
            data["text"] = output_text or ( "Received empty response from AI. Please check n8n workflow mapping." if not (data.get("yahoo_symbol") or data.get("chart_url") or data.get("ticker")) else "" )
            
            # Smart Chart URL Handling
            # 1. Yahoo Finance (Requested Priority)
            if data.get("yahoo_symbol") or data.get("yahoo_chart_image"):
                if data.get("yahoo_chart_image"):
                    data["chart_url"] = data.get("yahoo_chart_image")
                    logger.info(f"Using provided Yahoo Chart Image: {data['chart_url']}")
                elif data.get("yahoo_symbol"):
                    # Construct Yahoo Chart URL (Browser Page, hoping for embed)
                    # Format: https://finance.yahoo.com/chart/SYMBOL
                    symbol = data.get("yahoo_symbol")
                    data["chart_url"] = f"https://finance.yahoo.com/chart/{symbol}"
                    logger.info(f"Generated Yahoo Chart URL for {symbol}: {data['chart_url']}")

            # 2. Check for explicit TradingView Symbol (Fallback)
            elif data.get("tradingview_symbol"):
                symbol = data.get("tradingview_symbol")
                # Ensure prefix
                if ":" not in symbol:
                     # Attempt to guess or default, but n8n usually sends "NSE:TCS"
                     symbol = f"NSE:{symbol}"
                
                from urllib.parse import urlencode
                new_params = {
                    "frameElementId": "tv_chart",
                    "symbol": symbol,
                    "interval": "60",
                    "timeframe": "5D",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "131722",
                    "enable_publishing": "false",
                    "hide_top_toolbar": "false",
                    "hide_legend": "false",
                    "save_image": "false",
                    "backgroundColor": "rgba(19,23,34,1)",
                    "gridColor": "rgba(42,46,57,0.06)",
                    "height": "600",
                    "width": "100%"
                }
                data["chart_url"] = f"https://s.tradingview.com/widgetembed/?{urlencode(new_params)}"
                logger.info(f"Generated chart URL from symbol {symbol}: {data['chart_url']}")

            # 2. Check for 'ticker' directly (New n8n format - Cleanest)
            elif data.get("ticker"):
                symbol = data.get("ticker")
                # Fix Symbol (e.g. RELIANCE.NS -> NSE:RELIANCE)
                if ".NS" in symbol: 
                    symbol = symbol.replace(".NS", "")
                    if ":" not in symbol: symbol = f"NSE:{symbol}"
                elif ":" not in symbol:
                     # Default to NSE if it looks like an Indian stock (or just try sending it)
                     # But safer to prefix if we are sure.
                     # Let's assume NSE for now if undefined, or let TradingView handle it.
                     symbol = f"NSE:{symbol}"

                from urllib.parse import urlencode
                new_params = {
                    "frameElementId": "tv_chart",
                    "symbol": symbol,
                    "interval": "60",
                    "timeframe": "5D",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "131722",
                    "enable_publishing": "false",
                    "hide_top_toolbar": "false",
                    "hide_legend": "false",
                    "save_image": "false",
                    "backgroundColor": "rgba(19,23,34,1)",
                    "gridColor": "rgba(42,46,57,0.06)",
                    "height": "600",
                    "width": "100%"
                }
                data["chart_url"] = f"https://s.tradingview.com/widgetembed/?{urlencode(new_params)}"
                logger.info(f"Generated chart URL from ticker {symbol}: {data['chart_url']}")

            # 3. Fallback to URL parsing/sanitizing if no symbol provided
            elif data.get("chart_widget_url") or data.get("chart_url") or data.get("chart_embed"):
                target_url = data.get("chart_widget_url") or data.get("chart_url") or data.get("chart_embed")
                
                # Check if it is actually a URL and not HTML blob
                if target_url and "<div" not in target_url and "<iframe" not in target_url and "tradingview.com" in target_url:
                    try:
                        from urllib.parse import urlparse, parse_qs, urlencode
                        
                        parsed = urlparse(target_url)
                        qs = parse_qs(parsed.query)
                        
                        # Fix Symbol (e.g. RELIANCE.NS -> NSE:RELIANCE)
                        symbol_raw = qs.get("symbol", [""])[0] or qs.get("tvwidgetsymbol", [""])[0] 
                        
                        if symbol_raw:
                            # Remove Yahoo/Google suffix like .NS or .BO
                            clean_symbol = symbol_raw.replace(".NS", "").replace(".BO", "")
                            
                            # Add Exchange Prefix if missing
                            if ":" not in clean_symbol:
                                clean_symbol = f"NSE:{clean_symbol}"

                            # Construct sanitized parameters
                            new_params = {
                                "frameElementId": "tv_chart",
                                "symbol": clean_symbol,
                                "interval": "60",      # Weekly view (Hourly)
                                "timeframe": "5D",     # 5 Days
                                "theme": "dark",
                                "style": "1",
                                "locale": "en",
                                "toolbar_bg": "131722",
                                "enable_publishing": "false",
                                "hide_top_toolbar": "false",
                                "hide_legend": "false",
                                "save_image": "false",
                                "backgroundColor": "rgba(19,23,34,1)",
                                "gridColor": "rgba(42,46,57,0.06)",
                                "height": "600",
                                "width": "100%"
                            }
                            
                            data["chart_url"] = f"https://s.tradingview.com/widgetembed/?{urlencode(new_params)}"
                            logger.info(f"Sanitized chart URL: {data['chart_url']}")
                        else:
                            data["chart_url"] = target_url # Use original if no symbol found
                            
                    except Exception as e:
                         # Fallback to original if parsing fails
                         logger.error(f"Failed to sanitize URL: {e}")
                         data["chart_url"] = target_url 
                
                # If it contains HTML, explicitly CLEAR it (or don't set chart_url) to avoid frontend crash
                elif target_url and ("<div" in target_url or "<iframe" in target_url):
                    logger.warning("Received HTML in chart_url/embed, ignoring to prevent frontend error.")
                    # If we have a ticker, try to use it (Already handled above, but just in case)
                    if data.get("ticker"):
                         # Logic handled in block #2
                         pass
                    else:
                        data["chart_url"] = None

            # 2. (Removed redundant block as logic is now unified above)
            
            # Return full data so keys like 'chart_url', 'ticker' are preserved
            # Ensure ticker is present and ACCURATE for yfinance (e.g. TCS.NS vs TCS)
            if data.get("yahoo_symbol"):
                data["ticker"] = data.get("yahoo_symbol")
                data["chart_url"] = None
            elif data.get("market") and data.get("ticker"):
                # Construct from Market + Ticker (User's n8n format)
                mkt = data.get("market").upper()
                sym = data.get("ticker").upper()
                if mkt == "NSE":
                    data["ticker"] = f"{sym}.NS"
                elif mkt == "BSE":
                     data["ticker"] = f"{sym}.BO"
                else:
                    data["ticker"] = sym
                data["chart_url"] = None
            elif data.get("tradingview_symbol"):
                data["ticker"] = data.get("tradingview_symbol")
                data["chart_url"] = None 
            elif data.get("ticker"):
                # Fallback: User sent ticker but no market. Use it as is.
                # Usually this fails for Indian stocks (TCS -> NYSE TCS), but it's better than nothing.
                pass 
            elif not data.get("ticker"):
                # Fallback
                 pass
                     
            return data

        except httpx.HTTPStatusError as e:
            logger.error(f"n8n returned error status: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"Request to n8n failed: {e}")
        except Exception as e:
            logger.exception("Unexpected error connecting to n8n")

        return {"text": "Error connecting to AI.", "image": None}
