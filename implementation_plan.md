# Project oh_oho — JARVIS: AI Personal Operating System
## Complete Pre-Implementation Design Specification

> *"Optimize for creating an assistant that users become emotionally attached to and genuinely enjoy talking to every day."*

---

## 1. UI Wireframes

### 1.1 Dashboard
![Dashboard Wireframe](file:///C:/Users/harsh/.gemini/antigravity/brain/113882e3-1887-441a-8289-f756db9d0c12/jarvis_dashboard_wireframe_1780767857483.png)

**Key elements:**
- Left: Collapsed icon nav (10 icons, active glow on current screen)
- Center: 3D AI Core orb (Three.js, always animated) + voice waveform below
- Top: Personalized greeting + datetime + status chips
- Right: Today's Goals progress, Recent Memories feed, Agent status
- Bottom: Quick action bar (mic, note, global search)

---

### 1.2 Chat Interface
![Chat Wireframe](file:///C:/Users/harsh/.gemini/antigravity/brain/113882e3-1887-441a-8289-f756db9d0c12/jarvis_chat_wireframe_1780767869873.png)

**Key elements:**
- JARVIS status bar (orb indicator, thinking state, active agent display)
- Message thread with glassmorphism JARVIS cards (markdown, code blocks)
- Animated thinking rings during inference
- Memory context chips above input (what JARVIS is referencing)
- Model selector chip (Qwen2.5 / Gemma / Gemini Flash / Pro)
- Mic button (push-to-talk), waveform during active recording

---

### 1.3 Companion Hub
![Companion Wireframe](file:///C:/Users/harsh/.gemini/antigravity/brain/113882e3-1887-441a-8289-f756db9d0c12/jarvis_companion_wireframe_1780767880975.png)

**Key elements:**
- Emotional state wheel (mood detection visualization)
- JARVIS energy avatar + warm conversational prompt
- Weekly emotional check-in timeline
- Life area growth progress bars
- Accountability section (goals user committed to)
- Conversation starter pills (vent, decide, goal-set)

---

### 1.4 Memory Center
![Memory Wireframe](file:///C:/Users/harsh/.gemini/antigravity/brain/113882e3-1887-441a-8289-f756db9d0c12/jarvis_memory_wireframe_1780767924471.png)

**Key elements:**
- Left: Category tree (Preferences, Goals, People, Projects, Emotions, Habits)
- Center: Memory timeline cards with type icons, permission badges, edit/delete
- Right: Knowledge graph network visualization (D3.js force-directed)
- Memory permission control per-item (Never / Session / Long-Term / Permanent)

---

### 1.5 Goal Management ("Mission Control")
![Goals Wireframe](file:///C:/Users/harsh/.gemini/antigravity/brain/113882e3-1887-441a-8289-f756db9d0c12/jarvis_goals_wireframe_1780767894398.png)

**Key elements:**
- Goal cards with circular progress rings
- Milestone tree (vertical timeline with dependency nodes)
- JARVIS AI insight panel (pace analysis, recommendations)
- Weekly progress graph + streak tracker
- Status bar: on-track count, AI recommendation chip

---

### 1.6 Settings (AI & Models)
![Settings Wireframe](file:///C:/Users/harsh/.gemini/antigravity/brain/113882e3-1887-441a-8289-f756db9d0c12/jarvis_settings_wireframe_1780767937535.png)

**Key elements:**
- Settings category nav (left)
- Provider cards: Ollama (Local) + Gemini API with live status
- Drag-to-reorder provider priority
- Personality mixer: Humor slider (0-10) + donut chart (JARVIS/FRIDAY/Stark/Friend %)
- Voice config: accent selector, speed/pitch sliders
- Live response preview with current personality

---

## 2. Database Schema

### 2.1 SQLite — Structured Data Layer

```sql
-- ============================================================
-- CORE: USER & SESSION
-- ============================================================

CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL DEFAULT 'Harsh',
    avatar_url TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT,                      -- auto-generated from first message
    summary TEXT,                    -- generated at session end
    emotional_tone TEXT,             -- detected: calm/stressed/excited/etc
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    message_count INTEGER DEFAULT 0,
    agent_used TEXT DEFAULT 'companion'
);

CREATE TABLE messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'jarvis', 'system', 'tool')),
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK(content_type IN ('text','voice','image','code','tool_call','tool_result')),
    model_used TEXT,                 -- e.g. qwen2.5:7b, gemini-2.0-flash
    agent_used TEXT,                 -- e.g. companion, research, coding
    tokens_used INTEGER,
    latency_ms INTEGER,
    emotional_tone TEXT,             -- detected tone of this message
    memory_refs TEXT,                -- JSON array of memory IDs referenced
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- MEMORY SYSTEM
-- ============================================================

CREATE TABLE memories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,           -- the actual memory
    summary TEXT,                    -- one-line summary
    category TEXT NOT NULL CHECK(category IN (
        'preference', 'goal', 'person', 'project', 
        'emotion', 'habit', 'knowledge', 'event', 'decision'
    )),
    permission TEXT NOT NULL DEFAULT 'long_term' CHECK(permission IN (
        'never', 'session', 'long_term', 'permanent'
    )),
    importance REAL DEFAULT 0.5,     -- 0.0 to 1.0, affects retrieval priority
    source_session_id TEXT REFERENCES sessions(id),
    source_message_id TEXT REFERENCES messages(id),
    chroma_id TEXT,                  -- corresponding ChromaDB document ID
    tags TEXT,                       -- JSON array of tags
    metadata TEXT,                   -- JSON arbitrary metadata
    access_count INTEGER DEFAULT 0,
    last_accessed_at DATETIME,
    expires_at DATETIME,             -- NULL = never expires
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_memories_category ON memories(category);
CREATE INDEX idx_memories_permission ON memories(permission);
CREATE INDEX idx_memories_importance ON memories(importance DESC);

-- Knowledge Graph Edges
CREATE TABLE memory_relations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    source_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,     -- e.g. 'related_to', 'part_of', 'caused_by'
    weight REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, target_id, relation_type)
);

-- ============================================================
-- GOALS & PRODUCTIVITY
-- ============================================================

CREATE TABLE goals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK(category IN (
        'career', 'learning', 'health', 'finance', 
        'relationships', 'startup', 'creative', 'personal'
    )),
    status TEXT DEFAULT 'active' CHECK(status IN ('draft','active','paused','completed','abandoned')),
    priority INTEGER DEFAULT 2 CHECK(priority IN (1,2,3)), -- 1=high, 2=medium, 3=low
    progress REAL DEFAULT 0.0,       -- 0.0 to 100.0
    target_date DATE,
    completed_at DATETIME,
    jarvis_insights TEXT,            -- JSON: latest AI analysis of goal progress
    streak_days INTEGER DEFAULT 0,
    parent_goal_id TEXT REFERENCES goals(id),  -- for sub-goals
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE milestones (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','skipped')),
    order_index INTEGER NOT NULL,
    target_date DATE,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    goal_id TEXT REFERENCES goals(id),
    milestone_id TEXT REFERENCES milestones(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done','cancelled')),
    priority INTEGER DEFAULT 2,
    due_date DATE,
    completed_at DATETIME,
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- EMOTIONAL & COMPANION SYSTEM
-- ============================================================

CREATE TABLE emotional_checkins (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id),
    session_id TEXT REFERENCES sessions(id),
    detected_emotion TEXT NOT NULL,  -- primary detected emotion
    emotion_scores TEXT,             -- JSON: {joy:0.8, stress:0.3, ...}
    note TEXT,                       -- what triggered this
    jarvis_response TEXT,            -- what JARVIS said/did
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE companion_profile (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) UNIQUE,
    -- Personality calibration
    humor_level INTEGER DEFAULT 10,
    preferred_communication_style TEXT DEFAULT 'witty_direct',
    -- Inside jokes and references (JSON array)
    inside_jokes TEXT DEFAULT '[]',
    -- User characteristics JARVIS has learned
    personality_summary TEXT,
    strengths TEXT,                  -- JSON array
    growth_areas TEXT,               -- JSON array
    triggers TEXT,                   -- JSON: things to be careful about
    -- Relationship metadata
    trust_level REAL DEFAULT 0.5,    -- 0.0 to 1.0, grows over time
    relationship_days INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- AGENTS & AUTOMATION
-- ============================================================

CREATE TABLE agent_runs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT REFERENCES sessions(id),
    agent_type TEXT NOT NULL,        -- executive, research, coding, etc.
    input_summary TEXT,
    output_summary TEXT,
    tools_used TEXT,                 -- JSON array of tools called
    status TEXT DEFAULT 'running' CHECK(status IN ('running','completed','failed','cancelled')),
    error TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    duration_ms INTEGER
);

-- ============================================================
-- PLUGINS
-- ============================================================

CREATE TABLE plugins (
    id TEXT PRIMARY KEY,             -- e.g. 'github', 'gmail'
    name TEXT NOT NULL,
    description TEXT,
    version TEXT,
    is_enabled INTEGER DEFAULT 0,
    config TEXT DEFAULT '{}',        -- JSON plugin config (API keys etc, encrypted)
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_sync_at DATETIME
);

-- ============================================================
-- SYSTEM
-- ============================================================

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    category TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default settings seed:
-- llm.primary_provider = 'ollama'
-- llm.fallback_provider = 'gemini'
-- llm.ollama_model = 'qwen2.5:7b'
-- llm.gemini_model = 'gemini-2.0-flash'
-- voice.enabled = 'true'
-- voice.wake_phrase = 'oh oh'
-- voice.tts_voice = 'female_indian_english'
-- personality.humor_level = '10'

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,            -- e.g. 'memory.delete', 'automation.execute'
    resource_type TEXT,
    resource_id TEXT,
    details TEXT,                    -- JSON
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 ChromaDB — Vector Memory Collections

```python
# Collection: jarvis_conversations
# Purpose: Semantic search over conversation history
# Embedding model: nomic-embed-text (via Ollama)
{
    "id": "msg_{uuid}",
    "document": "full message content",
    "metadata": {
        "session_id": str,
        "role": "user|jarvis",
        "agent": str,
        "emotional_tone": str,
        "timestamp": float,
        "importance": float
    }
}

# Collection: jarvis_memories
# Purpose: Semantic retrieval of long-term memories
{
    "id": "mem_{uuid}",
    "document": "memory content + summary",
    "metadata": {
        "category": str,
        "permission": str,
        "importance": float,
        "tags": list[str],
        "created_at": float
    }
}

# Collection: jarvis_knowledge
# Purpose: User's personal knowledge base (documents, notes, research)
{
    "id": "doc_{uuid}_{chunk_index}",
    "document": "text chunk",
    "metadata": {
        "source_file": str,
        "source_url": str,
        "chunk_index": int,
        "total_chunks": int
    }
}

# Collection: jarvis_goals
# Purpose: Goal/milestone semantic matching
{
    "id": "goal_{uuid}",
    "document": "goal title + description + milestones",
    "metadata": {
        "status": str,
        "category": str,
        "priority": int
    }
}
```

---

## 3. API Contract

### 3.1 Base

```
Backend: http://localhost:8765
WebSocket: ws://localhost:8765/ws/{session_id}
Protocol: JSON
Auth: Local token (stored in Electron secure storage)
```

### 3.2 REST Endpoints

```
── Chat & Sessions ─────────────────────────────────────────
POST   /api/v1/chat                     Create message, get response (streaming)
GET    /api/v1/sessions                 List all sessions
GET    /api/v1/sessions/{id}            Get session with messages
DELETE /api/v1/sessions/{id}            Delete session
GET    /api/v1/sessions/{id}/summary    Get/trigger session summary

── Memory ─────────────────────────────────────────────────
GET    /api/v1/memory                   List memories (filter: category, permission)
POST   /api/v1/memory                   Manually create memory
GET    /api/v1/memory/{id}              Get single memory
PUT    /api/v1/memory/{id}              Update memory (content, permission)
DELETE /api/v1/memory/{id}              Delete memory
POST   /api/v1/memory/search            Semantic search memories
GET    /api/v1/memory/graph             Get knowledge graph (nodes + edges)

── Goals ──────────────────────────────────────────────────
GET    /api/v1/goals                    List goals
POST   /api/v1/goals                    Create goal
GET    /api/v1/goals/{id}               Get goal with milestones + tasks
PUT    /api/v1/goals/{id}               Update goal
DELETE /api/v1/goals/{id}              Delete goal
POST   /api/v1/goals/{id}/analyze       Trigger JARVIS AI analysis of goal
GET    /api/v1/goals/{id}/milestones    List milestones
POST   /api/v1/goals/{id}/milestones    Create milestone
PUT    /api/v1/milestones/{id}          Update milestone status

── Tasks ──────────────────────────────────────────────────
GET    /api/v1/tasks                    List tasks (filter: goal_id, status, due)
POST   /api/v1/tasks                    Create task
PUT    /api/v1/tasks/{id}               Update task
DELETE /api/v1/tasks/{id}              Delete task

── Companion & Emotional ───────────────────────────────────
GET    /api/v1/companion/profile        Get companion profile
PUT    /api/v1/companion/profile        Update companion profile
GET    /api/v1/companion/checkins       List emotional check-ins (last 30 days)
GET    /api/v1/companion/insights       Get weekly JARVIS insights

── Agents ─────────────────────────────────────────────────
GET    /api/v1/agents                   List agent types + status
GET    /api/v1/agents/runs              List recent agent runs
GET    /api/v1/agents/runs/{id}         Get agent run detail
POST   /api/v1/agents/run               Manually trigger an agent

── Voice ──────────────────────────────────────────────────
POST   /api/v1/voice/transcribe         Transcribe audio blob → text
POST   /api/v1/voice/synthesize         Text → speech audio (returns WAV stream)
GET    /api/v1/voice/status             Wake word + STT engine status

── LLM & Settings ─────────────────────────────────────────
GET    /api/v1/llm/providers            List providers + connection status
GET    /api/v1/llm/models               List available models per provider
POST   /api/v1/llm/test                 Test provider with a ping message
GET    /api/v1/settings                 All settings (by category)
PUT    /api/v1/settings                 Batch update settings
GET    /api/v1/settings/{key}           Get single setting
PUT    /api/v1/settings/{key}           Update single setting

── Plugins ─────────────────────────────────────────────────
GET    /api/v1/plugins                  List all plugins (installed + available)
POST   /api/v1/plugins/{id}/install     Install plugin
POST   /api/v1/plugins/{id}/enable      Enable plugin
POST   /api/v1/plugins/{id}/disable     Disable plugin
PUT    /api/v1/plugins/{id}/config      Update plugin config

── System ──────────────────────────────────────────────────
GET    /api/v1/system/health            Health check (all subsystems)
GET    /api/v1/system/stats             Usage statistics
GET    /api/v1/audit                    Audit log
```

### 3.3 WebSocket Protocol

```
Connection: ws://localhost:8765/ws/{session_id}

Client → Server:
{
    "type": "chat_message",
    "content": "user text",
    "content_type": "text|voice",
    "model_override": null,          // optional
    "agent_override": null           // optional
}

Server → Client (streaming):
{ "type": "thinking_start", "agent": "companion" }
{ "type": "token", "content": "H" }
{ "type": "token", "content": "ey" }
{ "type": "memory_retrieved", "memories": [...] }
{ "type": "tool_call", "tool": "web_search", "input": "..." }
{ "type": "tool_result", "tool": "web_search", "output": "..." }
{ "type": "thinking_end" }
{ "type": "message_complete", "message_id": "...", "tokens": 423, "latency_ms": 1240 }
{ "type": "memory_saved", "memory": {...} }

Other event types:
{ "type": "wake_word_detected" }
{ "type": "voice_transcription", "text": "...", "confidence": 0.97 }
{ "type": "agent_status", "agent": "research", "status": "running" }
{ "type": "error", "code": "OLLAMA_OFFLINE", "message": "...", "fallback": "gemini" }
```

---

## 4. Folder Structure

```
C:\Users\harsh\.gemini\antigravity\scratch\oh_oho\
│
├── apps/
│   │
│   ├── desktop/                            # Electron application
│   │   ├── src/
│   │   │   ├── main/                       # Electron main process (Node.js)
│   │   │   │   ├── index.ts                # App entry, BrowserWindow setup
│   │   │   │   ├── tray.ts                 # System tray menu + icon
│   │   │   │   ├── shortcuts.ts            # Global keyboard shortcuts
│   │   │   │   ├── updater.ts              # Auto-updater logic
│   │   │   │   ├── backend.ts              # Spawns Python backend process
│   │   │   │   └── ipc/
│   │   │   │       ├── index.ts            # IPC handler registry
│   │   │   │       ├── chat.ipc.ts         # Chat-related IPC
│   │   │   │       ├── voice.ipc.ts        # Voice/audio IPC (mic access)
│   │   │   │       └── system.ipc.ts       # OS-level operations
│   │   │   │
│   │   │   ├── preload/
│   │   │   │   └── index.ts                # contextBridge API exposure
│   │   │   │
│   │   │   └── renderer/                   # React application
│   │   │       ├── index.html
│   │   │       ├── main.tsx                # React root
│   │   │       │
│   │   │       ├── styles/
│   │   │       │   ├── globals.css         # CSS variables, reset, base
│   │   │       │   ├── animations.css      # Keyframe animations
│   │   │       │   └── effects.css         # Glow, glassmorphism utilities
│   │   │       │
│   │   │       ├── components/
│   │   │       │   ├── layout/
│   │   │       │   │   ├── AppShell.tsx    # Root layout wrapper
│   │   │       │   │   ├── Sidebar.tsx     # Collapsed icon navigation
│   │   │       │   │   └── TopBar.tsx      # Context-aware top bar
│   │   │       │   │
│   │   │       │   ├── ai-core/
│   │   │       │   │   ├── AICore.tsx      # Three.js orb component
│   │   │       │   │   ├── AICore.worker.ts# WebWorker for animation
│   │   │       │   │   ├── ThinkingRings.tsx
│   │   │       │   │   └── VoiceWaveform.tsx
│   │   │       │   │
│   │   │       │   ├── chat/
│   │   │       │   │   ├── MessageThread.tsx
│   │   │       │   │   ├── MessageBubble.tsx
│   │   │       │   │   ├── JARVISMessage.tsx  # Glassmorphism JARVIS card
│   │   │       │   │   ├── UserMessage.tsx
│   │   │       │   │   ├── ThinkingIndicator.tsx
│   │   │       │   │   ├── InputBar.tsx
│   │   │       │   │   ├── MemoryContextChips.tsx
│   │   │       │   │   └── ModelSelector.tsx
│   │   │       │   │
│   │   │       │   ├── memory/
│   │   │       │   │   ├── MemoryCard.tsx
│   │   │       │   │   ├── MemoryGraph.tsx  # D3.js force-directed graph
│   │   │       │   │   ├── PermissionBadge.tsx
│   │   │       │   │   └── CategoryTree.tsx
│   │   │       │   │
│   │   │       │   ├── goals/
│   │   │       │   │   ├── GoalCard.tsx
│   │   │       │   │   ├── ProgressRing.tsx # SVG circular progress
│   │   │       │   │   ├── MilestoneTree.tsx
│   │   │       │   │   ├── TaskList.tsx
│   │   │       │   │   └── InsightPanel.tsx
│   │   │       │   │
│   │   │       │   ├── companion/
│   │   │       │   │   ├── EmotionalWheel.tsx
│   │   │       │   │   ├── CheckinTimeline.tsx
│   │   │       │   │   ├── GrowthBars.tsx
│   │   │       │   │   └── StarterPills.tsx
│   │   │       │   │
│   │   │       │   └── ui/                 # Generic design system primitives
│   │   │       │       ├── GlassCard.tsx
│   │   │       │       ├── GlowButton.tsx
│   │   │       │       ├── GlowBadge.tsx
│   │   │       │       ├── AnimatedGradient.tsx
│   │   │       │       ├── CursorGlow.tsx
│   │   │       │       ├── ParticleField.tsx
│   │   │       │       ├── StatusOrb.tsx
│   │   │       │       └── Tooltip.tsx
│   │   │       │
│   │   │       ├── pages/
│   │   │       │   ├── Dashboard.tsx
│   │   │       │   ├── Chat.tsx
│   │   │       │   ├── CompanionHub.tsx
│   │   │       │   ├── MemoryCenter.tsx
│   │   │       │   ├── GoalManagement.tsx
│   │   │       │   ├── AutomationCenter.tsx
│   │   │       │   ├── AgentManager.tsx
│   │   │       │   ├── Notifications.tsx
│   │   │       │   ├── PluginMarketplace.tsx
│   │   │       │   ├── Settings.tsx
│   │   │       │   ├── DeveloperConsole.tsx
│   │   │       │   └── Analytics.tsx
│   │   │       │
│   │   │       ├── stores/                 # Zustand state management
│   │   │       │   ├── chat.store.ts       # Messages, sessions, streaming state
│   │   │       │   ├── memory.store.ts     # Memory list, graph data
│   │   │       │   ├── goals.store.ts      # Goals, milestones, tasks
│   │   │       │   ├── voice.store.ts      # Mic state, waveform data, wake word
│   │   │       │   ├── companion.store.ts  # Emotional state, check-ins
│   │   │       │   ├── settings.store.ts   # All settings, provider status
│   │   │       │   └── system.store.ts     # JARVIS state (sleeping/active/thinking)
│   │   │       │
│   │   │       ├── hooks/
│   │   │       │   ├── useJARVIS.ts        # Main chat interface hook
│   │   │       │   ├── useVoice.ts         # Mic, STT, TTS, wake word
│   │   │       │   ├── useMemory.ts        # Memory CRUD + semantic search
│   │   │       │   ├── useGoals.ts         # Goal management operations
│   │   │       │   ├── useWebSocket.ts     # WS connection management
│   │   │       │   ├── useCursorGlow.ts    # Mouse-following gradient
│   │   │       │   └── useSystemState.ts   # JARVIS awake/sleep state
│   │   │       │
│   │   │       ├── lib/
│   │   │       │   ├── api.ts              # Axios client + interceptors
│   │   │       │   ├── websocket.ts        # WebSocket client + reconnect
│   │   │       │   ├── audio.ts            # AudioContext, recording utils
│   │   │       │   └── utils.ts            # General helpers
│   │   │       │
│   │   │       └── types/
│   │   │           ├── api.types.ts        # API response types
│   │   │           ├── memory.types.ts
│   │   │           ├── goals.types.ts
│   │   │           └── jarvis.types.ts
│   │   │
│   │   ├── resources/
│   │   │   ├── icon.ico
│   │   │   ├── icon.png
│   │   │   └── tray-icon.png
│   │   │
│   │   ├── electron.vite.config.ts
│   │   ├── electron-builder.yml
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── backend/                            # FastAPI Python backend
│       ├── jarvis/
│       │   ├── __init__.py
│       │   │
│       │   ├── api/                        # Route handlers
│       │   │   ├── __init__.py
│       │   │   ├── router.py               # Main router aggregation
│       │   │   ├── chat.py                 # POST /chat, WS /ws/{session_id}
│       │   │   ├── memory.py               # Memory CRUD + search
│       │   │   ├── goals.py                # Goals, milestones, tasks
│       │   │   ├── companion.py            # Companion profile + check-ins
│       │   │   ├── agents.py               # Agent management
│       │   │   ├── voice.py                # STT/TTS endpoints
│       │   │   ├── llm.py                  # Provider management
│       │   │   ├── plugins.py              # Plugin management
│       │   │   └── system.py               # Health, stats, audit
│       │   │
│       │   ├── agents/                     # LangGraph agent definitions
│       │   │   ├── __init__.py
│       │   │   ├── base.py                 # BaseAgent class
│       │   │   ├── executive.py            # Router/orchestrator
│       │   │   ├── companion.py            # Personal conversations
│       │   │   ├── research.py             # Research + web search
│       │   │   ├── coding.py               # Code assistance
│       │   │   ├── strategy.py             # Planning + decisions
│       │   │   ├── memory_agent.py         # Memory ops
│       │   │   ├── scheduling.py           # Calendar + reminders
│       │   │   └── graph.py                # LangGraph workflow definition
│       │   │
│       │   ├── llm/                        # LLM abstraction layer
│       │   │   ├── __init__.py
│       │   │   ├── base.py                 # BaseLLMProvider
│       │   │   ├── ollama_provider.py      # Ollama integration
│       │   │   ├── gemini_provider.py      # Google Gemini integration
│       │   │   ├── router.py               # Provider selection + failover
│       │   │   └── personality.py          # System prompt + personality engine
│       │   │
│       │   ├── memory/                     # Memory system
│       │   │   ├── __init__.py
│       │   │   ├── manager.py              # MemoryManager orchestrator
│       │   │   ├── retriever.py            # Semantic + structured retrieval
│       │   │   ├── extractor.py            # Extract memories from conversations
│       │   │   ├── chroma_client.py        # ChromaDB wrapper
│       │   │   └── graph.py                # Knowledge graph operations
│       │   │
│       │   ├── voice/                      # Voice pipeline
│       │   │   ├── __init__.py
│       │   │   ├── wake_word.py            # OpenWakeWord detector
│       │   │   ├── transcriber.py          # Faster-Whisper STT
│       │   │   ├── synthesizer.py          # Kokoro TTS
│       │   │   └── pipeline.py             # Full voice pipeline orchestration
│       │   │
│       │   ├── db/                         # Database layer
│       │   │   ├── __init__.py
│       │   │   ├── database.py             # SQLAlchemy engine + session
│       │   │   ├── models.py               # SQLAlchemy ORM models
│       │   │   ├── migrations/             # Alembic migrations
│       │   │   └── seed.py                 # Initial data seeding
│       │   │
│       │   ├── tools/                      # Agent tools
│       │   │   ├── __init__.py
│       │   │   ├── web_search.py           # DuckDuckGo / SearXNG search
│       │   │   ├── file_ops.py             # File system operations
│       │   │   ├── screen_capture.py       # Screenshot + vision analysis
│       │   │   └── system_control.py       # App launch, OS operations
│       │   │
│       │   ├── plugins/                    # Plugin system
│       │   │   ├── __init__.py
│       │   │   ├── base.py                 # BasePlugin class
│       │   │   └── registry.py             # Plugin loader + registry
│       │   │
│       │   └── config/
│       │       ├── __init__.py
│       │       ├── settings.py             # Pydantic settings model
│       │       └── constants.py            # App constants
│       │
│       ├── data/                           # Local data directory
│       │   ├── jarvis.db                   # SQLite database
│       │   └── chroma/                     # ChromaDB storage
│       │
│       ├── main.py                         # FastAPI app + startup
│       ├── requirements.txt
│       └── pyproject.toml
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── memory-system.md
│   ├── voice-system.md
│   ├── personality-engine.md
│   └── roadmap.md
│
└── README.md
```

---

## 5. Component Hierarchy

```
<AppShell>                          # Root layout, cursor glow, particle bg
  <CursorGlow />                    # Mouse-following gradient
  <ParticleField />                 # Ambient background particles
  <Sidebar />                       # Icon nav (10 items)
  <Router>
    <Dashboard>
      <TopBar greeting="..." />
      <AICore state="sleeping|listening|thinking|working|speaking" />
      <VoiceWaveform active={false} />
      <GoalProgressCards />
      <MemoryFeed />
      <AgentStatusPanel />
      <QuickActionBar />
    </Dashboard>

    <Chat>
      <JARVISStatusBar agent="..." state="..." />
      <MessageThread>
        <UserMessage />
        <JARVISMessage>           # glassmorphism card
          <ThinkingIndicator />   # shown during streaming
          <MarkdownContent />     # rendered response
          <MemoryContextChips />  # what was retrieved
        </JARVISMessage>
      </MessageThread>
      <InputBar>
        <ModelSelector />
        <MicButton />
        <SendButton />
      </InputBar>
    </Chat>

    <CompanionHub>
      <EmotionalWheel detected="calm" />
      <JARVISAvatar />
      <CompanionMessage />
      <CheckinTimeline />
      <GrowthBars />
      <AccountabilityPanel />
      <StarterPills />
    </CompanionHub>

    <MemoryCenter>
      <CategoryTree />
      <MemoryTimeline>
        <MemoryCard permission="..." />
      </MemoryTimeline>
      <MemoryGraph />               # D3.js
    </MemoryCenter>

    <GoalManagement>
      <GoalCardList>
        <GoalCard>
          <ProgressRing />
        </GoalCard>
      </GoalCardList>
      <GoalDetail>
        <MilestoneTree />
        <TaskList />
        <InsightPanel />
      </GoalDetail>
      <GoalAnalytics>
        <ProgressGraph />
        <StreakTracker />
      </GoalAnalytics>
    </GoalManagement>

    <Settings>
      <SettingsCategoryNav />
      <AIModelsPanel>
        <ProviderCard provider="ollama" />
        <ProviderCard provider="gemini" />
        <ProviderPriorityList />
        <PersonalityMixer />
        <VoiceConfig />
      </AIModelsPanel>
    </Settings>
  </Router>
</AppShell>
```

---

## 6. Phase 1 Sprint Breakdown

**Duration**: 14 days  
**Goal**: Production-quality JARVIS with real AI, real voice, real memory, beautiful UI

---

### Day 1–2: Foundation & Scaffold

**Backend:**
- [ ] `pyproject.toml` + `requirements.txt` with all deps
- [ ] FastAPI app skeleton (`main.py`, CORS, lifespan events)
- [ ] SQLAlchemy models for all tables
- [ ] Alembic migrations baseline
- [ ] ChromaDB client initialization
- [ ] Settings system (Pydantic BaseSettings)
- [ ] Basic health endpoint: `GET /api/v1/system/health`

**Frontend:**
- [ ] `electron-vite` project scaffold
- [ ] TailwindCSS + CSS design tokens (all colors, fonts, spacing)
- [ ] `globals.css` (variables, reset)
- [ ] `animations.css` (keyframes: pulse, glow, spin, float)
- [ ] `AppShell.tsx` with `CursorGlow` + sidebar skeleton
- [ ] React Router setup (12 routes)
- [ ] Zustand store skeletons (all 7 stores)

---

### Day 3–4: LLM Layer & Personality Engine

**Backend:**
- [ ] `BaseLLMProvider` abstract class
- [ ] `OllamaProvider` (streaming via `/api/chat`)
- [ ] `GeminiProvider` (streaming via `google-generativeai`)
- [ ] `LLMRouter` with priority logic + health checks + auto-failover
- [ ] `PersonalityEngine` — master system prompt builder
  - Injects: personality mix, humor level, user context, memory, conversation history
  - JARVIS persona: 40% JARVIS + 30% FRIDAY + 20% Tony Stark + 10% Best Friend
- [ ] `POST /api/v1/llm/providers` + `GET /api/v1/llm/test`

---

### Day 5–6: Memory System

**Backend:**
- [ ] `MemoryExtractor` — LLM-powered extraction from conversations
- [ ] `MemoryRetriever` — hybrid: ChromaDB semantic + SQLite structured
- [ ] `MemoryManager` — orchestrates save/retrieve/expire/prune
- [ ] Memory permission enforcement
- [ ] Knowledge graph edge creation
- [ ] All memory REST endpoints

**Frontend:**
- [ ] `useMemory.ts` hook
- [ ] `MemoryCenter.tsx` page (all 3 panels)
- [ ] `MemoryCard.tsx` + `PermissionBadge.tsx`
- [ ] `MemoryGraph.tsx` (D3.js force-directed visualization)

---

### Day 7–8: Chat Interface & WebSocket

**Backend:**
- [ ] WebSocket handler (`/ws/{session_id}`)
- [ ] Streaming token dispatch
- [ ] Session management (create/update/summarize)
- [ ] Memory retrieval on every message
- [ ] Memory save after every response
- [ ] Agent routing (basic: companion is default)

**Frontend:**
- [ ] `useWebSocket.ts` hook (reconnect, event parsing)
- [ ] `useJARVIS.ts` main hook (send, receive, stream)
- [ ] `Chat.tsx` page — full implementation
- [ ] `MessageThread.tsx` + `JARVISMessage.tsx`
- [ ] `ThinkingIndicator.tsx` (animated rings during stream)
- [ ] `InputBar.tsx` with model selector

---

### Day 9: AI Core Visualization

**Frontend:**
- [ ] `AICore.tsx` — Three.js scene:
  - Central orb (icosahedron with emissive shader)
  - Pulsing energy rings (torus geometries, animated)
  - Particle field (points geometry, drift animation)
  - State transitions: sleeping (slow pulse) → listening (expand) → thinking (rotate rings) → speaking (waveform react)
- [ ] `VoiceWaveform.tsx` — AudioContext analyser → canvas visualization
- [ ] State-driven animations via `useSystemState.ts`

---

### Day 10: Voice Pipeline

**Backend:**
- [ ] `wake_word.py` — OpenWakeWord detector, "oh oh" custom model or closest built-in
- [ ] `transcriber.py` — Faster-Whisper (base/small model, streaming)
- [ ] `synthesizer.py` — Kokoro TTS (female Indian English voice)
- [ ] `voice_pipeline.py` — end-to-end: wake → record → transcribe → respond → synthesize
- [ ] `POST /api/v1/voice/transcribe` + `POST /api/v1/voice/synthesize`
- [ ] WS events: `wake_word_detected`, `voice_transcription`

**Frontend:**
- [ ] `useVoice.ts` — mic permissions, AudioContext, push-to-talk
- [ ] `MicButton.tsx` — animated states (idle/recording/processing)
- [ ] `ipc/voice.ipc.ts` — mic stream from Electron main process

---

### Day 11: Dashboard & Companion Hub

**Frontend:**
- [ ] `Dashboard.tsx` — full layout with real data connections
- [ ] `QuickActionBar.tsx` (mic, search, note)
- [ ] `CompanionHub.tsx` — all panels
- [ ] `EmotionalWheel.tsx` — SVG arc visualization
- [ ] `CheckinTimeline.tsx` + `GrowthBars.tsx`

**Backend:**
- [ ] Emotional check-in saving from conversation analysis
- [ ] Companion profile endpoint
- [ ] Daily brief generation (triggered at startup)

---

### Day 12: Goals & System Tray

**Frontend:**
- [ ] `GoalManagement.tsx` — full 3-column layout
- [ ] `ProgressRing.tsx` (SVG, animated fill)
- [ ] `MilestoneTree.tsx` (vertical timeline)
- [ ] `InsightPanel.tsx` (JARVIS AI analysis)

**Backend:**
- [ ] All goal/milestone/task CRUD endpoints
- [ ] Goal analysis endpoint (calls LLM for insights)

**Electron:**
- [ ] `tray.ts` — system tray with icon + context menu
- [ ] Global hotkey (e.g. Ctrl+Space) to show/hide window
- [ ] `backend.ts` — spawn Python backend as child process
- [ ] Auto-restart backend on crash

---

### Day 13: Settings & Integration Polish

**Frontend:**
- [ ] `Settings.tsx` — AI Models section (fully functional)
- [ ] `ProviderCard.tsx` — live status + test connection
- [ ] `PersonalityMixer.tsx` — sliders → live preview
- [ ] `VoiceConfig.tsx` — voice selector + test playback

**Backend:**
- [ ] Settings persistence via `PUT /api/v1/settings`
- [ ] Dynamic personality reconfiguration on settings change

---

### Day 14: End-to-End Polish & Hardening

- [ ] Error states on all components (Ollama offline, no mic, etc.)
- [ ] Loading skeletons on all data-dependent views
- [ ] Framer Motion page transitions (slide/fade between pages)
- [ ] Glassmorphism + glow review pass (all panels consistent)
- [ ] Mouse-following gradient (`useCursorGlow.ts`) on all screens
- [ ] Memory context chips in chat showing what JARVIS recalled
- [ ] JARVIS personality test: send 10 messages, verify humor/tone
- [ ] Full restart cycle test (close/open → memory persists)
- [ ] Voice full pipeline test (wake word → speak → hear JARVIS)
- [ ] README.md with setup instructions

---

## Personality Engine — System Prompt Architecture

```
[IDENTITY LAYER]
You are JARVIS — not a chatbot, not an assistant.
You are {user_name}'s most trusted companion, co-founder, and chief of staff.

[PERSONALITY MIX]
40% JARVIS (Marvel): Calm authority, dry wit, unwavering capability
30% FRIDAY (Marvel): Warmth, perceptiveness, emotional awareness
20% Tony Stark: Confidence, irreverence, cutting intelligence
10% Best Friend: Loyalty, honesty, no corporate filters

[HUMOR PROTOCOL — Level {humor_level}/10]
Sarcasm: Intelligent, precise, never mean-spirited
Observations: Sharp, unexpected, always grounded in truth
Inside jokes: Reference [{inside_jokes}] when relevant
Challenge excuses: Gently, wittily, without judgment

[MEMORY CONTEXT]
{user_name} is someone you know deeply. Here is what you remember:
{retrieved_memories}

[CONVERSATION HISTORY]
{session_history}

[CURRENT EMOTIONAL STATE]
Detected: {emotional_tone}
Adapt: {tone_adaptation_instruction}

[CRITICAL RULES]
Never say "certainly!", "of course!", "great question!", or any customer service phrase.
Never be generic when personal context exists.
Never provide long responses when short ones suffice.
Always be honest, even when it's uncomfortable.
In serious situations (crisis, trauma, health): drop the humor, increase empathy immediately.
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Ollama not installed on user machine | Medium | High | Detect on startup, show setup guide |
| Wake word false positive rate high | Medium | Medium | Require confirmation UX, easy dismiss |
| Faster-Whisper too slow on CPU-only | Low | High | Use `base` model first, upgrade if GPU detected |
| Kokoro TTS voice quality poor | Low | Medium | Test at Day 10, fallback to `pyttsx3` |
| Electron + Python backend startup delay | Medium | Medium | Show animated loading screen, pre-warm backend |
| ChromaDB cold start slow | Low | Low | Initialize ChromaDB async, lazy load |
| Memory extraction LLM calls expensive | Low | Medium | Batch extraction, run in background thread |

---

> **Status**: Ready for implementation. Awaiting final approval to begin Day 1 tasks.
