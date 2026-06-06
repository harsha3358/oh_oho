from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.core import Memory

router = APIRouter()

@router.get("/")
def get_memories(db: Session = Depends(get_db)):
    memories = db.query(Memory).order_by(Memory.importance_score.desc()).all()
    return {"success": True, "data": memories, "error": None}

@router.post("/")
def create_memory(content: str, category: str, db: Session = Depends(get_db)):
    new_memory = Memory(
        user_id="default_user",
        content=content,
        category=category,
        permission="long_term"
    )
    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)
    return {"success": True, "data": new_memory, "error": None}
