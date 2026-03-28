from fastapi import APIRouter, Depends
from app.models.schemas import HashtagRequest, HashtagResponse
from app.api.deps import get_current_user
from app.services.hashtag_service import generate_hashtags

router = APIRouter(prefix="/hashtags", tags=["hashtags"])


@router.post("/generate", response_model=HashtagResponse)
async def generate(data: HashtagRequest, _user: dict = Depends(get_current_user)):
    tags = await generate_hashtags(data.content, data.count or 10)
    return HashtagResponse(hashtags=tags)
