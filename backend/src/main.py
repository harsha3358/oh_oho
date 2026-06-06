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

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str = None):
    # In production: Verify token
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Simple echo for Phase 1A testing
            if message.get("type") == "chat_message":
                response = {
                    "type": "token",
                    "text": f"JARVIS received: {message.get('content')}"
                }
                await manager.send_personal_message(json.dumps(response), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/v1/system/health")
async def health_check():
    return {"success": True, "data": {"status": "online"}, "error": None}
