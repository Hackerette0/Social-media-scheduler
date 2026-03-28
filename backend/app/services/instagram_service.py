"""Instagram Graph API posting service."""
import httpx
from app.core.config import settings
from app.models.schemas import PostOut

GRAPH_BASE = "https://graph.facebook.com/v19.0"


async def _create_media_container(image_url: str, caption: str) -> str:
    """Step 1 of 2-step Instagram publish: create media container."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GRAPH_BASE}/{settings.INSTAGRAM_ACCOUNT_ID}/media",
            params={
                "image_url": image_url,
                "caption": caption,
                "access_token": settings.INSTAGRAM_ACCESS_TOKEN,
            },
        )
        resp.raise_for_status()
        return resp.json()["id"]


async def _publish_container(container_id: str) -> dict:
    """Step 2 of 2-step Instagram publish: publish the container."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GRAPH_BASE}/{settings.INSTAGRAM_ACCOUNT_ID}/media_publish",
            params={
                "creation_id": container_id,
                "access_token": settings.INSTAGRAM_ACCESS_TOKEN,
            },
        )
        resp.raise_for_status()
        return resp.json()


async def post_instagram(post: PostOut) -> dict:
    """Publish to Instagram. Requires at least one image in post.media."""
    hashtag_str = " ".join(post.hashtags)
    caption = f"{post.content}\n\n{hashtag_str}".strip()

    if not post.media:
        raise ValueError("Instagram posts require at least one image.")

    image_url = post.media[0].url
    container_id = await _create_media_container(image_url, caption)
    result = await _publish_container(container_id)
    return {"instagram_id": result.get("id"), "platform": "instagram"}


async def get_post_insights(media_id: str) -> dict:
    """Fetch engagement insights for an Instagram post."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GRAPH_BASE}/{media_id}/insights",
            params={
                "metric": "impressions,reach,likes_count,comments_count,saved",
                "access_token": settings.INSTAGRAM_ACCESS_TOKEN,
            },
        )
        resp.raise_for_status()
        data = resp.json().get("data", [])
        return {item["name"]: item["values"][0]["value"] for item in data}
