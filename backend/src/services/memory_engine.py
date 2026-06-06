import os
import chromadb
from chromadb.config import Settings
from sqlalchemy.orm import Session
from src.database import SessionLocal
from src.models.core import Memory as DBMemory, LifeGraphNode, LifeGraphEdge
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

    def store_memory(self, content: str, category: str, importance: float = 0.5, emotional_weight: float = 0.5, metadata: dict = None):
        """Stores a memory with advanced scoring."""
        memory_id = str(uuid.uuid4())
        
        # Store in SQLite
        db_memory = DBMemory(
            id=memory_id,
            user_id="default_user",
            content=content,
            category=category,
            permission="long_term",
            importance_score=importance,
            emotional_weight=emotional_weight
        )
        self.db.add(db_memory)
        self.db.commit()
        
        # Store in Vector DB
        if memory_collection:
            memory_collection.add(
                documents=[content],
                metadatas=[{"category": category, "importance": importance, "emotional_weight": emotional_weight, **(metadata or {})}],
                ids=[memory_id]
            )
        return memory_id

    def add_life_graph_node(self, node_type: str, label: str, attributes: dict = None):
        """Adds a node to the Life Graph."""
        node_id = str(uuid.uuid4())
        node = LifeGraphNode(
            id=node_id,
            user_id="default_user",
            node_type=node_type,
            label=label,
            attributes=attributes or {}
        )
        self.db.add(node)
        self.db.commit()
        return node_id
        
    def add_life_graph_edge(self, source_id: str, target_id: str, relationship_type: str, weight: float = 1.0):
        """Adds an edge to the Life Graph."""
        edge_id = str(uuid.uuid4())
        edge = LifeGraphEdge(
            id=edge_id,
            source_id=source_id,
            target_id=target_id,
            relationship_type=relationship_type,
            weight=weight
        )
        self.db.add(edge)
        self.db.commit()
        return edge_id

    def search_memories(self, query: str, n_results: int = 10, category_filter: str = None):
        """Semantic search with custom weighting (Recency, Importance, Emotion)."""
        if not memory_collection:
            return []
            
        where_clause = {"category": category_filter} if category_filter else None
            
        results = memory_collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_clause
        )
        
        if not results['documents'] or not results['documents'][0]:
            return []
            
        memories = []
        for i in range(len(results['documents'][0])):
            m_id = results['ids'][0][i]
            content = results['documents'][0][i]
            metadata = results['metadatas'][0][i]
            distance = results['distances'][0][i] if 'distances' in results else 1.0
            
            # Custom Rank Score: Closer semantic distance (lower is better) is boosted by high importance and emotion
            imp = metadata.get('importance', 0.5)
            emo = metadata.get('emotional_weight', 0.5)
            
            # Simple heuristic score combining factors
            rank_score = (1.0 / (distance + 0.01)) * (imp * 1.5) * (emo * 1.2)
            
            memories.append({
                "id": m_id,
                "content": content,
                "metadata": metadata,
                "distance": distance,
                "rank_score": rank_score
            })
            
            # Update retrieval count in DB
            db_mem = self.db.query(DBMemory).filter(DBMemory.id == m_id).first()
            if db_mem:
                db_mem.retrieval_count += 1
                db_mem.last_retrieved_at = datetime.datetime.utcnow()
                self.db.commit()
                
        # Sort by the new rank score descending
        memories.sort(key=lambda x: x['rank_score'], reverse=True)
        
        return memories

memory_engine = MemoryEngine()
