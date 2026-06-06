# Changelog

## [1.0.0-rc1] - Sprint 1 Release Candidate

### Added
- **Core Architecture**: Electron Desktop Shell with React/Vite/Tailwind frontend.
- **Backend Services**: FastAPI backend using WebSockets for real-time bi-directional streaming.
- **Companion Agent**: LangChain based personality layer with dynamic contextual memory retrieval.
- **Memory Engine**: Dual-write SQLite (structured) and ChromaDB (semantic) persistent memory system.
- **Voice System**: OpenWakeWord and Faster-Whisper integrations for hands-free "Oh Oh" wake word detection.
- **Founder Mode**: Isolated context tracker for startup execution and metric tracking.
- **Hybrid AI Providers**: Fallback system between local Ollama (Qwen) and remote Google Gemini (Flash).
- **Export & Backup**: Single-click backup endpoint to export all SQLite databases and ChromaDB vectors as ZIP.
- **Security**: Context Isolated IPC architecture, no `nodeIntegration`.

### Changed
- Converted standard HTTP chat endpoints to WebSockets for token streaming.
- Replaced mock response bot with live LangChain Companion Agent.
