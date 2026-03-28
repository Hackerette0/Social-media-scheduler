"""Twitter/X posting via Tweepy v4."""
import tweepy
from app.core.config import settings
from app.models.schemas import PostOut


def _get_client() -> tweepy.Client:
    return tweepy.Client(
        bearer_token=settings.TWITTER_BEARER_TOKEN,
        consumer_key=settings.TWITTER_API_KEY,
        consumer_secret=settings.TWITTER_API_SECRET,
        access_token=settings.TWITTER_ACCESS_TOKEN,
        access_token_secret=settings.TWITTER_ACCESS_TOKEN_SECRET,
    )


async def post_tweet(post: PostOut) -> dict:
    """Post a tweet. Returns the created tweet data."""
    client = _get_client()
    hashtag_str = " ".join(post.hashtags)
    full_text = f"{post.content}\n\n{hashtag_str}".strip()

    # Twitter char limit: 280
    if len(full_text) > 280:
        full_text = full_text[:277] + "..."

    response = client.create_tweet(text=full_text)
    return {"tweet_id": response.data["id"], "platform": "twitter"}


async def get_tweet_metrics(tweet_id: str) -> dict:
    """Fetch engagement metrics for a tweet."""
    client = _get_client()
    tweet = client.get_tweet(
        tweet_id,
        tweet_fields=["public_metrics"],
    )
    if tweet.data:
        m = tweet.data.public_metrics or {}
        return {
            "likes": m.get("like_count", 0),
            "shares": m.get("retweet_count", 0),
            "comments": m.get("reply_count", 0),
            "impressions": m.get("impression_count", 0),
        }
    return {}
