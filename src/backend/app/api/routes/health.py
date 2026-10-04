"""
NETRA Health Check & System Status Routes
"""
from fastapi import APIRouter
from datetime import datetime
from app.core.config import settings
from app.core.database import get_db, is_in_memory_db

router = APIRouter()


@router.get("/health")
async def health_check():
    db = get_db()
    if db is None:
        db_status = "disconnected"
    elif is_in_memory_db():
        db_status = "connected (in-memory engine)"
    else:
        try:
            await db.command("ping")
            db_status = "connected (mongodb)"
        except Exception as e:
            db_status = f"unreachable: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "app_name": "NETRA",
        "organization": "NTRO",
        "database": db_status,
        "ai_enabled": settings.AI_ENABLED and bool(settings.GEMINI_API_KEY),
        "timestamp": datetime.utcnow().isoformat()
    }
