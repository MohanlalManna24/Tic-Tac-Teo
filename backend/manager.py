from typing import Dict, List, Optional
from fastapi import WebSocket
import json
import random
import string
import asyncio

class GameManager:
    def __init__(self):
        # games[room_id] = {
        #     "board": ["", "", ...], # 9 or 16
        #     "players": { player_id: {"ws": WebSocket, "symbol": "X" | "O"} },
        #     "spectators": { spec_id: WebSocket },
        #     "current_turn": "X",
        #     "size": 3,
        #     "status": "waiting" | "playing" | "finished",
        #     "winner": None,
        #     "mode": "pvp" | "pvc",
        #     "winning_line": []
        # }
        self.games: Dict[str, dict] = {}

    def generate_room_id(self) -> str:
        while True:
            room_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if room_id not in self.games:
                return room_id

    async def create_room(self, size: int = 3, mode: str = 'pvp') -> str:
        room_id = self.generate_room_id()
        self.games[room_id] = {
            "board": [""] * (size * size),
            "players": {},
            "spectators": {},
            "current_turn": "X",
            "size": size,
            "status": "waiting",
            "winner": None,
            "mode": mode,
            "winning_line": []
        }
        return room_id

    async def connect(self, websocket: WebSocket, room_id: str, player_id: str, role: str = "player", prefer_symbol: Optional[str] = None):
        await websocket.accept()
        
        if room_id not in self.games:
            await websocket.close(code=4004, reason="Room not found")
            return False

        game = self.games[room_id]
        
        # Determine Role
        if role == "spectator":
            game["spectators"][player_id] = websocket
            await self.broadcast_game_state(room_id)
            return True
        
        # Player Logic
        existing_players = game["players"]
        if len(existing_players) >= 2:
            await websocket.close(code=4003, reason="Room full")
            return False

        # Determine symbol
        used_symbols = [p["symbol"] for p in existing_players.values()]
        symbol = "X" # Default
        
        if prefer_symbol and prefer_symbol.upper() in ["X", "O"] and prefer_symbol.upper() not in used_symbols:
            symbol = prefer_symbol.upper()
        else:
            # Fallback auto-assign
            symbol = "X" if "X" not in used_symbols else "O"
        
        game["players"][player_id] = {"ws": websocket, "symbol": symbol}
        
        # Check if game can start
        if game["mode"] == "pvc" or len(game["players"]) == 2:
            game["status"] = "playing"

        await self.broadcast_game_state(room_id)
        return True

    async def disconnect(self, room_id: str, player_id: str):
        if room_id in self.games:
            game = self.games[room_id]
            
            # Check if player
            player = game["players"].pop(player_id, None)
            if player:
                game["status"] = "player_disconnected"
                await self.broadcast_game_state(room_id)
                if not game["players"] and not game["spectators"]:
                    del self.games[room_id]
                return

            # Check if spectator
            if player_id in game["spectators"]:
                del game["spectators"][player_id]
                if not game["players"] and not game["spectators"]:
                    del self.games[room_id]

    async def handle_move(self, room_id: str, player_id: str, index: int):
        game = self.games.get(room_id)
        if not game or game["status"] != "playing":
            return

        player = game["players"].get(player_id)
        if not player:
            return

        if game["current_turn"] != player["symbol"]:
            return

        if game["board"][index] != "":
            return

        # Execute Move
        game["board"][index] = player["symbol"]
        
        # Check Win
        winner, line = self.check_winner(game["board"], game["size"])
        if winner:
            game["winner"] = winner
            game["winning_line"] = line
            game["status"] = "finished"
        elif "" not in game["board"]:
            game["status"] = "finished"
            game["winner"] = "draw"
        else:
            # Switch turn
            game["current_turn"] = "O" if game["current_turn"] == "X" else "X"
            
        # Broadcast the human move FIRST
        await self.broadcast_game_state(room_id)

        # If PvC mode and next is O (AI), trigger AI
        if game["mode"] == "pvc" and game["current_turn"] == "O" and game["status"] == "playing":
             asyncio.create_task(self.make_ai_move(room_id))

    def check_winner(self, board, size):
        lines = []
        for i in range(size):
            lines.append(list(range(i * size, (i + 1) * size)))
        for i in range(size):
            lines.append(list(range(i, size * size, size)))
        lines.append(list(range(0, size * size, size + 1)))
        lines.append(list(range(size - 1, size * size - 1, size - 1)))

        for line in lines:
            symbols = [board[i] for i in line]
            if symbols[0] != "" and all(s == symbols[0] for s in symbols):
                return symbols[0], line
        return None, []

    async def make_ai_move(self, room_id):
        await asyncio.sleep(0.5) # Artificial thinking delay
        
        game = self.games.get(room_id)
        if not game or game["status"] != "playing" or game["current_turn"] != "O":
            return
        
        empty_indices = [i for i, x in enumerate(game["board"]) if x == ""]
        if empty_indices:
            move = random.choice(empty_indices)
            game["board"][move] = "O"
            
            # Check win
            winner, line = self.check_winner(game["board"], game["size"])
            if winner:
                game["winner"] = winner
                game["winning_line"] = line
                game["status"] = "finished"
            elif "" not in game["board"]:
                game["status"] = "finished"
                game["winner"] = "draw"
            else:
                game["current_turn"] = "X"
            
            await self.broadcast_game_state(room_id)

    async def broadcast_game_state(self, room_id: str):
        game = self.games.get(room_id)
        if not game:
            return
        
        state = {
            "type": "game_state",
            "room_id": room_id,
            "board": game["board"],
            "current_turn": game["current_turn"],
            "status": game["status"],
            "winner": game["winner"],
            "winning_line": game["winning_line"],
            "mode": game["mode"],
            "players": [
                {"id": pid, "symbol": p["symbol"]} 
                for pid, p in game["players"].items()
            ],
            "size": game["size"]
        }
        
        # Broadcast to players and spectators concurrently
        tasks = []
        for player in game["players"].values():
            tasks.append(player["ws"].send_json(state))
        
        for ws in game["spectators"].values():
            tasks.append(ws.send_json(state))
            
        # Run all send operations concurrently, ignoring errors
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def reset_game(self, room_id: str):
         game = self.games.get(room_id)
         if game:
             game["board"] = [""] * (game["size"] * game["size"])
             game["winner"] = None
             game["winning_line"] = []
             game["status"] = "playing" if (game["mode"] == "pvc" or len(game["players"]) == 2) else "waiting"
             game["current_turn"] = "X"
             await self.broadcast_game_state(room_id)

manager = GameManager()
