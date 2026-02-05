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




async def trigger_n8n_workflow(text: str, user_id: int, history: list = []):
    """
    Sends text to n8n Webhook and returns the response from n8n.
    Uses JWT (HS256) in Authorization header.
    """

    token = generate_n8n_jwt(user_id)

    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            response = await client.post(
                N8N_WEBHOOK_URL,
                json={"message": text, "user_id": user_id, "history": history},
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

            output_text = (
                data.get("output_text")
                or data.get("message")
                or data.get("responseBody")
            )

            return {
                "text": output_text or "Here is your result.",
                "image": None
            }

        except httpx.HTTPStatusError as e:
            logger.error(f"n8n returned error status: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            logger.error(f"Request to n8n failed: {e}")
        except Exception as e:
            logger.exception("Unexpected error connecting to n8n")

        return {"text": "Error connecting to AI.", "image": None}
