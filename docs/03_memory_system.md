# Memory System Design

## 1. Memory Architecture Overview
JARVIS utilizes a 5-layer memory model:
1. **Working Memory**: Context window of the last N messages (usually 10-20).
2. **Session Memory**: The full conversation, summarized upon close.
3. **Episodic Memory**: Significant events or conversations, embedded in ChromaDB.
4. **Semantic Memory**: The factual profile of the user (preferences, job, relationships).
5. **Procedural Memory**: Preferences on *how* JARVIS should respond.

## 2. Memory Extraction Pipeline
**Trigger**: Async job launched after JARVIS responds.
**Extraction Prompt**: "Extract new facts, preferences, or goals from the user's latest message..."
**Schema**: `[{content, category, importance: 0-1, tags, expires_in_days}]`
**Scoring**:
- Explicit request ("Remember this"): +0.3
- Emotionally charged: +0.2
- Goal oriented: +0.2

## 3. Memory Retrieval Pipeline
1. **Semantic Search**: User query + recent context embedded to find top 20 memories from ChromaDB.
2. **Filter**: Drop expired or permission-denied memories via SQLite.
3. **Re-rank**: Score = (Chroma Distance * 0.4) + (Importance * 0.3) + (Recency * 0.2).
4. **Context Injection**: Formatted as a JSON block in the system prompt. Max 2000 tokens allocated.

## 4. Knowledge Graph
- **Structure**: Nodes (Memories) and Edges (Relations).
- **Auto-relation**: If Memory A and Memory B share a project tag, they are linked.
- **Retrieval**: When fetching node A, 1-hop neighbors are included.

## 5. Memory Permission System
- `never`: Blocked completely.
- `session`: Dies when session ends.
- `long_term`: Expires after `expires_at`.
- `permanent`: Forever (until user explicitly deletes).

## 6. Memory Decay & Maintenance
- **Decay Function**: `importance = importance * (1 - decay_rate * days)`.
- **Pruning**: Weekly job deletes importance < 0.05.
- **Reactivation**: Recalling a memory increases importance back to 0.8.

## 7. Context Injection Format
```json
{
  "relevant_memories": [
    {"fact": "User is building oh_oho project", "date": "2023-10-01"},
    {"fact": "User prefers concise answers", "date": "2023-10-05"}
  ]
}
```

## 8. Inside Jokes & Relationships
- **Jokes**: Tagged specially, triggered occasionally (10% chance) when relevant topics arise.
- **Relationship Score**: 0.0 to 1.0. Increases with interactions. Affects formality and humor level.

## 9. Privacy & Security
- Encrypted SQLite and Chroma volume.
- User can export entirely via GDPR format.
