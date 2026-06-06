# Database Schema Design

## 1. Architecture Overview
- **Two-layer storage strategy**: SQLite (structured) + ChromaDB (vector)
- **Why**: SQLite is fast, reliable, and perfectly suited for relational desktop data. ChromaDB handles semantic search for memories and knowledge efficiently.
- **Data flow**: All entities are saved to SQLite first as the source of truth. Text meant for semantic search is embedded and pushed to ChromaDB, with the `chroma_id` saved back to SQLite.

## 2. SQLite Schema — Full DDL

```sql
-- 1. users
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    email TEXT,
    timezone TEXT DEFAULT 'UTC',
    avatar TEXT,
    preferences JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. sessions
CREATE TABLE sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    summary TEXT,
    emotional_tone TEXT,
    agent_used TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content_type TEXT DEFAULT 'text',
    content TEXT,
    model_used TEXT,
    agent_used TEXT,
    tokens INTEGER,
    latency REAL,
    emotional_tone TEXT,
    memory_refs JSON,
    tool_calls JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. memories
CREATE TABLE memories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('preference', 'goal', 'person', 'project', 'emotion', 'habit', 'knowledge', 'event', 'decision')),
    permission TEXT CHECK (permission IN ('never', 'session', 'long_term', 'permanent')),
    importance_score REAL DEFAULT 0.5,
    content TEXT NOT NULL,
    source_traceback TEXT,
    chroma_id TEXT,
    tags JSON,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. memory_relations
CREATE TABLE memory_relations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    relation_type TEXT,
    weight REAL DEFAULT 1.0,
    direction TEXT CHECK (direction IN ('directed', 'undirected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. goals
CREATE TABLE goals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed', 'abandoned')),
    priority TEXT,
    progress REAL DEFAULT 0.0,
    target_date DATETIME,
    streak_days INTEGER DEFAULT 0,
    parent_goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
    jarvis_insights JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. milestones
CREATE TABLE milestones (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')),
    order_index INTEGER DEFAULT 0,
    dependencies JSON,
    target_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. tasks
CREATE TABLE tasks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
    milestone_id TEXT REFERENCES milestones(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
    priority TEXT,
    due_date DATETIME,
    estimated_minutes INTEGER,
    actual_minutes INTEGER DEFAULT 0,
    recurrence JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. emotional_checkins
CREATE TABLE emotional_checkins (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    detected_emotion TEXT,
    emotion_scores JSON,
    trigger_note TEXT,
    jarvis_response TEXT,
    user_rated_accuracy INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. companion_profile
CREATE TABLE companion_profile (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    humor_level INTEGER DEFAULT 5,
    communication_style TEXT,
    inside_jokes JSON,
    personality_summary TEXT,
    strengths JSON,
    growth_areas JSON,
    emotional_triggers JSON,
    trust_level REAL DEFAULT 0.5,
    relationship_days INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    user_disclosed_context JSON,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. projects
CREATE TABLE projects (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT,
    stack JSON,
    github_url TEXT,
    domain TEXT,
    jarvis_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. people
CREATE TABLE people (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship_type TEXT CHECK (relationship_type IN ('friend', 'colleague', 'mentor', 'investor', 'family', 'other')),
    notes TEXT,
    last_mentioned_at DATETIME,
    sentiment_score REAL DEFAULT 0.5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. agent_runs
CREATE TABLE agent_runs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    agent_type TEXT NOT NULL,
    input_summary TEXT,
    output_summary TEXT,
    tools_used JSON,
    steps JSON,
    status TEXT,
    error TEXT,
    duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. workflows
CREATE TABLE workflows (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    trigger_type TEXT CHECK (trigger_type IN ('manual', 'scheduled', 'event')),
    steps JSON,
    status TEXT,
    last_run_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. plugins
CREATE TABLE plugins (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    version TEXT,
    manifest JSON,
    is_enabled BOOLEAN DEFAULT 0,
    config JSON,
    permissions JSON,
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. notifications
CREATE TABLE notifications (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT,
    priority TEXT,
    action_url TEXT,
    is_read BOOLEAN DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    category TEXT,
    is_encrypted BOOLEAN DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 18. audit_logs
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    before_state JSON,
    after_state JSON,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 19. voice_sessions
CREATE TABLE voice_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    wake_word_detected_at DATETIME,
    recording_start DATETIME,
    recording_end DATETIME,
    transcript TEXT,
    confidence REAL,
    model_used TEXT,
    tts_generated BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 20. founder_context
CREATE TABLE founder_context (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    startup_name TEXT NOT NULL,
    stage TEXT,
    industry TEXT,
    target_market TEXT,
    key_metrics JSON,
    competitors JSON,
    funding_status TEXT,
    team_size INTEGER,
    current_focus TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Indexes Strategy
- `idx_messages_session`: `CREATE INDEX idx_messages_session ON messages(session_id);` — needed for fast session reconstruction.
- `idx_memories_category`: `CREATE INDEX idx_memories_category ON memories(category);` — filters memory retrieval pipeline.
- `idx_tasks_status`: `CREATE INDEX idx_tasks_status ON tasks(status);` — dashboard needs fast lookups for pending tasks.
- `idx_goals_status`: `CREATE INDEX idx_goals_status ON goals(status);`
- `idx_sessions_user`: `CREATE INDEX idx_sessions_user ON sessions(user_id);`

## 4. Triggers
Triggers for `updated_at`:
```sql
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW BEGIN UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id; END;
-- (Repeated for all tables with updated_at)
```

## 5. Views
- `v_active_goals`: Combines `goals` and count of associated `tasks` and `milestones`.
- `v_session_summary`: Exposes session message counts and duration.
- `v_memory_importance`: Ranks memories based on `importance_score`.
- `v_daily_brief`: Single unified view to power the dashboard (goals active + tasks due today).

## 6. ChromaDB Collections Schema
- `jarvis_conversations`: Chunks of sessions for semantic retrieval. Metadata: `session_id`.
- `jarvis_memories`: Memory embeddings. Metadata: `category`, `importance`, `permission`.
- `jarvis_knowledge`: Docs, articles, codebase insights.
- `jarvis_goals`: Goal descriptions.
- `jarvis_people`: Person profiles.
- `jarvis_code_snippets`: Reusable scripts.

## 7. Data Lifecycle & Retention Policy
- Session text is kept forever but replaced with LLM summaries after 30 days to save SQLite size.
- Memories sync: `chroma_id` bridges the vector entry. Deleting an entry in SQLite cascades a deletion in ChromaDB.
- Soft delete vs Hard delete: Sensitive data is hard deleted immediately. Non-sensitive data has a `status='abandoned'` or `deleted_at` field.

## 8. Migration Strategy
- Use Alembic for SQLite.
- On launch, Alembic checks revision head and applies migrations.
- ChromaDB schema updates will require re-embedding scripts if the dimensionality changes.
