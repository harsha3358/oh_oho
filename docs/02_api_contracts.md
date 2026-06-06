# API Contracts

## 1. API Architecture Overview
- **Server**: FastAPI on `localhost:8765`
- **Transport**: HTTP/1.1 REST + WebSockets
- **Auth**: Local bearer token in `Authorization: Bearer <token>`
- **Versioning**: `/api/v1/`
- **CORS**: Restricted to `file://` and Electron `app://` origins.

## 2. Global Conventions
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```
Pagination returns `{items: [...], total: 100, page: 1, per_page: 20, has_next: true}`.

## 3. WebSocket Protocol
Endpoint: `ws://localhost:8765/ws/{session_id}?token={auth_token}`

### Client → Server Events
- `chat_message`: `{"type": "chat_message", "content": "hello"}`
- `voice_chunk`: `{"type": "voice_chunk", "audio": "<base64>"}`

### Server → Client Events
- `thinking_start`: `{"type": "thinking_start"}`
- `token`: `{"type": "token", "text": "I am"}`
- `memory_retrieved`: `{"type": "memory_retrieved", "memories": [...]}`
- `memory_saved`: `{"type": "memory_saved", "memory_id": "123"}`
- `system_state_change`: `{"type": "system_state_change", "state": "speaking"}`
- `tts_audio_chunk`: `{"type": "tts_audio_chunk", "audio": "<base64>"}`

## 4. Full REST Endpoint Specifications

### Chat & Sessions
- `GET /api/v1/sessions` - List sessions.
- `POST /api/v1/sessions` - Create new session.
- `GET /api/v1/sessions/{id}/messages` - Get messages.

### Memory
- `GET /api/v1/memory` - List memories (with filters).
- `POST /api/v1/memory` - Explicitly add a memory.
- `POST /api/v1/memory/search` - Semantic search `{"query": "favorite color", "top_k": 5}`.

### Goals & Tasks
- `GET /api/v1/goals` - List goals.
- `POST /api/v1/goals` - Create goal.
- `POST /api/v1/goals/{id}/analyze` - Agent analyzes goal progress and gives insights.

### Companion
- `GET /api/v1/companion/profile` - Get Companion Profile.
- `POST /api/v1/companion/checkin` - Save check-in.
- `POST /api/v1/companion/reflect` - Trigger weekly reflection summary.

### Voice
- `GET /api/v1/voice/status` - VAD & Engine status.
- `PUT /api/v1/voice/config` - Update Wake Word, TTS, or STT settings.
- `POST /api/v1/voice/synthesize` - Synthesize ad-hoc text.

### LLM & Models
- `GET /api/v1/llm/providers` - Return Ollama/Gemini state.
- `PUT /api/v1/llm/config` - Switch active models.

### Agents
- `GET /api/v1/agents/runs` - History of agent runs.
- `POST /api/v1/agents/run` - Trigger an agent explicitly `{"agent": "research", "prompt": "..."}`.

### Plugins
- `GET /api/v1/plugins` - List installed plugins.
- `POST /api/v1/plugins/{id}/enable` - Enable plugin.

### System
- `GET /api/v1/system/health` - Ping components.
- `GET /api/v1/system/stats` - Disk/RAM usage.

### Settings
- `GET /api/v1/settings` - Global settings JSON.
- `PUT /api/v1/settings` - Patch settings.

### Founder Mode
- `GET /api/v1/founder/context` - Get startup context.
- `POST /api/v1/founder/analyze` - Trigger pitch/metrics analysis.

## 5. Rate Limiting & Error Handling
- Rate Limit: `100 req/sec` per endpoint locally (to prevent UI runaway loops).
- Error Codes: `LLM_OFFLINE`, `MEMORY_FULL`, `VOICE_NO_MIC`, `UNAUTHORIZED`.

## 6. Electron IPC Bridge
ContextBridge exposes:
- `window.jarvis.api.get(...)`
- `window.jarvis.api.post(...)`
- `window.jarvis.ws.connect(...)`
This keeps secrets out of the renderer process.
