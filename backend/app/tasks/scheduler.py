"""
APScheduler-based background job runner.
Polls Supabase every minute for posts due to be published.
"""
import asyncio
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.supabase import get_supabase_admin
from app.models.schemas import PostOut, Platform, PostStatus
from app.services.publisher import publish_post

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def _poll_and_publish():
    """Find all scheduled posts whose time has come and publish them."""
    db = get_supabase_admin()
    now_iso = datetime.now(timezone.utc).isoformat()

    result = (
        db.table("posts")
        .select("*")
        .eq("status", PostStatus.SCHEDULED)
        .lte("scheduled_at", now_iso)
        .execute()
    )

    for row in result.data or []:
        try:
            post = PostOut(
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
            logger.info("Publishing post %s to %s", post.id, post.platforms)
            await publish_post(post)
        except Exception as exc:
            logger.exception("Failed to publish post %s: %s", row.get("id"), exc)


def start_scheduler():
    scheduler.add_job(
        _poll_and_publish,
        trigger=IntervalTrigger(minutes=1),
        id="poll_scheduled_posts",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started — polling every 60 s")


def stop_scheduler():
    scheduler.shutdown(wait=False)
