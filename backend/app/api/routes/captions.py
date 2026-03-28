"""
Caption generation, per-platform adaptation, and best-time recommendations.
All endpoints require a valid JWT (same as posts/hashtags).
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List, Optional

from app.api.deps import get_current_user
from app.services.caption_service import generate_captions, adapt_caption, get_best_times

router = APIRouter(prefix="/captions", tags=["captions"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class CaptionGenerateRequest(BaseModel):
    idea: str = Field(..., min_length=3, max_length=500)
    tone: str = Field("casual", pattern="^(professional|casual|fun)$")
    platforms: List[str] = Field(default=["instagram"])
    count: int = Field(4, ge=1, le=6)


class CaptionVariation(BaseModel):
    hook: str
    text: str
    cta: str


class CaptionGenerateResponse(BaseModel):
    captions: List[CaptionVariation]
    idea: str
    tone: str
    platforms: List[str]


class AdaptRequest(BaseModel):
    caption: str = Field(..., min_length=5, max_length=3000)
    target_platform: str = Field(..., pattern="^(instagram|linkedin|twitter|facebook)$")


class AdaptResponse(BaseModel):
    adapted: str
    platform: str


class BestTimesRequest(BaseModel):
    platforms: List[str] = Field(default=["instagram"])
    count: Optional[int] = Field(3, ge=1, le=5)


class TimeSlot(BaseModel):
    day: str
    window: str
    lift: str
    platforms: List[str]


class BestTimesResponse(BaseModel):
    slots: List[TimeSlot]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=CaptionGenerateResponse)
async def generate(
    body: CaptionGenerateRequest,
    _user: dict = Depends(get_current_user),
):
    """
    Generate caption variations from a short idea.
    Uses Hugging Face Mistral-7B when configured, falls back to
    template-based generation so it always works.
    """
    # Normalise platform names (lowercase, strip spaces)
    platforms = [p.lower().strip() for p in body.platforms if p.strip()]
    if not platforms:
        platforms = ["instagram"]

    captions = await generate_captions(
        idea=body.idea,
        tone=body.tone,
        platforms=platforms,
        count=body.count,
    )

    return CaptionGenerateResponse(
        captions=[CaptionVariation(**c) for c in captions],
        idea=body.idea,
        tone=body.tone,
        platforms=platforms,
    )


@router.post("/adapt", response_model=AdaptResponse)
async def adapt(
    body: AdaptRequest,
    _user: dict = Depends(get_current_user),
):
    """
    Rewrite an existing caption for a specific platform.
    Applies platform-specific tone, length, and formatting rules.
    """
    adapted = await adapt_caption(
        caption=body.caption,
        target_platform=body.target_platform,
    )
    return AdaptResponse(adapted=adapted, platform=body.target_platform)


@router.post("/best-times", response_model=BestTimesResponse)
async def best_times(
    body: BestTimesRequest,
    _user: dict = Depends(get_current_user),
):
    """
    Return the top N posting windows for the given platforms.
    Scores are based on aggregated platform research data and
    cross-platform overlap bonus.
    """
    platforms = [p.lower().strip() for p in body.platforms if p.strip()]
    slots = get_best_times(platforms=platforms, n=body.count or 3)
    return BestTimesResponse(slots=[TimeSlot(**s) for s in slots])
