# Life Graph Architecture

## 1. Life Graph Vision
- **What**: A dynamic, living knowledge graph mapping the user's life (goals, relationships, habits, projects).
- **Philosophy**: Organic growth. JARVIS infers the graph from natural conversations without requiring manual data entry.

## 2. Node Taxonomy
- **User**: Root node.
- **Goal**: Long-term objectives.
- **Project**: Active work items.
- **Person**: People mentioned (Friends, Mentors, Investors).
- **Emotion**: Significant states (Burnout, Joy).
- **Habit**, **Decision**, **Learning**, **Career**, **Health**, **Value**, **Event**.

*Schema*: `id`, `type`, `label`, `attributes (JSON)`, `importance`, `confidence`.

## 3. Edge/Relationship Taxonomy
- `wants_to_achieve` (User -> Goal)
- `knows` (User -> Person)
- `caused_by` (Emotion -> Event/Person)
- `conflicts_with` (Goal -> Goal)
- `requires` (Goal -> Learning)

## 4. Graph Construction Pipeline
1. **NER**: Extract entities from conversation summaries.
2. **Relationship Mapping**: LLM infers relationships between entities.
3. **Deduplication**: Merges "Tony" and "Tony (Investor)" if context matches.
4. **Overrides**: User can edit the graph visually in the Memory Center.

## 5. Graph Storage
- **SQLite**: `life_graph_nodes` and `life_graph_edges` (Structured source of truth).
- **ChromaDB**: Embeddings of nodes for semantic matching.
- **NetworkX**: In-memory Python graph for fast path traversal during session.

## 6. Graph-Powered Features
- **Daily Brief**: JARVIS traverses active projects + upcoming deadlines + recent emotions to build the daily summary.
- **Contradiction Detection**: "You want to launch next week, but you also mentioned feeling burned out. How do we balance this?"
- **Pathfinding**: "How does this new idea connect to your 5-year goal?"

## 7. Privacy
- Confidential nodes can be tagged `private` and are excluded from all LLM contexts unless explicitly queried.
