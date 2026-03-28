"""
Dispatcher: routes a post to the correct platform service(s).
Called by the APScheduler job when a post's scheduled_at time arrives.
"""
from app.models.schemas import PostOut, Platform, PostStatus
from app.core.supabase import get_supabase_admin
from app.services import twitter_service, instagram_service, linkedin_service


async def publish_post(post: PostOut) -> None:
    db = get_supabase_admin()
    results: dict[str, dict] = {}
    errors: list[str] = []

    for platform in post.platforms:
        try:
            if platform == Platform.TWITTER:
                r = await twitter_service.post_tweet(post)
            elif platform == Platform.INSTAGRAM:
                r = await instagram_service.post_instagram(post)
            elif platform == Platform.LINKEDIN:
                r = await linkedin_service.post_linkedin(post)
            else:
                continue
            results[platform] = r
        except Exception as exc:
            errors.append(f"{platform}: {exc}")

    status = PostStatus.FAILED if errors else PostStatus.PUBLISHED

    db.table("posts").update({
        "status": status,
        "published_at": "now()" if not errors else None,
        "platform_ids": results,
        "errors": errors or None,
    }).eq("id", post.id).execute()
