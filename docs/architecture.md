# JARVIS (Project oh_oho) Architecture

## Overview
JARVIS is a local-first Personal AI OS built for extreme speed, memory persistence, and deep companionship.

## Component Stack

### 1. The Shell (Frontend)
- **Electron**: Secures the application to the desktop context.
- **React / Vite**: Fast, glassmorphic UI using TailwindCSS and Framer Motion.
- **Zustand**: Manages global UI state (Chat, Settings, System context).

### 2. The Engine (Backend)
- **FastAPI**: Runs locally on port `8765`. Handles all AI logic.
- **WebSockets**: Facilitates real-time, bi-directional token streaming and voice chunks.

### 3. The Brain (AI & Memory)
- **Companion Agent**: LangChain orchestrator. Routes between Ollama (Local) and Gemini (Cloud).
- **ChromaDB**: Local vector database for embedding memories and semantic search.
- **SQLite**: Local relational database for tracking conversations, users, and tasks.
- **Voice System**: OpenWakeWord (Wake word detection) + Faster Whisper (STT) + Kokoro (TTS).

## Security
- IPC isolated preload scripts.
- No remote code execution.
- 100% local database storage.
