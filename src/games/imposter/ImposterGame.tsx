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
  const [guessInput, setGuessInput] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const gameState = multiplayerState;

  useEffect(() => {
    // onGameStart is called immediately as multiplayer handles its own lifecycle
    onGameStart();
  }, [onGameStart]);

  useEffect(() => {
    if (gameState?.winner) {
      // Game ended
      const amIImposter = gameState.imposterId === myId;
      const civiliansWon = gameState.winner === 'CIVILIANS';
      const iWon = (amIImposter && !civiliansWon) || (!amIImposter && civiliansWon);

      const result: GameResult = {
        gameId: 'imposter',
        mode: 'classic',
        score: iWon ? 100 : 0,
        won: iWon,
        duration: 0,
        moves: 0,
        personalBest: false,
        data: { role: amIImposter ? 'Imposter' : 'Civilian', winner: civiliansWon ? 'CIVILIANS' : 'IMPOSTER' },
        timestamp: Date.now(),
      };
      onGameEnd(result);
    }
  }, [gameState?.winner, onGameEnd, myId, gameState]);

  if (!gameState) return <div className="text-center p-8 text-white">Waiting for game state...</div>;

  const { phase, word, clues, votes } = gameState;
  const amIImposter = !word; // Since word is masked if we are imposter

  const submitClue = () => {
    if (!clueInput.trim()) return;
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

  // Compute vote counts for reveal phase
  const counts: Record<string, number> = {};
  if (phase === 'reveal') {
      for (const v of Object.values(votes || {})) {
          const target = v as string;
          counts[target] = (counts[target] || 0) + 1;
      }
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-surface-base border border-border-default rounded-xl p-6 shadow-xl text-white">
      <h2 className="text-3xl font-black mb-6 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
        IMPOSTER
      </h2>

      {phase === 'clue' && (
        <div className="space-y-6">
          <div className="text-center p-4 bg-surface-raised rounded-xl border border-border-default">
            <div className="text-sm text-text-muted mb-1">Your Role</div>
            <div className={`text-2xl font-bold ${amIImposter ? 'text-red-500' : 'text-blue-400'}`}>
              {amIImposter ? 'IMPOSTER' : 'CIVILIAN'}
            </div>
            {!amIImposter && (
              <div className="mt-4">
                <div className="text-xs text-text-muted uppercase">The Secret Word is</div>
                <div className="text-3xl font-black text-hrsh-accent tracking-widest">{word}</div>
              </div>
            )}
            {amIImposter && (
              <div className="mt-4 text-text-muted text-sm">
                Blend in! Figure out the word from other people's clues.
              </div>
            )}
          </div>

          {!clues[myId] ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Enter your clue (one word):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  className="flex-1 bg-surface-raised border border-border-default rounded-lg px-4 py-2 focus:outline-none focus:border-hrsh-accent"
                  placeholder="e.g. Yellow..."
                  maxLength={20}
                  onKeyDown={e => e.key === 'Enter' && submitClue()}
                />
                <button
                  onClick={submitClue}
                  disabled={!clueInput.trim()}
                  className="px-6 py-2 bg-hrsh-accent text-white font-bold rounded-lg disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 text-text-muted">
              Waiting for others to submit their clues... ({Object.keys(clues).length}/{room.players.length})
            </div>
          )}
        </div>
      )}

      {phase === 'discussion' && (
        <div className="space-y-6">
          <div className="text-center text-xl font-bold text-hrsh-accent animate-pulse">DISCUSSION TIME</div>
          <div className="bg-surface-raised border border-border-default rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-text-muted uppercase mb-2">Clues</h3>
            {room.players.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-surface-base p-2 rounded border border-border-default">
                <span className="font-semibold" style={{ color: p.customization?.primaryColor || '#fff' }}>{p.name}</span>
                <span className="font-mono text-lg font-bold">{clues[p.id]}</span>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-text-muted">
            Discuss who might be the imposter over voice chat!
          </div>

          {isHost && (
            <button
              onClick={startVoting}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
            >
              Start Voting Phase
            </button>
          )}
        </div>
      )}

      {phase === 'voting' && (
        <div className="space-y-6">
          <div className="text-center text-xl font-bold text-red-500 animate-pulse">VOTE OUT THE IMPOSTER</div>
          <div className="grid grid-cols-1 gap-2">
            {room.players.map(p => (
              <button
                key={p.id}
                onClick={() => submitVote(p.id)}
                disabled={hasVoted}
                className={`p-4 rounded-xl border font-bold flex justify-between items-center transition-colors ${
                  votes[myId] === p.id 
                    ? 'bg-red-500/20 border-red-500 text-red-500' 
                    : hasVoted 
                      ? 'bg-surface-raised border-border-default opacity-50 cursor-not-allowed'
                      : 'bg-surface-raised border-border-default hover:border-text-primary'
                }`}
              >
                <span style={{ color: p.customization?.primaryColor || '#fff' }}>{p.name}</span>
                {votes[myId] === p.id && <span>✓ Voted</span>}
              </button>
            ))}
          </div>
          <div className="text-center text-text-muted text-sm">
            Votes cast: {Object.keys(votes).length}/{room.players.length}
          </div>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="space-y-6">
          <div className="text-center text-2xl font-black">VOTING RESULTS</div>
          
          <div className="bg-surface-raised border border-border-default rounded-xl p-4 space-y-2">
             {room.players.map(p => (
                 <div key={p.id} className="flex justify-between items-center">
                     <span className="font-semibold" style={{ color: p.customization?.primaryColor || '#fff' }}>{p.name}</span>
                     <div className="flex gap-1">
                         {Array.from({ length: counts[p.id] || 0 }).map((_, i) => (
                             <div key={i} className="w-4 h-4 bg-red-500 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                         ))}
                     </div>
                 </div>
             ))}
          </div>

          {/* Voted out logic */}
          {(() => {
              let maxVotes = 0;
              let votedOut = null;
              for (const [p, c] of Object.entries(counts)) {
                  if (c > maxVotes) { maxVotes = c; votedOut = p; }
                  else if (c === maxVotes) { votedOut = null; }
              }

              if (votedOut === gameState.imposterId) {
                  return (
                      <div className="text-center space-y-4">
                          <div className="text-2xl font-black text-status-success animate-bounce">IMPOSTER CAUGHT!</div>
                          
                          {amIImposter ? (
                              <div className="space-y-4">
                                  <div className="text-red-400 font-bold">You were caught! But you can still win if you guess the word.</div>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={guessInput}
                                      onChange={(e) => setGuessInput(e.target.value)}
                                      className="flex-1 bg-surface-raised border border-border-default rounded-lg px-4 py-2 focus:outline-none focus:border-red-500"
                                      placeholder="Guess the word..."
                                      maxLength={20}
                                    />
                                    <button
                                      onClick={submitGuess}
                                      disabled={!guessInput.trim()}
                                      className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg disabled:opacity-50"
                                    >
                                      Guess
                                    </button>
                                  </div>
                              </div>
                          ) : (
                              <div className="text-text-muted animate-pulse">
                                  The imposter is trying to guess the word...
                              </div>
                          )}
                      </div>
                  );
              } else {
                  return (
                      <div className="text-center space-y-4">
                          <div className="text-2xl font-black text-red-500 animate-bounce">IMPOSTER ESCAPED!</div>
                          <div className="text-text-muted">The imposter won the game!</div>
                          {isHost && (
                              <button
                                onClick={continueReveal}
                                className="w-full py-3 bg-hrsh-accent hover:bg-hrsh-accent/90 text-white font-bold rounded-xl transition-colors"
                              >
                                Continue to Results
                              </button>
                          )}
                      </div>
                  );
              }
          })()}

        </div>
      )}
    </div>
  );
}

export default ImposterGame;
