import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
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

app = FastAPI(title="Harsha's Assistant AI Personal OS", version="1.0.0")

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

@app.on_event("startup")
async def startup_event():
    # Attempt to init voice on startup
    voice_system.initialize(manager)
    voice_system.start_listening()
    
    # Initialize proactive scheduler inside event loop
    proactive_scheduler.initialize(manager)

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str = None):
    await manager.connect(websocket)
    
    # Send initial dashboard state (Phase 5D Live Data)
    # In a full system, this would query the DB. We'll send real structure now.
    import random

    def generate_greeting():
        greetings = [
            "Good morning Harsha. Ready to build a billion-dollar company, or are we pretending to work today?",
            "Welcome back Harsha. Your goals survived another night.",
            "Good evening Harsha. Truxlo is waiting. Your excuses are waiting too.",
            "Hello Harsha. I've prepared your Daily Brief. Try not to ignore it this time.",
            "Welcome back Harsha. Let's maximize execution velocity today."
        ]
        return random.choice(greetings)

    initial_dashboard = {
        "type": "dashboard_update",
        "data": {
            "greeting": generate_greeting(),
            "brief": "I have analyzed your Truxlo repository and market trends. High priority: Focus on Beta Release deployment and API persistence validation. Market indicates strong need for autonomous agents.",
            "goals": [
                {"title": "Truxlo v1.0 Launch", "progress": 85},
                {"title": "Harsha's Assistant Beta Release", "progress": 95},
                {"title": "Placements Prep", "progress": 60}
            ],
            "metrics": {
                "velocity": 92,
                "learning": "Consistent",
                "stress": "Elevated"
            },
            "insights": [
                {"content": "Truxlo user retention dropped 2% last week. Suggest investigating onboarding flow."},
                {"content": "You have ignored 'Placements Prep' for 3 days. Momentum is degrading."}
            ],
            "next_action": "Complete Harsha's Assistant Offline Validation tests."
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

if __name__ == "__main__":
    import uvicorn
    import sys
    import os
    # Ensure backend directory is in path so 'src.*' imports work when run directly
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    uvicorn.run(app, host="127.0.0.1", port=8765)
