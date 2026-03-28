"""
AI-powered hashtag generation using Hugging Face Inference API.
Falls back to a keyword-extraction heuristic when no API key is set.
"""
import re
import httpx
from typing import List
from app.core.config import settings


# Curated seed hashtags per niche (keyword → tags)
NICHE_TAGS: dict[str, List[str]] = {
    "food": ["foodie", "foodphotography", "instafood", "yummy", "delicious", "homecooking"],
    "fitness": ["fitness", "gym", "workout", "health", "fitlife", "motivation"],
    "travel": ["travel", "wanderlust", "travelgram", "explore", "adventure", "travelphotography"],
    "fashion": ["fashion", "style", "ootd", "streetstyle", "fashionista", "outfitoftheday"],
    "tech": ["tech", "technology", "coding", "developer", "software", "innovation"],
    "business": ["business", "entrepreneur", "startup", "marketing", "success", "growth"],
    "beauty": ["beauty", "makeup", "skincare", "selfcare", "glam", "beautytips"],
    "music": ["music", "musician", "newmusic", "producer", "beats", "hiphop"],
}


def _extract_keywords(text: str) -> List[str]:
    """Simple keyword extraction — removes stopwords, returns top words."""
    stopwords = {
        "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to",
        "for", "of", "and", "or", "but", "with", "this", "that", "it", "be",
        "have", "has", "had", "do", "does", "did", "will", "would", "can",
        "could", "should", "may", "might", "i", "we", "you", "they", "he", "she",
    }
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    return [w for w in words if w not in stopwords]


def _niche_boost(keywords: List[str]) -> List[str]:
    """Add niche hashtags when a keyword signals a topic."""
    boosted: List[str] = []
    for niche, tags in NICHE_TAGS.items():
        if niche in keywords:
            boosted.extend(tags[:4])
    return boosted


async def generate_hashtags_hf(content: str, count: int = 10) -> List[str]:
    """Call Hugging Face text-generation endpoint to brainstorm hashtags."""
    if not settings.HUGGINGFACE_API_KEY:
        return _fallback_hashtags(content, count)

    prompt = (
        f"Generate {count} relevant, trending hashtags for the following social media post. "
        f"Return only hashtags separated by spaces, no explanation.\n\nPost: {content}\n\nHashtags:"
    )

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.post(
                "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
                headers={"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"},
                json={"inputs": prompt, "parameters": {"max_new_tokens": 100, "temperature": 0.7}},
            )
            resp.raise_for_status()
            data = resp.json()

            # Parse generated text
            generated = ""
            if isinstance(data, list) and data:
                generated = data[0].get("generated_text", "")
            elif isinstance(data, dict):
                generated = data.get("generated_text", "")

            # Extract hashtags from response
            tags = re.findall(r"#(\w+)", generated)
            if tags:
                return [f"#{t}" for t in tags[:count]]
        except Exception:
            pass  # Fall through to heuristic

    return _fallback_hashtags(content, count)


def _fallback_hashtags(content: str, count: int) -> List[str]:
    keywords = _extract_keywords(content)
    niche = _niche_boost(keywords)

    # Combine: keyword-derived tags + niche tags, deduplicated
    raw = [f"#{kw}" for kw in keywords[:count]] + [f"#{t}" for t in niche]
    seen: set[str] = set()
    unique: List[str] = []
    for tag in raw:
        low = tag.lower()
        if low not in seen:
            seen.add(low)
            unique.append(tag)

    # Pad with generic engagement tags if not enough
    generic = [
        "#socialmedia", "#content", "#viral", "#trending", "#marketing",
        "#digitalmarketing", "#growyourbusiness", "#engagement",
    ]
    for g in generic:
        if len(unique) >= count:
            break
        if g not in seen:
            unique.append(g)

    return unique[:count]


async def generate_hashtags(content: str, count: int = 10) -> List[str]:
    return await generate_hashtags_hf(content, count)
