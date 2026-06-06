import uuid
import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator
from src.database import Base
from src.services.security_engine import security_engine

def generate_uuid():
    return str(uuid.uuid4())

class EncryptedString(TypeDecorator):
    """Transparently encrypts and decrypts strings using the Security Engine."""
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return security_engine.encrypt_data(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return security_engine.decrypt_data(value)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String)
    timezone = Column(String, default='UTC')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(EncryptedString)
    summary = Column(EncryptedString)
    emotional_tone = Column(String)
    agent_used = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime)
    
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String) # user, assistant, system, tool
    content = Column(EncryptedString)
    model_used = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("Session", back_populates="messages")

class Memory(Base):
    __tablename__ = "memories"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String) # preference, goal, person, project, emotion, habit, startup
    permission = Column(String) # never, session, long_term, permanent
    importance_score = Column(Float, default=0.5)
    emotional_weight = Column(Float, default=0.5) # 0-10 normalized
    retrieval_count = Column(Integer, default=0)
    content = Column(EncryptedString, nullable=False)
    chroma_id = Column(String)
    tags = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_retrieved_at = Column(DateTime, default=datetime.datetime.utcnow)

class Goal(Base):
    __tablename__ = "goals"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(EncryptedString, nullable=False)
    description = Column(EncryptedString)
    status = Column(String, default="active") # draft, active, paused, completed
    progress = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class GrowthMetric(Base):
    __tablename__ = "growth_metrics"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    metric_type = Column(String) # confidence, productivity, learning, startup, emotion
    value = Column(Float)
    notes = Column(EncryptedString)
    logged_at = Column(DateTime, default=datetime.datetime.utcnow)

class LifeGraphNode(Base):
    __tablename__ = "life_graph_nodes"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    node_type = Column(String) # Goal, Project, Habit, Skill, Relationship, Emotion, Learning, Career, Startup
    label = Column(EncryptedString, nullable=False)
    attributes = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class LifeGraphEdge(Base):
    __tablename__ = "life_graph_edges"
    id = Column(String, primary_key=True, default=generate_uuid)
    source_id = Column(String, ForeignKey("life_graph_nodes.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(String, ForeignKey("life_graph_nodes.id", ondelete="CASCADE"), nullable=False)
    relationship_type = Column(String) # Supports, Blocks, Depends On, Related To
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
