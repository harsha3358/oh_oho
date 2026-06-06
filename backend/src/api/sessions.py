from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.models.core import Session as DBSession, Message

router = APIRouter()

@router.get("/")
def get_sessions(db: Session = Depends(get_db)):
    sessions = db.query(DBSession).order_by(DBSession.created_at.desc()).all()
    return {"success": True, "data": sessions, "error": None}

@router.post("/")
def create_session(user_id: str = "default_user", db: Session = Depends(get_db)):
    new_session = DBSession(user_id=user_id, title="New Session")
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"success": True, "data": new_session, "error": None}

@router.get("/{session_id}/messages")
def get_messages(session_id: str, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at.asc()).all()
    return {"success": True, "data": messages, "error": None}
