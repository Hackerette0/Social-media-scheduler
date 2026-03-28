from fastapi import APIRouter, Depends
from app.models.schemas import DashboardStats, PostStatus, Platform
from app.api.deps import get_current_user
from app.core.supabase import get_supabase_admin
from collections import Counter

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(user: dict = Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("posts").select("status, platforms, engagement").eq("user_id", user["id"]).execute()
    rows = result.data or []

    status_counts = Counter(r["status"] for r in rows)
    total_engagement = 0
    platform_engagement: Counter = Counter()

    for row in rows:
        eng = row.get("engagement") or {}
        for platform, metrics in eng.items():
            if isinstance(metrics, dict):
                val = sum(metrics.values())
                total_engagement += val
                platform_engagement[platform] += val

    top_platform = platform_engagement.most_common(1)[0][0] if platform_engagement else None

    return DashboardStats(
        total_posts=len(rows),
        scheduled_posts=status_counts.get(PostStatus.SCHEDULED, 0),
        published_posts=status_counts.get(PostStatus.PUBLISHED, 0),
        failed_posts=status_counts.get(PostStatus.FAILED, 0),
        total_engagement=total_engagement,
        top_platform=Platform(top_platform) if top_platform else None,
    )
