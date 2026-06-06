# State Management Architecture

## 1. Frontend State Architecture — Zustand

### Why Zustand?
Lightweight, minimal boilerplate, great TypeScript support, and easy integration with React components without Context providers.

### Core Stores
1. **systemStore**: `jarvisState` (sleeping, listening, thinking, speaking), connection status, notifications.
2. **chatStore**: Active session, message history, streaming tokens, model selection.
3. **memoryStore**: Paginated memory lists, search filters, Life Graph D3 data.
4. **goalsStore**: OKRs, active goals, milestones, tasks.
5. **voiceStore**: Audio buffer levels (for waveform), recording status, STT transcripts.
6. **companionStore**: Profile data, emotional state, recent check-ins.
7. **settingsStore**: LLM keys, voice toggles, UI themes.
8. **founderStore**: Startup metrics, competitor data, current focus.

### Persistence
`settingsStore` and `systemStore` (partial) use `persist` middleware to `localStorage`. `chatStore` hydrates from API on load.

## 2. WebSocket State Integration
- Reducer-like approach in the event handler:
  - Event `token` -> `chatStore.appendToken(payload)`
  - Event `memory_saved` -> `memoryStore.add(payload)`
  - Event `system_state_change` -> `systemStore.setState(payload)`

## 3. Backend State Management (Python)
### Session State
Stored in memory (`Dict[session_id, SessionContext]`) and periodically synced to SQLite. Contains the conversation buffer and active LLM generation task.

### LangGraph Agent State
Agents maintain their own conversational state graphs. When an agent is invoked, its internal state is managed by LangGraph and persisted to SQLite using the LangGraph checkpointer.

### Voice Pipeline State
The Wake Word engine runs constantly. The STT buffers audio chunks into an asyncio Queue until silence is detected.

## 4. Performance Optimization
- **Zustand Selectors**: `useStore(state => state.specificField)` to prevent over-rendering.
- **Message Virtualization**: Uses `react-window` for the chat history to handle thousands of messages smoothly.
