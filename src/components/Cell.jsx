import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { X, Circle } from 'lucide-react';

const Cell = ({ value, onClick, disabled, isWinning }) => {
    return (
        <motion.button
            whileHover={!disabled && !value ? { scale: 0.95 } : {}}
            whileTap={!disabled && !value ? { scale: 0.9 } : {}}
            className={clsx(
                "glass-panel rounded-xl flex items-center justify-center text-4xl sm:text-6xl font-bold transition-all duration-300 relative overflow-hidden",
                "aspect-square w-full",
                isWinning && "bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.4)] border-white/40",
                !value && !disabled && "cursor-pointer hover:bg-white/10",
                (value || disabled) && "cursor-default"
            )}
            onClick={onClick}
            disabled={disabled || value}
        >
            {value === 'X' && (
                <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <X className="w-12 h-12 sm:w-20 sm:h-20 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" strokeWidth={2.5} />
                </motion.div>
            )}
            {value === 'O' && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <Circle className="w-10 h-10 sm:w-16 sm:h-16 text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" strokeWidth={3} />
                </motion.div>
            )}
        </motion.button>
    );
};

export default Cell;
