# Detailed Folder Structure

## Root Directory
```text
oh_oho/
├── apps/
│   ├── desktop/              # Electron App + React Frontend
│   │   ├── src/
│   │   │   ├── main/         # Electron main process (Node.js)
│   │   │   ├── preload/      # IPC Bridge
│   │   │   └── renderer/     # React frontend
│   │   │       ├── assets/   # Fonts, icons, 3D models
│   │   │       ├── components/ # Shared UI components
│   │   │       ├── hooks/    # Custom React hooks
│   │   │       ├── stores/   # Zustand stores
│   │   │       ├── pages/    # Dashboard, Chat, Memory, Goals
│   │   │       ├── services/ # API and WS clients
│   │   │       └── utils/    # Formatting, math, etc.
│   │   ├── package.json
│   │   └── tailwind.config.js
│   │
│   └── backend/              # FastAPI Python Backend
│       ├── src/
│       │   ├── api/          # REST endpoints (routers)
│       │   ├── ws/           # WebSocket handlers
│       │   ├── core/         # Config, security, DB connections
│       │   ├── models/       # Pydantic & SQLAlchemy schemas
│       │   ├── services/     # Business logic (goals, memory, etc.)
│       │   ├── agents/       # LangGraph agents
│       │   │   ├── companion/ # The core JARVIS agent
│       │   │   ├── research/  # Web search and deep dive agent
│       │   │   └── founder/   # Startup strategy agent
│       │   ├── memory/       # ChromaDB interactions and extraction
│       │   ├── voice/        # STT, TTS, Wake Word pipelines
│       │   └── plugins/      # Plugin manager and sandbox
│       ├── pyproject.toml
│       └── alembic/          # Database migrations
│
├── packages/
│   ├── shared-types/         # TS interfaces shared between Electron/React
│   └── ui-kit/               # Reusable Tailwind/Framer components
│
├── plugins/                  # Default first-party plugins
│   ├── github/
│   └── gmail/
│
├── docs/                     # Engineering documentation and Architecture
├── scripts/                  # Build, test, and deployment scripts
└── .github/                  # CI/CD pipelines
```
