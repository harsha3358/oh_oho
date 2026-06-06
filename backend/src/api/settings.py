from fastapi import APIRouter
from fastapi.responses import FileResponse
import shutil
import os

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

@router.get("/export")
def export_data():
    """Generates a ZIP backup of the SQLite database and ChromaDB"""
    backend_dir = os.path.join(os.path.dirname(__file__), "..", "..")
    db_path = os.path.join(backend_dir, "jarvis.db")
    chroma_path = os.path.join(backend_dir, "chroma_data")
    
    backup_dir = os.path.join(backend_dir, "backup_temp")
    os.makedirs(backup_dir, exist_ok=True)
    
    if os.path.exists(db_path):
        shutil.copy(db_path, backup_dir)
        
    if os.path.exists(chroma_path):
        shutil.copytree(chroma_path, os.path.join(backup_dir, "chroma_data"), dirs_exist_ok=True)
        
    archive_name = os.path.join(backend_dir, "jarvis_backup")
    shutil.make_archive(archive_name, 'zip', backup_dir)
    
    # Cleanup temp dir
    shutil.rmtree(backup_dir)
    
    return FileResponse(path=archive_name + ".zip", filename="jarvis_backup.zip", media_type="application/zip")
