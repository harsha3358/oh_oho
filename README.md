# Project oh_oho (JARVIS Personal AI OS)

A production-grade, local-first AI Personal OS.

## 🚀 Sprint 1 Features (RC-1)
* **Hybrid AI**: Local Ollama (Qwen) with Google Gemini Fallback.
* **Memory Engine**: SQLite + ChromaDB semantic memory injection.
* **Voice System**: Hands-free Wake Word detection.
* **Founder Mode**: Isolated context tracking for high-tier startup execution.
* **Desktop Context**: Secure Electron wrapper with glassmorphic React UI.

## 🛠️ Tech Stack
* **Frontend**: Electron, React, Vite, Tailwind CSS V4, Zustand
* **Backend**: FastAPI, WebSockets, SQLAlchemy, LangChain
* **AI Models**: Qwen 2.5 (Ollama), Gemini 1.5 Flash
* **Vector DB**: ChromaDB

## 📦 Installation & Running

1. **Install Frontend Dependencies:**
   ```bash
   cd apps/desktop
   npm install
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Start Development Servers (Two Terminals):**
   ```bash
   # Terminal 1 (Backend)
   cd backend
   .\venv\Scripts\activate
   uvicorn src.main:app --host 127.0.0.1 --port 8765

   # Terminal 2 (Frontend)
   cd apps/desktop
   npm start
   ```

## 1. Project Tree
```
oh_oho/
├── apps/
│   └── desktop/              # Electron + React + Vite + Tailwind UI
│       ├── src/
│       │   ├── main/         # Electron Node.js entry
│       │   ├── preload/      # ContextBridge IPC
│       │   └── renderer/     # React DOM
│       │       ├── pages/    # Onboarding, ChatInterface
│       │       ├── stores/   # Zustand State Management
│       ├── package.json
│       └── vite.config.ts
├── backend/                  # FastAPI Core
│   ├── src/
│   │   ├── api/              # REST Endpoints
│   │   ├── models/           # SQLAlchemy schemas
│   │   ├── database.py       # SQL Engine setup
│   │   └── main.py           # FastAPI + WebSocket router
│   └── requirements.txt
└── README.md
```

## 2. Dependencies
**Frontend:**
- `react`, `react-dom`, `react-router-dom`
- `electron`
- `@tailwindcss/vite`, `tailwindcss`
- `zustand`, `framer-motion`

**Backend:**
- `fastapi`, `uvicorn`
- `sqlalchemy`, `pydantic`
- `websockets`, `httpx`
- `chromadb`, `openai` (for Gemini API fallback)

## 3. Environment Configuration
The backend expects standard Python 3.11+. The frontend expects Node.js v18+.
For SQLite, we are using the standard sqlite3 driver for Sprint 1 development compatibility.

## 4. Setup Instructions

**Backend Setup:**
1. Open a terminal in the `backend` folder.
2. Run `python -m venv venv`
3. Run `.\venv\Scripts\activate` (Windows)
4. Run `pip install fastapi uvicorn sqlalchemy chromadb pydantic httpx openai requests websockets`

**Frontend Setup:**
1. Open a terminal in the `apps/desktop` folder.
2. Run `npm install`
3. Run `npm run build` to compile the TypeScript main process.

## 5. Run Instructions
To run JARVIS locally in development mode:

**Terminal 1 (Backend):**
```bash
cd backend
.\venv\Scripts\activate
uvicorn src.main:app --host 127.0.0.1 --port 8765 --reload
```

**Terminal 2 (Frontend):**
```bash
cd apps/desktop
npm run dev
```

**Terminal 3 (Electron Shell):**
```bash
cd apps/desktop
npm start
```

## 6. Verification Checklist
- [x] Ensure backend starts on port `8765` without errors.
- [x] Open `http://localhost:8765/api/v1/system/health` in a browser and verify it returns `{"status": "online"}`.
- [x] Run Electron (`npm start`) and verify the JARVIS Initializing window appears.
- [x] Wait 2 seconds for the mock Model Manager to appear and verify UI flow.
- [x] Click "Start Download" or "Skip" to reach the Chat Interface.
- [x] Verify typing a message and clicking Send echoes back via the WebSocket.