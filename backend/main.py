from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .manager import manager
import uuid
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreateRoomRequest(BaseModel):
    size: int = 3
    mode: str = "pvp" # pvp or pvc

@app.post("/create-room")
async def create_room(request: CreateRoomRequest):
    room_id = await manager.create_room(request.size, request.mode)
    return {"room_id": room_id}

@app.websocket("/ws/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str, role: str = "player", prefer: str = None):
    try:
        is_connected = await manager.connect(websocket, room_id, player_id, role, prefer)
        if not is_connected:
            return
        
        while True:
            data = await websocket.receive_json()
            # data structure: { type: "move" | "reset", index: int }
            if data.get("type") == "move":
                await manager.handle_move(room_id, player_id, data.get("index"))
            elif data.get("type") == "reset":
                await manager.reset_game(room_id)
    except WebSocketDisconnect:
        await manager.disconnect(room_id, player_id)
    except Exception as e:
        print(f"WS Error: {e}")
        await manager.disconnect(room_id, player_id)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Tic Tac Toe Server Running"}
