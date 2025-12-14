import React from 'react';
import Cell from './Cell';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const Board = ({ board, size, onMove, isMyTurn, winningLine }) => {
    // board is array of strings

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx(
                "grid gap-3 sm:gap-4 w-full max-w-lg mx-auto p-4",
                size === 3 ? "grid-cols-3" : "grid-cols-4"
            )}
        >
            {board.map((cellValue, index) => {
                const isWinning = winningLine?.includes(index);
                return (
                    <Cell
                        key={index}
                        value={cellValue}
                        onClick={() => onMove(index)}
                        disabled={!isMyTurn && !cellValue} // Disable empty cells if not my turn
                        isWinning={isWinning}
                    />
                );
            })}
        </motion.div>
    );
};

export default Board;
