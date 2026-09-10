import { useState, useEffect } from 'react';
import { useRoomStore } from '../../stores/roomStore';
import { usePlayerStore } from '../../stores/playerStore';
import type { GameComponentProps, GameResult } from '../../types/game';

function ImposterGame({ onGameStart, onGameEnd, multiplayerState, onMultiplayerAction }: GameComponentProps) {
  const room = useRoomStore();
  const { player } = usePlayerStore();
  const myId = player?.id || '';
  const isHost = room.players.find(p => p.id === myId)?.isHost;

  const [clueInput, setClueInput] = useState('');
  const [submitState, setSubmitState] = useState<'READY' | 'SUBMITTING' | 'SUBMITTED'>('READY');
  const [guessInput, setGuessInput] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState<number | null>(null);
  
  const gameState = multiplayerState;

  useEffect(() => {
    onGameStart();
  }, [onGameStart]);

  // Sync timer
  useEffect(() => {
    if (!gameState?.timeLimit) {
      setTimerDisplay(null);
      return;
    }
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((gameState.timeLimit - Date.now()) / 1000));
      setTimerDisplay(remaining);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameState?.timeLimit]);

  useEffect(() => {
    if (gameState?.winner) {
      const amIImposter = gameState.imposterId === myId;
      const civiliansWon = gameState.winner === 'CIVILIANS';
      const iWon = (amIImposter && !civiliansWon) || (!amIImposter && civiliansWon);

      // Compute statistics for funny awards
      const fastestClue = Object.keys(gameState.clues || {})[0]; // simplistic approximation
      const mostSuspicious = Object.entries(gameState.votes || {}).reduce((a, b) => {
        const counts = Object.values(gameState.votes).filter(v => v === b[1]).length;
        const prevCounts = Object.values(gameState.votes).filter(v => v === a).length;
        return counts > prevCounts ? b[1] as string : a;
      }, '');

      const result: GameResult = {
        gameId: 'imposter',
        mode: 'classic',
        score: iWon ? 100 : 10,
        won: iWon,
        duration: 0,
        moves: 0,
        personalBest: false,
        data: { 
          role: amIImposter ? 'Imposter' : 'Civilian', 
          winner: civiliansWon ? 'CIVILIANS' : 'IMPOSTER',
          awards: { fastestClue, mostSuspicious }
        },
        timestamp: Date.now(),
      };
      onGameEnd(result);
    }
  }, [gameState?.winner, onGameEnd, myId, gameState]);

  // Sync local submit state with server state
  useEffect(() => {
    if (gameState?.clues?.[myId]) {
      setSubmitState('SUBMITTED');
    } else if (submitState === 'SUBMITTED') {
      setSubmitState('READY'); 
    }
  }, [gameState?.clues, myId]);

  if (!gameState) return <div className="text-center p-8 text-white">Waiting for game state...</div>;

  const { phase, word, clues, votes } = gameState;
  const amIImposter = !word; 

  const submitClue = () => {
    if (!clueInput.trim() || submitState !== 'READY') return;
    setSubmitState('SUBMITTING');
    onMultiplayerAction?.({ type: 'SUBMIT_CLUE', clue: clueInput.trim() });
  };

  const startVoting = () => {
    onMultiplayerAction?.({ type: 'START_VOTING' });
  };

  const submitVote = (targetId: string) => {
    if (hasVoted) return;
    onMultiplayerAction?.({ type: 'SUBMIT_VOTE', targetId });
    setHasVoted(true);
  };

  const submitGuess = () => {
    if (!guessInput.trim()) return;
    onMultiplayerAction?.({ type: 'IMPOSTER_GUESS', guess: guessInput.trim() });
  };

  const continueReveal = () => {
    onMultiplayerAction?.({ type: 'CONTINUE_REVEAL' });
  };

  const counts: Record<string, number> = {};
  if (phase === 'reveal' && votes) {
    for (const target of Object.values(votes)) {
      const t = target as string;
      counts[t] = (counts[t] || 0) + 1;
    }
  }

  const renderPlayer = (pId: string) => {
    const p = room.players.find(x => x.id === pId);
    return <span style={{ color: p?.customization?.primaryColor || '#fff' }} className="font-bold">{p?.name || 'Unknown'}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-surface-base text-text-primary overflow-y-auto">
      <div className="flex-1 p-6 max-w-2xl w-full mx-auto">
        
        {/* Timer Bar */}
        {timerDisplay !== null && phase !== 'role_reveal' && (
          <div className="mb-6 flex items-center justify-between bg-surface-raised px-4 py-2 rounded-xl border border-border-default">
            <span className="font-bold text-sm text-text-muted uppercase tracking-widest">{phase.replace('_', ' ')} phase</span>
            <div className={`font-mono text-xl font-bold ${timerDisplay <= 10 ? 'text-red-500 animate-pulse' : 'text-hrsh-accent'}`}>
              {Math.floor(timerDisplay / 60)}:{(timerDisplay % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* --- PHASE: ROLE REVEAL --- */}
        {phase === 'role_reveal' && (
          <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in">
            <div className="text-xl font-bold text-text-muted tracking-[0.3em] uppercase">Your Role</div>
            <div className={`text-6xl font-black ${amIImposter ? 'text-red-500 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.8)]'}`}>
              {amIImposter ? 'IMPOSTER' : 'CIVILIAN'}
            </div>
            <div className="text-center text-text-muted max-w-md">
              {amIImposter 
                ? "Blend in. Don't let them know you don't have the word. Figure out what the word is from their clues."
                : "Find the imposter among you. Give clues that prove you know the word without making it too obvious."}
            </div>
          </div>
        )}

        {/* --- PHASE: CLUE --- */}
        {phase === 'clue' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-surface-raised border border-border-default rounded-2xl p-6 text-center shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-hrsh-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Secret Word</h2>
              <div className={`text-4xl font-black ${amIImposter ? 'text-red-500' : 'text-blue-400'}`}>
                {amIImposter ? '???????' : word}
              </div>
              {amIImposter && <div className="text-sm text-red-400 mt-2 font-bold animate-pulse">Blend in! Read their clues.</div>}
            </div>

            {submitState !== 'SUBMITTED' ? (
              <div className="flex flex-col gap-3 bg-surface-raised p-6 rounded-2xl border border-border-default shadow-lg">
                <label className="text-sm font-bold uppercase text-text-muted tracking-wider">Your Clue (One word)</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={clueInput}
                    onChange={(e) => setClueInput(e.target.value)}
                    disabled={submitState !== 'READY'}
                    className="flex-1 bg-surface-base border-2 border-border-default rounded-xl px-5 py-4 text-lg font-bold focus:outline-none focus:border-hrsh-accent transition-colors disabled:opacity-50"
                    placeholder="e.g. Yellow..."
                    maxLength={20}
                    onKeyDown={e => e.key === 'Enter' && submitClue()}
                  />
                  <button
                    onClick={submitClue}
                    disabled={!clueInput.trim() || submitState !== 'READY'}
                    className="px-8 py-4 bg-hrsh-accent hover:bg-hrsh-accent/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-hrsh-accent/20 disabled:opacity-50 min-w-[160px] transform active:scale-95"
                  >
                    {submitState === 'SUBMITTING' ? '...' : 'SUBMIT CLUE'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-surface-raised rounded-2xl border border-border-default shadow-lg">
                <div className="w-16 h-16 bg-status-success/20 text-status-success rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="text-status-success font-black text-xl mb-2">CLUE SUBMITTED</div>
                <div className="text-text-muted">Waiting for others... ({Object.keys(clues || {}).length}/{room.players.length})</div>
              </div>
            )}
            
            {/* Live Feed Placeholder - Show who submitted */}
            <div className="grid grid-cols-2 gap-2 mt-4">
               {room.players.map(p => {
                 const isDone = !!clues?.[p.id];
                 return (
                   <div key={p.id} className={`p-3 rounded-lg flex items-center gap-3 border ${isDone ? 'border-status-success bg-status-success/10' : 'border-border-default bg-surface-raised opacity-60'}`}>
                     <div className={`w-3 h-3 rounded-full ${isDone ? 'bg-status-success shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-surface-base border border-border-default'}`}></div>
                     {renderPlayer(p.id)}
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {/* --- PHASE: DISCUSSION --- */}
        {phase === 'discussion' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-surface-raised border border-hrsh-accent/50 shadow-[0_0_20px_rgba(244,63,94,0.1)] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-hrsh-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                Discussion
              </h3>
              <div className="space-y-3">
                {room.players.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-surface-base p-4 rounded-xl border border-border-default hover:border-text-muted transition-colors">
                    {renderPlayer(p.id)}
                    <div className="font-mono text-xl font-bold bg-surface-raised px-4 py-1 rounded-lg border border-border-default">{clues[p.id]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-text-muted flex flex-col items-center gap-2">
              <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              Use voice chat to discuss the clues!
            </div>

            {isHost && (
              <button
                onClick={startVoting}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95"
              >
                Force Start Voting Early
              </button>
            )}
          </div>
        )}

        {/* --- PHASE: VOTING --- */}
        {phase === 'voting' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="text-2xl font-black text-red-500 animate-pulse uppercase tracking-wider mb-2">Vote Out The Imposter</div>
              <div className="text-text-muted">Cast your vote. It cannot be changed.</div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {room.players.map(p => (
                <button
                  key={p.id}
                  onClick={() => submitVote(p.id)}
                  disabled={hasVoted}
                  className={`p-6 rounded-2xl border-2 font-bold flex flex-col items-center justify-center gap-3 transition-all ${
                    votes[myId] === p.id 
                      ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] scale-[1.02]' 
                      : hasVoted 
                        ? 'bg-surface-raised border-border-default opacity-50 cursor-not-allowed'
                        : 'bg-surface-raised border-border-default hover:border-red-500 hover:bg-red-500/5 active:scale-95'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: p.customization?.primaryColor || '#333', color: '#fff' }}>
                    {p.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-lg">{p.name}</span>
                  {votes[myId] === p.id && <span className="text-xs uppercase tracking-widest bg-red-500 text-white px-2 py-1 rounded">Voted</span>}
                </button>
              ))}
            </div>
            
            <div className="text-center text-text-muted bg-surface-raised py-3 rounded-full border border-border-default">
              Votes locked in: <span className="text-text-primary font-bold">{Object.keys(votes).length}</span> / {room.players.length}
            </div>
          </div>
        )}

        {/* --- PHASE: REVEAL --- */}
        {phase === 'reveal' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center text-3xl font-black uppercase tracking-widest mb-6 border-b border-border-default pb-6">Voting Results</div>
            
            <div className="bg-surface-raised border border-border-default rounded-2xl p-6 space-y-4">
               {room.players.map(p => (
                   <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-default pb-4 last:border-0 last:pb-0">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: p.customization?.primaryColor || '#333' }}>
                           {p.name[0]?.toUpperCase()}
                         </div>
                         <span className="font-semibold text-lg">{p.name}</span>
                       </div>
                       <div className="flex flex-wrap gap-1">
                           {Array.from({ length: counts[p.id] || 0 }).map((_, i) => (
                               <div key={i} className="w-6 h-6 bg-red-500 rounded-md shadow-[0_0_10px_rgba(239,68,68,0.6)] flex items-center justify-center">
                                 <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                               </div>
                           ))}
                           {!(counts[p.id] > 0) && <span className="text-text-muted text-sm italic">No votes</span>}
                       </div>
                   </div>
               ))}
            </div>

            {/* Voted out logic presentation */}
            <div className="mt-8 bg-surface-base border-2 border-border-default p-8 rounded-3xl text-center shadow-xl">
              {(() => {
                  let maxVotes = 0;
                  let votedOut = null;
                  for (const [p, c] of Object.entries(counts)) {
                      if (c > maxVotes) { maxVotes = c; votedOut = p; }
                      else if (c === maxVotes) { votedOut = null; }
                  }

                  if (votedOut === gameState.imposterId) {
                      return (
                          <div className="space-y-6">
                              <div className="text-4xl font-black text-status-success animate-bounce tracking-tight">IMPOSTER CAUGHT!</div>
                              <div className="text-text-muted text-lg">The civilians successfully voted out {renderPlayer(gameState.imposterId)}.</div>
                              
                              <div className="w-full h-px bg-border-default my-4"></div>
                              
                              {amIImposter ? (
                                  <div className="space-y-4 bg-red-500/10 p-6 rounded-2xl border border-red-500/30">
                                      <div className="text-red-500 font-black text-xl">LAST CHANCE</div>
                                      <div className="text-text-primary text-sm">You were caught! But if you can correctly guess the secret word, you steal the win.</div>
                                      <div className="flex flex-col sm:flex-row gap-2 mt-4">
                                        <input
                                          type="text"
                                          value={guessInput}
                                          onChange={(e) => setGuessInput(e.target.value)}
                                          className="flex-1 bg-surface-base border-2 border-red-500/50 rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:border-red-500 transition-colors uppercase"
                                          placeholder="GUESS THE WORD..."
                                          maxLength={20}
                                        />
                                        <button
                                          onClick={submitGuess}
                                          disabled={!guessInput.trim()}
                                          className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-black tracking-wider rounded-xl transition-all disabled:opacity-50"
                                        >
                                          GUESS
                                        </button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-text-muted animate-pulse p-6 bg-surface-raised rounded-2xl border border-border-default flex flex-col items-center gap-3">
                                      <svg className="w-8 h-8 text-hrsh-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                      <span className="font-bold">The imposter is trying to guess the word to steal the win...</span>
                                  </div>
                              )}
                          </div>
                      );
                  } else {
                      return (
                          <div className="space-y-6">
                              <div className="text-4xl font-black text-red-500 animate-bounce tracking-tight">IMPOSTER ESCAPED!</div>
                              <div className="text-text-muted text-lg">
                                {votedOut ? (
                                  <span>The civilians wrongly voted out {renderPlayer(votedOut)}.</span>
                                ) : (
                                  <span>The vote was tied!</span>
                                )}
                              </div>
                              <div className="text-xl font-bold text-text-primary">
                                The imposter was {renderPlayer(gameState.imposterId)}.
                              </div>
                              {isHost && (
                                  <button
                                    onClick={continueReveal}
                                    className="w-full mt-4 py-4 bg-hrsh-accent hover:bg-hrsh-accent/90 text-white font-black tracking-widest uppercase rounded-xl transition-all active:scale-95"
                                  >
                                    Continue to Results
                                  </button>
                              )}
                          </div>
                      );
                  }
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ImposterGame;
