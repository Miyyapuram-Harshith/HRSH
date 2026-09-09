import { useState } from 'react';
import type { GameComponentProps } from '../../types/game';
import { usePlayerStore } from '../../stores/playerStore';

export default function WordGuesserGame({ multiplayerState, onMultiplayerAction }: GameComponentProps) {
  const { player } = usePlayerStore();
  const [inputText, setInputText] = useState('');

  if (!multiplayerState) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">Waiting for game state...</div>
      </div>
    );
  }

  const { players, scores, turn, word, guesses, phase, winner } = multiplayerState;
  const isMyTurn = player?.id === turn;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (onMultiplayerAction) {
      onMultiplayerAction({ type: 'GUESS', word: inputText.trim() });
    }
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Word Guesser</h2>
          <div className="text-text-muted text-sm">
            {phase === 'picking' && isMyTurn && 'Your turn to pick a word!'}
            {phase === 'picking' && !isMyTurn && 'Waiting for player to pick a word...'}
            {phase === 'guessing' && isMyTurn && `Your word is: ${word}`}
            {phase === 'guessing' && !isMyTurn && 'Guess the word!'}
            {phase === 'round-end' && 'Round Over!'}
          </div>
        </div>
        
        {/* Scores */}
        <div className="flex gap-2">
          {players.map((id: string) => (
            <div key={id} className="text-xs bg-surface-raised px-2 py-1 rounded border border-border-default">
              {id === player?.id ? 'You' : id.substring(0, 4)}: <span className="font-bold">{scores[id]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 bg-surface-raised border border-border-default rounded-xl p-4 flex flex-col min-h-[300px]">
        {phase === 'picking' && isMyTurn ? (
          <div className="flex flex-col items-center justify-center flex-1">
            <h3 className="mb-4 font-semibold text-lg">Type a word for others to guess</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim() && onMultiplayerAction) {
                onMultiplayerAction({ type: 'PICK_WORD', word: inputText.trim() });
                setInputText('');
              }
            }} className="flex gap-2 w-full max-w-sm">
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Enter a secret word..."
                className="flex-1 bg-surface-base border border-border-default rounded-lg px-4 py-2 uppercase font-mono tracking-widest text-center focus:border-hrsh-accent outline-none"
                maxLength={8}
                pattern="[a-zA-Z]+"
                title="Letters only"
              />
              <button type="submit" className="px-4 py-2 bg-hrsh-accent text-white rounded-lg font-semibold">Pick</button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center max-w-md mx-auto w-full">
            {/* Guesses Log (Wordle Style) */}
            <div className="flex-1 w-full space-y-2 mb-8 flex flex-col items-center justify-end pb-4">
              {guesses.length === 0 && phase !== 'picking' && (
                <div className="text-center text-text-muted">Start guessing!</div>
              )}
              {guesses.map((g: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-1 w-full">
                  <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase">
                    {g.playerId === player?.id ? 'You' : g.playerId.substring(0, 4)}
                  </span>
                  <div className="flex justify-center gap-1.5">
                    {g.text.split('').map((char: string, j: number) => {
                      const status = g.statuses?.[j] || 'absent';
                      let bgColor = 'bg-surface-base border-border-default';
                      let textColor = 'text-text-primary';
                      
                      if (status === 'correct') {
                        bgColor = 'bg-[#22c55e] border-[#22c55e]';
                        textColor = 'text-white';
                      } else if (status === 'present') {
                        bgColor = 'bg-[#eab308] border-[#eab308]';
                        textColor = 'text-white';
                      } else if (status === 'absent') {
                        bgColor = 'bg-surface-overlay border-surface-overlay opacity-50';
                        textColor = 'text-white';
                      }
                      
                      return (
                        <div 
                          key={j} 
                          className={`w-10 h-10 sm:w-12 sm:h-12 border-2 rounded-lg flex items-center justify-center text-xl font-bold uppercase font-mono ${bgColor} ${textColor}`}
                        >
                          {char}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            {phase === 'guessing' && !isMyTurn && (
              <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Guess the word..."
                  className="flex-1 bg-surface-base border-2 border-border-default rounded-xl px-4 py-3 uppercase font-mono tracking-widest text-center focus:border-hrsh-accent outline-none text-lg font-bold"
                  autoComplete="off"
                  pattern="[a-zA-Z]+"
                />
                <button type="submit" className="px-6 py-3 bg-hrsh-accent text-white rounded-xl font-bold uppercase tracking-wider shadow-lg">Send</button>
              </form>
            )}
            
            {phase === 'round-end' && (
              <div className="text-center p-6 bg-surface-base rounded-2xl border-2 border-hrsh-accent w-full animate-[slide-up_0.3s_ease-out]">
                <h3 className="text-2xl font-black mb-2 text-text-primary">
                  {winner === player?.id ? '🎉 You guessed it!' : `🎉 ${winner?.substring(0, 4)} guessed it!`}
                </h3>
                <p className="text-text-muted">The word was: <span className="font-bold text-hrsh-accent text-xl uppercase tracking-widest">{word}</span></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
