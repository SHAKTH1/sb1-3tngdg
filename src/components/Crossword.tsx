import React, { useState, useEffect } from 'react';
import { HelpCircle, Award, RefreshCcw, Lightbulb, Heart, Send, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { wordSets } from '../data/wordSets';
import { Cell, LeaderboardEntry } from '../types';
import Confetti from 'react-confetti';

function Crossword() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{x: number, y: number} | null>(null);
  const [score, setScore] = useState(0);
  const [currentClue, setCurrentClue] = useState('');
  const [hintsRemaining, setHintsRemaining] = useState(5);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentWordSet, setCurrentWordSet] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [foundWords, setFoundWords] = useState<Set<number>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    initializeGrid();
    setGameStartTime(new Date());
  }, [currentWordSet]);

  const initializeGrid = () => {
    const newGrid: Cell[][] = Array(12).fill(null).map(() => 
      Array(12).fill(null).map(() => ({
        letter: '',
        userInput: '',
        x: 0,
        y: 0,
        isActive: false,
        wordIndex: -1,
        isRevealed: false
      }))
    );

    wordSets[currentWordSet].words.forEach((word, wordIndex) => {
      const letters = word.word.split('');
      letters.forEach((letter, i) => {
        const x = word.direction === 'across' ? word.x + i : word.x;
        const y = word.direction === 'down' ? word.y + i : word.y;
        newGrid[y][x] = {
          letter: letter.toUpperCase(),
          userInput: '',
          x,
          y,
          isActive: false,
          wordIndex,
          isRevealed: false
        };
      });
    });

    setGrid(newGrid);
    setHintsRemaining(5);
    setScore(0);
    setSelectedCell(null);
    setCurrentClue('');
    setIsGameComplete(false);
    setShowSubmitModal(false);
    setFoundWords(new Set());
    setShowCelebration(false);
  };

  const checkWord = (wordIndex: number) => {
    const word = wordSets[currentWordSet].words[wordIndex];
    let isComplete = true;
    
    for (let i = 0; i < word.word.length; i++) {
      const x = word.direction === 'across' ? word.x + i : word.x;
      const y = word.direction === 'down' ? word.y + i : word.y;
      
      if (grid[y][x].userInput !== word.word[i].toUpperCase()) {
        isComplete = false;
        break;
      }
    }

    if (isComplete && !foundWords.has(wordIndex)) {
      const newFoundWords = new Set(foundWords);
      newFoundWords.add(wordIndex);
      setFoundWords(newFoundWords);
      
      if (newFoundWords.size === wordSets[currentWordSet].words.length) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }
  };

  const resetGame = () => {
    setIsResetting(true);
    setTimeout(() => {
      setCurrentWordSet((prev) => (prev + 1) % wordSets.length);
      setIsResetting(false);
    }, 500);
  };

  const handleCellClick = (x: number, y: number) => {
    if (!grid[y][x].letter) return;

    const word = wordSets[currentWordSet].words.find(w => 
      (w.direction === 'across' && w.y === y && x >= w.x && x < w.x + w.word.length) ||
      (w.direction === 'down' && w.x === x && y >= w.y && y < w.y + w.word.length)
    );

    if (word) {
      setCurrentClue(word.clue);
      setSelectedCell({x, y});
    }
  };

  const handleKeyPress = (x: number, y: number, key: string) => {
    if (!grid[y][x].letter || isGameComplete) return;
    
    const newGrid = [...grid];
    newGrid[y][x].userInput = key.toUpperCase();
    setGrid(newGrid);

    // Check if any words are completed
    const cell = newGrid[y][x];
    if (cell.wordIndex !== -1) {
      checkWord(cell.wordIndex);
    }

    // Move to next cell if available
    const nextCell = findNextCell(x, y);
    if (nextCell) {
      setSelectedCell(nextCell);
    }
  };

  const findNextCell = (x: number, y: number) => {
    // Try right first
    if (x + 1 < grid[0].length && grid[y][x + 1].letter) {
      return { x: x + 1, y };
    }
    // Try down
    if (y + 1 < grid.length && grid[y + 1][x].letter) {
      return { x, y: y + 1 };
    }
    return null;
  };

  const useHint = () => {
    if (hintsRemaining > 0 && selectedCell) {
      const {x, y} = selectedCell;
      const newGrid = [...grid];
      newGrid[y][x].userInput = newGrid[y][x].letter;
      newGrid[y][x].isRevealed = true;
      setGrid(newGrid);
      setHintsRemaining(prev => prev - 1);

      // Check if any words are completed after using hint
      const cell = newGrid[y][x];
      if (cell.wordIndex !== -1) {
        checkWord(cell.wordIndex);
      }
    }
  };

  const calculateScore = () => {
    let correct = 0;
    let total = 0;

    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.letter) {
          total++;
          if (cell.userInput === cell.letter) {
            correct++;
          }
        }
      });
    });

    return Math.floor((correct / total) * 100);
  };

  const handleSubmit = () => {
    if (!playerName.trim()) {
      alert('Please enter your name before submitting!');
      return;
    }

    const finalScore = calculateScore();
    const endTime = new Date();
    const timeTaken = gameStartTime ? Math.floor((endTime.getTime() - gameStartTime.getTime()) / 1000) : 0;

    const newEntry: LeaderboardEntry = {
      name: playerName,
      score: finalScore,
      time: timeTaken,
      date: new Date().toLocaleDateString()
    };

    setLeaderboard(prev => [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10));
    setScore(finalScore);
    setIsGameComplete(true);
    setShowSubmitModal(false);

    if (finalScore === 100) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white p-4 md:p-8">
      {showCelebration && <Confetti />}
      
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-2xl p-4 md:p-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <motion.div 
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              className="text-center md:text-left mb-4 md:mb-0"
            >
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Tech Crossword Challenge</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600 mt-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Level {currentWordSet + 1}</span>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <RefreshCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                New Puzzle
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                disabled={isGameComplete}
              >
                <Send className="w-4 h-4" />
                Submit
              </motion.button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <motion.div 
              className={`flex-1 overflow-x-auto transition-opacity duration-500 ${isResetting ? 'opacity-0' : 'opacity-100'}`}
              layout
            >
              <div className="grid gap-1 w-fit mx-auto">
                {grid.map((row, y) => (
                  <div key={y} className="flex gap-1">
                    {row.map((cell, x) => (
                      <motion.div
                        key={`${x}-${y}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: (x + y) * 0.02 }}
                        className={`
                          w-8 md:w-10 h-8 md:h-10 flex items-center justify-center text-sm md:text-base
                          ${cell.letter ? 'border-2 border-gray-300 bg-white hover:border-indigo-400' : 'bg-transparent'}
                          ${selectedCell?.x === x && selectedCell?.y === y ? 'bg-indigo-50 border-indigo-400' : ''}
                          ${cell.isRevealed ? 'bg-green-50' : ''}
                          ${foundWords.has(cell.wordIndex) ? 'bg-green-100' : ''}
                          ${cell.letter ? 'cursor-pointer' : ''} rounded-md transition-all duration-200
                        `}
                        onClick={() => handleCellClick(x, y)}
                      >
                        {cell.letter && (
                          <input
                            type="text"
                            maxLength={1}
                            value={cell.userInput}
                            onChange={(e) => handleKeyPress(x, y, e.target.value)}
                            className="w-full h-full text-center bg-transparent focus:outline-none"
                            disabled={isGameComplete}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="w-full md:w-80 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-50 p-4 md:p-6 rounded-lg"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">Current Clue</h3>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="text-gray-400 w-4 h-4" />
                    <span className="text-sm text-gray-600">{hintsRemaining} hints left</span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 min-h-[3em]">
                  {currentClue || "Select a cell to see the clue"}
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={useHint}
                  disabled={hintsRemaining === 0 || !selectedCell || isGameComplete}
                  className={`
                    w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2
                    ${hintsRemaining > 0 && selectedCell && !isGameComplete
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
                    transition-all duration-200
                  `}
                >
                  <Lightbulb className="w-4 h-4" />
                  Use Hint
                </motion.button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-lg shadow-md"
              >
                <h3 className="font-semibold text-gray-800 mb-3">Words Found ({foundWords.size}/{wordSets[currentWordSet].words.length})</h3>
                <div className="space-y-2">
                  {wordSets[currentWordSet].words.map((word, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-2 rounded ${
                        foundWords.has(index) ? 'bg-green-100' : 'bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-700">{word.word}</span>
                      {foundWords.has(index) ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-lg shadow-md"
              >
                <h3 className="font-semibold text-gray-800 mb-3">Leaderboard</h3>
                {leaderboard.length === 0 ? (
                  <p className="text-gray-500 text-center">No submissions yet</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex justify-between items-center bg-gray-50 p-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-gray-700">{entry.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-600">{entry.score}%</span>
                          <span className="text-gray-500 text-sm">{Math.floor(entry.time / 60)}m {entry.time % 60}s</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {showSubmitModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-lg p-6 max-w-sm w-full"
                >
                  <h3 className="text-xl font-bold mb-4">Submit Your Score</h3>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full p-2 border rounded mb-4 focus:border-indigo-400 focus:ring focus:ring-indigo-200"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowSubmitModal(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Submit
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center text-sm text-gray-500 mt-8">
            <p>Complete the crossword puzzle to unlock the next level!</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Crossword;