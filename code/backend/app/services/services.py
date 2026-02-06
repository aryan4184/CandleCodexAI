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
                or data.get("output_text")
                or data.get("message")
                or data.get("responseBody")
            )

            # Ensure 'text' key is populated for compatibility
            data["text"] = output_text or "Here is your result."
            
            # Return full data so keys like 'chart_url', 'ticker' are preserved
            return data

        except httpx.HTTPStatusError as e:
            logger.error(f"n8n returned error status: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"Request to n8n failed: {e}")
        except Exception as e:
            logger.exception("Unexpected error connecting to n8n")

        return {"text": "Error connecting to AI.", "image": None}
