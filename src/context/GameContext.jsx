import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const [gameState, setGameState] = useState(null);
    const [playerId] = useState(uuidv4());
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    const connectToGame = (roomId, role = 'player', prefer = null) => {
        if (socketRef.current) {
            socketRef.current.close();
        }

        // Use window.location.hostname to connect to the same host (e.g. valid for mobile on LAN)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = '8000'; // Make sure this matches backend
        let wsUrl = `${protocol}//${host}:${port}/ws/${roomId}/${playerId}?role=${role}`;
        if (prefer) {
            wsUrl += `&prefer=${prefer}`;
        }

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("Connected to game room:", roomId);
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'game_state') {
                setGameState(data);
            }
        };

        ws.onclose = () => {
            console.log("Disconnected");
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };
    };

    const disconnect = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
            setIsConnected(false);
            setGameState(null);
        }
    };

    const makeMove = (index) => {
        if (socketRef.current && isConnected) {
            socketRef.current.send(JSON.stringify({ type: 'move', index }));
        }
    };

    const resetGame = () => {
        if (socketRef.current && isConnected) {
            socketRef.current.send(JSON.stringify({ type: 'reset' }));
        }
    };

    const createRoom = async (size, mode) => {
        try {
            const host = window.location.hostname;
            const port = '8000';
            const response = await fetch(`http://${host}:${port}/create-room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ size, mode })
            });
            const data = await response.json();
            return data.room_id;
        } catch (e) {
            console.error("Failed to create room", e);
            return null;
        }
    };

    return (
        <GameContext.Provider value={{
            gameState,
            isConnected,
            playerId,
            connectToGame,
            disconnect,
            makeMove,
            resetGame,
            createRoom
        }}>
            {children}
        </GameContext.Provider>
    );
};
