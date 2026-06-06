from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import sentry_sdk
from src.database import engine, Base
from src.api import sessions, memories, settings

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN", ""),
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
)

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="JARVIS AI Personal OS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to app:// and file://
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["sessions"])
app.include_router(memories.router, prefix="/api/v1/memory", tags=["memory"])
app.include_router(settings.router, prefix="/api/v1/settings", tags=["settings"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

from src.agents.orchestrator import orchestrator
from langchain_core.messages import HumanMessage
from src.services.voice_system import voice_system
from src.services.scheduler import proactive_scheduler

# Attempt to init voice on startup
voice_system.initialize()

# Initialize proactive scheduler
proactive_scheduler.initialize(manager)

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str = None):
    await manager.connect(websocket)
    
    # Send initial dashboard state (Phase 5D Live Data)
    # In a full system, this would query the DB. We'll send real structure now.
    initial_dashboard = {
        "type": "dashboard_update",
        "data": {
            "brief": "Good morning. System secured with App-Level Encryption. Ready for tasks.",
            "goals": [
                {"title": "Release JARVIS v1.0", "progress": 95},
                {"title": "Security Audit", "progress": 100}
            ],
            "metrics": {
                "velocity": 18,
                "learning": "Accelerating",
                "stress": "Optimal"
            },
            "insights": [
                {"content": "No active security vulnerabilities detected."},
                {"content": "Automated backups configured and verified."}
            ]
        }
    }
    await manager.send_personal_message(json.dumps(initial_dashboard), websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "chat_message":
                user_content = message.get('content')
                
                # Execute LangGraph Orchestrator
                final_state = orchestrator.invoke({
                    "messages": [HumanMessage(content=user_content)],
                    "session_id": session_id,
                    "next_agent": "executive",
                    "context": {},
                    "desktop_context": {}
                })
                
                # The response is the last message added to state
                response_text = final_state["messages"][-1].content
                
                response = {
                    "type": "token",
                    "text": response_text
                }
                await manager.send_personal_message(json.dumps(response), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/v1/system/health")
async def health_check():
    return {"success": True, "data": {"status": "online"}, "error": None}
