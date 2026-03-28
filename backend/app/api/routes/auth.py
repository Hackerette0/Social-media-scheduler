from fastapi import APIRouter, HTTPException, status
from app.models.schemas import UserRegister, UserLogin, Token, UserOut
from app.core.supabase import get_supabase_admin
from app.core.security import create_access_token, get_password_hash, verify_password
import uuid
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister):
    db = get_supabase_admin()

    # Check duplicate email
    existing = db.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    hashed = get_password_hash(data.password)

    result = db.table("users").insert({
        "id": user_id,
        "email": data.email,
        "full_name": data.full_name,
        "password_hash": hashed,
        "created_at": now,
    }).execute()

    row = result.data[0]
    return UserOut(id=row["id"], email=row["email"], full_name=row.get("full_name"), created_at=row["created_at"])


@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    db = get_supabase_admin()
    result = db.table("users").select("*").eq("email", data.email).single().execute()

    if not result.data or not verify_password(data.password, result.data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(result.data["id"])
    return Token(access_token=token)
