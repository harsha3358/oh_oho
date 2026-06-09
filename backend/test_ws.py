import asyncio
import websockets
import json

async def test():
    async with websockets.connect("ws://127.0.0.1:8765/ws/test-session") as websocket:
        # Receive the initial dashboard state
        resp1 = await websocket.recv()
        print("Initial:", resp1)
        
        # Send a chat message
        msg = {
            "type": "chat_message",
            "content": "Hello JARVIS!"
        }
        await websocket.send(json.dumps(msg))
        
        # Receive response
        resp2 = await websocket.recv()
        print("Response:", resp2)

asyncio.run(test())
