import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Bot, Users, Grid3x3, Grid2x2, Monitor } from 'lucide-react';
import { useGame } from '../context/GameContext';

const Landing = () => {
    const { createRoom } = useGame();
    const [size, setSize] = useState(3);
    const [mode, setMode] = useState('pvp');
    const [loading, setLoading] = useState(false);

    const handleStart = async (isHost = false) => {
        setLoading(true);
        // If hosting, default to PvP standard
        const roomId = await createRoom(size, isHost ? 'pvp' : mode);
        setLoading(false);
        if (roomId) {
            // Redirect to room
            const params = new URLSearchParams();
            params.set('room', roomId);
            if (isHost) params.set('role', 'spectator');
            window.location.search = params.toString();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full glass-panel p-8 rounded-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
                    TIC TAC TOE
                </h1>
                <p className="text-gray-400 mb-8">Multiplayer & Real-time</p>

                {/* Mode Selection */}
                <div className="space-y-6">
                    <div>
                        <label className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-3 block">Game Mode</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setMode('pvp')}
                                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${mode === 'pvp' ? 'bg-purple-600 shadow-lg shadow-purple-900/50' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <Users size={24} />
                                <span className="font-bold">PvP Online</span>
                            </button>
                            <button
                                onClick={() => setMode('pvc')}
                                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${mode === 'pvc' ? 'bg-purple-600 shadow-lg shadow-purple-900/50' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <Bot size={24} />
                                <span className="font-bold">Vs AI</span>
                            </button>
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div>
                        <label className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-3 block">Board Size</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSize(3)}
                                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${size === 3 ? 'bg-cyan-600 shadow-lg shadow-cyan-900/50' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <Grid3x3 size={24} />
                                <span className="font-bold">3 x 3</span>
                            </button>
                            <button
                                onClick={() => setSize(4)}
                                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${size === 4 ? 'bg-cyan-600 shadow-lg shadow-cyan-900/50' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <Grid2x2 size={24} />
                                <span className="font-bold">4 x 4</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStart(false)}
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2"
                        >
                            {loading ? "Creating..." : (
                                <>
                                    START GAME <Play size={20} fill="currentColor" />
                                </>
                            )}
                        </motion.button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-600"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Or</span>
                            <div className="flex-grow border-t border-gray-600"></div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStart(true)}
                            disabled={loading}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-md flex items-center justify-center gap-2 transition-colors"
                        >
                            <Monitor size={20} /> HOST GAME (Big Screen)
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Landing;
