import os
import chromadb
from chromadb.config import Settings
from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.core import Memory as DBMemory
import uuid
import datetime

# Initialize ChromaDB local persistent storage
CHROMA_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_data")
chroma_client = chromadb.PersistentClient(path=CHROMA_DATA_PATH, settings=Settings(allow_reset=True))

# Collections
try:
    memory_collection = chroma_client.get_or_create_collection(name="jarvis_memories")
except Exception as e:
    print(f"Warning: Could not create ChromaDB collection. {e}")
    memory_collection = None

class MemoryEngine:
    def __init__(self):
        self.db: Session = SessionLocal()

    def store_memory(self, content: str, category: str, importance: float = 0.5, metadata: dict = None):
        """Stores a memory in both SQLite and ChromaDB."""
        memory_id = str(uuid.uuid4())
        
        # 1. Store in SQLite
        db_memory = DBMemory(
            id=memory_id,
            user_id="default_user",
            content=content,
            category=category,
            permission="long_term",
            importance_score=importance
        )
        self.db.add(db_memory)
        self.db.commit()
        
        # 2. Store in Vector DB
        if memory_collection:
            memory_collection.add(
                documents=[content],
                metadatas=[{"category": category, "importance": importance, **(metadata or {})}],
                ids=[memory_id]
            )
        return memory_id

    def search_memories(self, query: str, n_results: int = 5):
        """Semantic search for memories."""
        if not memory_collection:
            return []
            
        results = memory_collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        if not results['documents'] or not results['documents'][0]:
            return []
            
        return [
            {
                "id": results['ids'][0][i],
                "content": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "distance": results['distances'][0][i] if 'distances' in results else 0
            }
            for i in range(len(results['documents'][0]))
        ]

memory_engine = MemoryEngine()
