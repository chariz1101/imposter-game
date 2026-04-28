import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

export default function ImposterGame() {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState('setup');
  const [category, setCategory] = useState('');
  const [playerCount, setPlayerCount] = useState(3);
  const [imposterCount, setImposterCount] = useState(1);

  const [secretWord, setSecretWord] = useState('');
  const [usedCategory, setUsedCategory] = useState('');
  const [roles, setRoles] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [showRole, setShowRole] = useState(false);

  const RANDOM_KEY = '__RANDOM__';
  const maxImposters = Math.max(1, Math.floor(playerCount / 3));

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
            setCategory(RANDOM_KEY);
            setLoading(false);
          }
        });
      });
  }, []);

  useEffect(() => {
    const max = Math.max(1, Math.floor(playerCount / 3));
    if (imposterCount > max) setImposterCount(max);
  }, [playerCount]);

  // Crypto-seeded Fisher-Yates — truly uniform, no clustering
  const secureShuffleArray = (array) => {
    const arr = [...array];
    const randomValues = new Uint32Array(arr.length);
    crypto.getRandomValues(randomValues);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randomValues[i] % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Build roles so imposters start maximally spread, then shuffle
  const buildRoles = (total, numImposters, word) => {
    // Place imposters at evenly spaced positions first
    const arr = Array(total).fill(word);
    const spacing = Math.floor(total / numImposters);
    for (let i = 0; i < numImposters; i++) {
      arr[i * spacing] = 'IMPOSTER';
    }
    // Then do multiple shuffle passes for full randomisation
    let shuffled = secureShuffleArray(arr);
    shuffled = secureShuffleArray(shuffled);
    shuffled = secureShuffleArray(shuffled);
    return shuffled;
  };

  const startGame = () => {
    if (!gameData) return;
    const cats = Object.keys(gameData);
    const resolvedCategory = category === RANDOM_KEY
      ? cats[Math.floor(Math.random() * cats.length)]
      : category;
    const words = gameData[resolvedCategory];
    const word = words[Math.floor(Math.random() * words.length)];
    setSecretWord(word);
    setUsedCategory(resolvedCategory);
    const newRoles = buildRoles(playerCount, imposterCount, word);
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
    setUsedCategory('');
    setRoles([]);
  };

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

  const Container = ({ children }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl">
        {children}
      </div>
    </div>
  );

  const CounterRow = ({ sublabel, value, onDecrement, onIncrement }) => (
    <div className="flex items-center justify-between bg-slate-950/50 rounded-2xl p-2 border border-slate-800">
      <button onClick={onDecrement} className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-xl hover:bg-slate-700 text-slate-200 transition-colors">
        <span className="text-2xl font-bold mb-1">-</span>
      </button>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-black text-white">{value}</span>
        <span className="text-[10px] text-slate-500 uppercase font-bold">{sublabel}</span>
      </div>
      <button onClick={onIncrement} className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-xl hover:bg-slate-700 text-slate-200 transition-colors">
        <span className="text-2xl font-bold mb-1">+</span>
      </button>
    </div>
  );

  // 1. SETUP
  if (phase === 'setup') {
    const cats = Object.keys(gameData);
    return (
      <Container>
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tighter">IMPOSTER</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium tracking-widest uppercase">Identify the liar</p>
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold text-slate-500 uppercase mb-3 block tracking-wider">Select Category</label>
          <div className="grid grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
            <button
              onClick={() => setCategory(RANDOM_KEY)}
              className={`col-span-2 p-3 rounded-xl text-sm font-bold transition-all duration-200 border flex items-center justify-center gap-2 ${
                category === RANDOM_KEY
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              🎲 Random Category
            </button>
            {cats.map((cat) => (
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

        <div className="mb-4">
          <label className="text-xs font-bold text-slate-500 uppercase mb-3 block tracking-wider">Player Count</label>
          <CounterRow
            sublabel="Players"
            value={playerCount}
            onDecrement={() => setPlayerCount(Math.max(3, playerCount - 1))}
            onIncrement={() => setPlayerCount(Math.min(30, playerCount + 1))}
          />
        </div>

        <div className="mb-8">
          <label className="text-xs font-bold text-slate-500 uppercase mb-3 block tracking-wider">
            Imposters <span className="ml-1 text-slate-600 normal-case font-normal">(max {maxImposters})</span>
          </label>
          <CounterRow
            sublabel="Imposters"
            value={imposterCount}
            onDecrement={() => setImposterCount(Math.max(1, imposterCount - 1))}
            onIncrement={() => setImposterCount(Math.min(maxImposters, imposterCount + 1))}
          />
          <p className="text-[11px] text-slate-600 mt-2 text-center">
            {playerCount - imposterCount} civilian{playerCount - imposterCount !== 1 ? 's' : ''} · {imposterCount} imposter{imposterCount !== 1 ? 's' : ''}
          </p>
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

  // 2. PASS & PLAY
  if (phase === 'pass') {
    return (
      <Container>
        <div className="flex justify-between items-center mb-8">
          <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700">
            {currentPlayerIndex + 1} / {playerCount}
          </span>
          <h2 className="text-lg font-bold text-slate-200">Player {currentPlayerIndex + 1}</h2>
          <div className="w-8"></div>
        </div>

        {!showRole ? (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-8 border-4 border-slate-700 shadow-xl">
              <span className="text-5xl">🕵️</span>
            </div>
            <p className="mb-8 text-center text-slate-300">
              Pass the device to <br />
              <span className="text-white font-bold text-xl">Player {currentPlayerIndex + 1}</span>
            </p>
            <button
              onClick={() => setShowRole(true)}
              className="w-full py-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-2xl font-bold transition-all"
            >
              Tap to Reveal Role
            </button>
          </div>
        ) : (
          <div>
            <div className={`p-8 rounded-2xl mb-8 border text-center ${
              roles[currentPlayerIndex] === 'IMPOSTER'
                ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                : 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
            }`}>
              <p className={`text-xs uppercase tracking-[0.3em] font-bold mb-4 ${roles[currentPlayerIndex] === 'IMPOSTER' ? 'text-red-400' : 'text-emerald-400'}`}>
                Secret Identity
              </p>
              <h3 className="text-4xl font-black break-words mb-2">
                {roles[currentPlayerIndex] === 'IMPOSTER'
                  ? <span className="text-red-500">IMPOSTER</span>
                  : <span className="text-emerald-400">{roles[currentPlayerIndex]}</span>
                }
              </h3>
              {roles[currentPlayerIndex] === 'IMPOSTER' && (
                <p className="text-red-300/80 text-sm mt-4 font-medium">Blend in. Don't get caught.</p>
              )}
            </div>
            <button
              onClick={nextPlayer}
              className="w-full py-4 bg-slate-100 hover:bg-white text-slate-900 rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98]"
            >
              {currentPlayerIndex + 1 === playerCount ? 'Start The Game' : 'Hide & Pass Device'}
            </button>
          </div>
        )}
      </Container>
    );
  }

  // 3. PLAYING / REVEAL
  if (phase === 'playing' || phase === 'reveal') {
    return (
      <Container>
        <div className="text-center">
          {phase === 'reveal' ? (
            <div className="mb-8">
              <div className="inline-block px-4 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 border border-slate-700">
                Mission Report
              </div>
              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                <p className="text-sm text-slate-400 mb-2 font-medium">The Category</p>
                <p className="text-xl font-bold text-white mb-6">{usedCategory}</p>
                <div className="h-px bg-slate-700 w-full mb-6"></div>
                <p className="text-sm text-slate-400 mb-2 font-medium">The Secret Word</p>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{secretWord}</p>
                <div className="h-px bg-slate-700 w-full mt-6 mb-4"></div>
                <p className="text-sm text-slate-400 mb-3 font-medium">Imposters were</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {roles.map((role, i) =>
                    role === 'IMPOSTER' ? (
                      <span key={i} className="px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 text-sm font-bold">
                        Player {i + 1}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-12">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-slate-700 shadow-xl animate-pulse">
                <span className="text-4xl">🤔</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Who {imposterCount !== 1 ? 'are' : 'is'} the Imposter{imposterCount !== 1 ? 's' : ''}?
              </h1>
              <p className="text-slate-400 leading-relaxed">
                Discuss, ask subtle questions, and vote.<br />
                <span className="text-blue-400 font-bold">Civilians</span> know the word.<br />
                <span className="text-red-500 font-bold">{imposterCount} Imposter{imposterCount !== 1 ? 's' : ''}</span> {imposterCount !== 1 ? 'are' : 'is'} lying.
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
              {phase === 'reveal' ? 'Play Again' : 'Abort Game'}
            </button>
          </div>
        </div>
      </Container>
    );
  }

  return null;
}