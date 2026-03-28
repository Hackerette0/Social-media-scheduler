from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List
from datetime import datetime
from enum import Enum


class Platform(str, Enum):
    TWITTER = "twitter"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"


class PostStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    created_at: datetime


# ── Posts ─────────────────────────────────────────────────────────────────────

class MediaItem(BaseModel):
    url: str
    type: str  # "image" | "video"


class PostCreate(BaseModel):
    content: str
    platforms: List[Platform]
    scheduled_at: Optional[datetime] = None  # None = post immediately
    media: Optional[List[MediaItem]] = []
    hashtags: Optional[List[str]] = []


class PostUpdate(BaseModel):
    content: Optional[str] = None
    platforms: Optional[List[Platform]] = None
    scheduled_at: Optional[datetime] = None
    media: Optional[List[MediaItem]] = None
    hashtags: Optional[List[str]] = None
    status: Optional[PostStatus] = None


class PostOut(BaseModel):
    id: str
    user_id: str
    content: str
    platforms: List[Platform]
    scheduled_at: Optional[datetime]
    published_at: Optional[datetime]
    status: PostStatus
    media: List[MediaItem]
    hashtags: List[str]
    engagement: Optional[dict] = None
    created_at: datetime


# ── Hashtag AI ────────────────────────────────────────────────────────────────

class HashtagRequest(BaseModel):
    content: str
    platforms: Optional[List[Platform]] = [Platform.TWITTER]
    count: Optional[int] = 10


class HashtagResponse(BaseModel):
    hashtags: List[str]
    suggested_caption: Optional[str] = None


# ── Analytics ─────────────────────────────────────────────────────────────────

class EngagementStats(BaseModel):
    platform: Platform
    likes: int = 0
    comments: int = 0
    shares: int = 0
    impressions: int = 0
    clicks: int = 0
    post_id: str


class DashboardStats(BaseModel):
    total_posts: int
    scheduled_posts: int
    published_posts: int
    failed_posts: int
    total_engagement: int
    top_platform: Optional[Platform]
