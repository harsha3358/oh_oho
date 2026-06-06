from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_settings():
    # Mock settings for Sprint 1
    settings = {
        "llm_provider": "ollama",
        "voice_enabled": True,
        "theme": "dark"
    }
    return {"success": True, "data": settings, "error": None}
