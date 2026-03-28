"""LinkedIn posting via REST API."""
import httpx
from app.core.config import settings
from app.models.schemas import PostOut

API_BASE = "https://api.linkedin.com/v2"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.LINKEDIN_ACCESS_TOKEN}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }


async def get_profile_urn() -> str:
    """Fetch the authenticated user's LinkedIn URN."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{API_BASE}/me", headers=_headers())
        resp.raise_for_status()
        return f"urn:li:person:{resp.json()['id']}"


async def post_linkedin(post: PostOut) -> dict:
    hashtag_str = " ".join(post.hashtags)
    text = f"{post.content}\n\n{hashtag_str}".strip()
    author_urn = await get_profile_urn()

    payload = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": text},
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{API_BASE}/ugcPosts", headers=_headers(), json=payload)
        resp.raise_for_status()
        return {"linkedin_urn": resp.headers.get("x-restli-id"), "platform": "linkedin"}
