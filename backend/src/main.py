from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
from src.database import engine, Base
from src.api import sessions, memories, settings

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

from src.services.companion_agent import companion_agent
from src.services.founder_mode import founder_mode
from src.services.voice_system import voice_system

# Attempt to init voice on startup
voice_system.initialize()

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str = None):
    # In production: Verify token
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "chat_message":
                user_content = message.get('content')
                
                # Check for Founder Mode triggers
                if "/founder" in user_content.lower():
                    founder_mode.activate()
                    response_text = "Founder Mode Activated. Let's get to work."
                elif "/exit founder" in user_content.lower():
                    founder_mode.deactivate()
                    response_text = "Founder Mode Deactivated."
                else:
                    # Pass through Companion Agent
                    response_text = companion_agent.generate_response(user_content, session_id)
                
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
