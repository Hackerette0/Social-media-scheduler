from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.models.schemas import PostCreate, PostUpdate, PostOut, PostStatus, Platform
from app.api.deps import get_current_user
from app.core.supabase import get_supabase_admin
from app.services.publisher import publish_post

router = APIRouter(prefix="/posts", tags=["posts"])


def _row_to_post(row: dict) -> PostOut:
    return PostOut(
        id=row["id"],
        user_id=row["user_id"],
        content=row["content"],
        platforms=[Platform(p) for p in row["platforms"]],
        scheduled_at=row.get("scheduled_at"),
        published_at=row.get("published_at"),
        status=PostStatus(row["status"]),
        media=row.get("media") or [],
        hashtags=row.get("hashtags") or [],
        engagement=row.get("engagement"),
        created_at=row["created_at"],
    )


@router.post("/", response_model=PostOut, status_code=status.HTTP_201_CREATED)
async def create_post(data: PostCreate, user: dict = Depends(get_current_user)):
    db = get_supabase_admin()
    now = datetime.now(timezone.utc).isoformat()
    post_status = PostStatus.SCHEDULED if data.scheduled_at else PostStatus.DRAFT

    row_data = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "content": data.content,
        "platforms": [p.value for p in data.platforms],
        "scheduled_at": data.scheduled_at.isoformat() if data.scheduled_at else None,
        "status": post_status.value,
        "media": [m.dict() for m in (data.media or [])],
        "hashtags": data.hashtags or [],
        "created_at": now,
    }

    result = db.table("posts").insert(row_data).execute()
    post = _row_to_post(result.data[0])

    # If no scheduled time, publish immediately
    if not data.scheduled_at:
        await publish_post(post)
        refreshed = db.table("posts").select("*").eq("id", post.id).single().execute()
        post = _row_to_post(refreshed.data)

    return post


@router.get("/", response_model=List[PostOut])
async def list_posts(
    status_filter: Optional[PostStatus] = None,
    platform: Optional[Platform] = None,
    limit: int = 50,
    offset: int = 0,
    user: dict = Depends(get_current_user),
):
    db = get_supabase_admin()
    query = db.table("posts").select("*").eq("user_id", user["id"])

    if status_filter:
        query = query.eq("status", status_filter.value)
    if platform:
        query = query.contains("platforms", [platform.value])

    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return [_row_to_post(r) for r in result.data]


@router.get("/{post_id}", response_model=PostOut)
async def get_post(post_id: str, user: dict = Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("posts").select("*").eq("id", post_id).eq("user_id", user["id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")
    return _row_to_post(result.data)


@router.patch("/{post_id}", response_model=PostOut)
async def update_post(post_id: str, data: PostUpdate, user: dict = Depends(get_current_user)):
    db = get_supabase_admin()
    existing = db.table("posts").select("*").eq("id", post_id).eq("user_id", user["id"]).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Post not found")

    updates = {k: v for k, v in data.dict(exclude_none=True).items()}
    if "platforms" in updates:
        updates["platforms"] = [p.value for p in updates["platforms"]]
    if "scheduled_at" in updates and isinstance(updates["scheduled_at"], datetime):
        updates["scheduled_at"] = updates["scheduled_at"].isoformat()
    if "media" in updates:
        updates["media"] = [m.dict() for m in updates["media"]]

    result = db.table("posts").update(updates).eq("id", post_id).execute()
    return _row_to_post(result.data[0])


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    db = get_supabase_admin()
    existing = db.table("posts").select("id").eq("id", post_id).eq("user_id", user["id"]).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Post not found")
    db.table("posts").delete().eq("id", post_id).execute()
