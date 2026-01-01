import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { User, Users, Eye, EyeOff, RotateCcw, Shuffle } from 'lucide-react'; // Make sure to install lucide-react if icons fail, otherwise remove icons

export default function ImposterGame() {
  // --- STATE ---
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [phase, setPhase] = useState('setup'); 
  const [category, setCategory] = useState('');
  const [playerCount, setPlayerCount] = useState(3);
  
  const [secretWord, setSecretWord] = useState('');
  const [roles, setRoles] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showRole, setShowRole] = useState(false);

  // --- EFFECT: Load CSV ---
  useEffect(() => {
    fetch('/words.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const groupedData = {};
            results.data.forEach(row => {
              const cat = row.category.trim();
              const word = row.word.trim();
              if (!groupedData[cat]) groupedData[cat] = [];
              groupedData[cat].push(word);
            });
            setGameData(groupedData);
            if (Object.keys(groupedData).length > 0) {
              setCategory(Object.keys(groupedData)[0]);
            }
            setLoading(false);
          }
        });
      });
  }, []);

  // --- LOGIC ---
  const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const startGame = () => {
    if (!gameData) return;
    const words = gameData[category];
    const word = words[Math.floor(Math.random() * words.length)];
    setSecretWord(word);

    let newRoles = Array(playerCount - 1).fill(word);
    newRoles.push('IMPOSTER');
    newRoles = shuffleArray(newRoles);
    
    setRoles(newRoles);
    setCurrentPlayerIndex(0);
    setShowRole(false);
    setPhase('pass');
  };

  const nextPlayer = () => {
    setShowRole(false);
    if (currentPlayerIndex + 1 < playerCount) {
      setCurrentPlayerIndex(prev => prev + 1);
    } else {
      setPhase('playing');
    }
  };

  const resetGame = () => {
    setPhase('setup');
    setSecretWord('');
    setRoles([]);
  };

  // --- UI COMPONENTS ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-medium text-blue-400 tracking-widest uppercase">Initializing System...</p>
        </div>
      </div>
    );
  }

  // WRAPPER: Used for all screens to center content
  const Container = ({ children }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Glass Card */}
      <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl">
        {children}
      </div>
    </div>
  );

  // 1. SETUP SCREEN
  if (phase === 'setup') {
    return (
      <Container>
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter">
            IMPOSTER
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium tracking-widest uppercase">Identify the liar</p>
        </div>
        
        {/* Category Selector */}
        <div className="mb-8">
          <label className="text-xs font-bold text-slate-500 uppercase mb-3 block tracking-wider">Select Category</label>
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {Object.keys(gameData).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`p-3 rounded-xl text-sm font-bold transition-all duration-200 border ${
                  category === cat 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Player Count */}
        <div className="mb-8">
          <label className="text-xs font-bold text-slate-500 uppercase mb-3 block tracking-wider">Player Count</label>
          <div className="flex items-center justify-between bg-slate-950/50 rounded-2xl p-2 border border-slate-800">
            <button 
              onClick={() => setPlayerCount(Math.max(3, playerCount - 1))}
              className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-xl hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <span className="text-2xl font-bold mb-1">-</span>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-white">{playerCount}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Players</span>
            </div>
            <button 
              onClick={() => setPlayerCount(Math.min(12, playerCount + 1))}
              className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-xl hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <span className="text-2xl font-bold mb-1">+</span>
            </button>
          </div>
        </div>

        <button 
          onClick={startGame}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl text-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
        >
          Start Mission
        </button>
      </Container>
    );
  }

  // 2. PASS & PLAY SCREEN
  if (phase === 'pass') {
    return (
      <Container>
        <div className="flex justify-between items-center mb-8">
            <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700">
                {currentPlayerIndex + 1} / {playerCount}
            </span>
            <h2 className="text-lg font-bold text-slate-200">Player {currentPlayerIndex + 1}</h2>
            <div className="w-8"></div> {/* Spacer for alignment */}
        </div>

        {!showRole ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-8 border-4 border-slate-700 shadow-xl">
               <span className="text-5xl">🕵️</span>
            </div>
            <p className="mb-8 text-center text-slate-300">
              Pass the device to <br/> <span className="text-white font-bold text-xl">Player {currentPlayerIndex + 1}</span>
            </p>
            <button 
              onClick={() => setShowRole(true)}
              className="w-full py-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-2xl font-bold transition-all"
            >
              Tap to Reveal Role
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in duration-300">
             {/* Role Card */}
             <div className={`
                p-8 rounded-2xl mb-8 border text-center relative overflow-hidden group
                ${roles[currentPlayerIndex] === 'IMPOSTER' 
                  ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                  : 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                }
             `}>
                <p className={`text-xs uppercase tracking-[0.3em] font-bold mb-4 ${roles[currentPlayerIndex] === 'IMPOSTER' ? 'text-red-400' : 'text-emerald-400'}`}>
                    Secret Identity
                </p>
                
                <h3 className="text-4xl font-black break-words mb-2">
                  {roles[currentPlayerIndex] === 'IMPOSTER' ? (
                    <span className="text-red-500 drop-shadow-lg">IMPOSTER</span>
                  ) : (
                    <span className="text-emerald-400 drop-shadow-lg">{roles[currentPlayerIndex]}</span>
                  )}
                </h3>

                {roles[currentPlayerIndex] === 'IMPOSTER' && (
                  <p className="text-red-300/80 text-sm mt-4 font-medium">Blend in. Don't get caught.</p>
                )}
            </div>

            <button 
              onClick={nextPlayer}
              className="w-full py-4 bg-slate-100 hover:bg-white text-slate-900 rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98]"
            >
              {currentPlayerIndex + 1 === playerCount ? "Start The Game" : "Hide & Pass Device"}
            </button>
          </div>
        )}
      </Container>
    );
  }

  // 3. PLAYING SCREEN
  if (phase === 'playing' || phase === 'reveal') {
    return (
      <Container>
        <div className="text-center">
            {phase === 'reveal' ? (
                 <div className="mb-8 animate-in zoom-in duration-500">
                     <div className="inline-block px-4 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 border border-slate-700">
                        Mission Report
                     </div>
                     <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                        <p className="text-sm text-slate-400 mb-2 font-medium">The Category</p>
                        <p className="text-xl font-bold text-white mb-6">{category}</p>
                        <div className="h-px bg-slate-700 w-full mb-6"></div>
                        <p className="text-sm text-slate-400 mb-2 font-medium">The Secret Word</p>
                        <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            {secretWord}
                        </p>
                     </div>
                 </div>
            ) : (
                <div className="mb-12">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-slate-700 shadow-xl animate-pulse">
                         <span className="text-4xl">🤔</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3">Who is the Imposter?</h1>
                    <p className="text-slate-400 leading-relaxed">
                        Discuss, ask subtle questions, and vote. <br/>
                        <span className="text-blue-400 font-bold">Civilians</span> know the word.<br/>
                        <span className="text-red-500 font-bold">The Imposter</span> is lying.
                    </p>
                </div>
            )}

            <div className="space-y-3">
            {phase === 'playing' && (
                <button 
                onClick={() => setPhase('reveal')}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-900/20 transition-all"
                >
                Reveal The Word
                </button>
            )}
            
            <button 
                onClick={resetGame}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${
                    phase === 'reveal' 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
            >
                {phase === 'reveal' ? "Play Again" : "Abort Game"}
            </button>
            </div>
        </div>
      </Container>
    );
  }

  return null;
}