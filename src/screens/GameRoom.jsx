import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import Board from '../components/Board';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, RefreshCw, Copy, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GameRoom = ({ roomId }) => {
    const { gameState, connectToGame, playerId, makeMove, resetGame, isConnected } = useGame();
    const [showQR, setShowQR] = useState(false);

    // Check if Host/Spectator
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || 'player';
    const isHost = role === 'spectator';

    useEffect(() => {
        connectToGame(roomId, role);
    }, [roomId, role]);

    if (!gameState) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-lg font-bold">Connecting...</span>
            </div>
        );
    }

    const myPlayer = Object.values(gameState.players).find(p => p.id === playerId);
    // If spectator (not in players), myPlayer is undefined. 

    const mySymbol = myPlayer?.symbol;
    const isMyTurn = gameState.status === 'playing' && gameState.current_turn === mySymbol;

    // URL for sharing
    const baseUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    const p1Url = `${baseUrl}&prefer=X`;
    const p2Url = `${baseUrl}&prefer=O`;

    const copyLink = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex flex-col items-center min-h-screen p-4 pb-12 relative">
            {/* Header */}
            <div className="w-full max-w-lg flex justify-between items-center mb-8 mt-4 z-10">
                <button onClick={() => window.location.search = ''} className="p-2 glass-button rounded-full">
                    <Home size={20} />
                </button>
                <div className="glass-panel px-4 py-2 rounded-full text-sm font-bold bg-black/20">
                    {isHost ? 'HOSTING ROOM:' : 'ROOM:'} {roomId}
                </div>
                {!isHost && (
                    <button
                        onClick={() => setShowQR(true)}
                        className="p-2 glass-button rounded-full text-cyan-400"
                    >
                        <Share2 size={20} />
                    </button>
                )}
            </div>

            {/* Status / Turn Indicator */}
            <div className="text-center mb-6">
                {gameState.status === 'waiting' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-yellow-500/20 text-yellow-200 px-6 py-3 rounded-xl border border-yellow-500/30 backdrop-blur-md"
                    >
                        <p className="font-bold flex items-center gap-2">
                            <span className="animate-pulse">●</span> {isHost ? "Waiting for Players..." : "Waiting for opponent..."}
                        </p>
                        {!isHost && <p className="text-sm opacity-80 mt-1">Share the room link to play!</p>}
                    </motion.div>
                )}

                {gameState.status === 'playing' && (
                    <div className="flex items-center gap-4 text-xl font-bold">
                        <span className={`px-4 py-1 rounded-full ${gameState.current_turn === 'X' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'opacity-40'}`}>
                            X Turn
                        </span>
                        <span>VS</span>
                        <span className={`px-4 py-1 rounded-full ${gameState.current_turn === 'O' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40' : 'opacity-40'}`}>
                            O Turn
                        </span>
                    </div>
                )}

                {gameState.status === 'finished' && (
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text drop-shadow-sm"
                    >
                        {gameState.winner === 'draw' ? "IT'S A DRAW!" : `${gameState.winner} WINS!`}
                    </motion.div>
                )}
            </div>

            {/* Board */}
            <div className="relative z-0">
                <Board
                    board={gameState.board}
                    size={gameState.size}
                    onMove={(idx) => !isHost && makeMove(idx)}
                    isMyTurn={isMyTurn}
                    winningLine={gameState.winning_line}
                />
            </div>

            {/* Host Dual QR Display */}
            {isHost && gameState.status === 'waiting' && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-panel p-6 rounded-2xl flex flex-col items-center">
                        <h3 className="text-xl font-bold mb-4 text-cyan-400">Player 1 (X)</h3>
                        <div className="bg-white p-3 rounded-xl mb-4">
                            <QRCodeSVG value={p1Url} size={150} />
                        </div>
                        <p className="text-sm text-gray-300 mb-2">Scan to join as Player 1</p>
                    </motion.div>

                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-panel p-6 rounded-2xl flex flex-col items-center">
                        <h3 className="text-xl font-bold mb-4 text-pink-400">Player 2 (O)</h3>
                        <div className="bg-white p-3 rounded-xl mb-4">
                            <QRCodeSVG value={p2Url} size={150} />
                        </div>
                        <p className="text-sm text-gray-300 mb-2">Scan to join as Player 2</p>
                    </motion.div>
                </div>
            )}

            {/* Footer / Controls */}
            {gameState.status === 'finished' && (
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onClick={resetGame}
                    className="mt-8 px-8 py-3 bg-white text-indigo-900 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-xl"
                >
                    <RefreshCw size={20} /> Play Again
                </motion.button>
            )}

            {/* Regular Player QR Modal */}
            <AnimatePresence>
                {showQR && !isHost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowQR(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white text-black p-8 rounded-3xl max-w-sm w-full text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-bold mb-6">Scan to Join</h3>
                            <div className="bg-white p-4 rounded-xl border-2 border-gray-100 inline-block mb-6">
                                <QRCodeSVG value={baseUrl} size={200} />
                            </div>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={baseUrl}
                                    className="flex-1 bg-gray-100 p-3 rounded-lg text-sm border-none outline-none"
                                />
                                <button onClick={() => copyLink(baseUrl)} className="p-3 bg-black text-white rounded-lg hover:bg-gray-800">
                                    <Copy size={20} />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed bottom-4 left-4 text-xs text-white/30 font-mono text-left">
                {isHost ? 'Spectator Mode' : `Player ID: ${playerId.slice(0, 8)} | Symbol: ${mySymbol || '?'}`}
                <br />
                Status: {gameState.status} | Mode: {gameState.mode} | Players: {Object.keys(gameState.players).length}
            </div>
        </div>
    );
};

export default GameRoom;
