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
            <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-sm">
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Enter a secret word..."
                className="flex-1 bg-surface-base border border-border-default rounded-lg px-4 py-2"
                maxLength={20}
              />
              <button type="submit" className="px-4 py-2 bg-hrsh-accent text-white rounded-lg font-semibold">Pick</button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            {/* Guesses Log */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
              {guesses.length === 0 && (
                <div className="text-center text-text-muted mt-8">No guesses yet.</div>
              )}
              {guesses.map((g: any, i: number) => (
                <div key={i} className={`p-2 rounded-lg text-sm border ${g.isCorrect ? 'bg-status-success/20 border-status-success text-status-success' : 'bg-surface-base border-border-default'}`}>
                  <span className="font-bold">{g.playerId === player?.id ? 'You' : g.playerId.substring(0, 4)}:</span> {g.text}
                </div>
              ))}
            </div>

            {/* Input */}
            {phase === 'guessing' && !isMyTurn && (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Guess the word..."
                  className="flex-1 bg-surface-base border border-border-default rounded-lg px-4 py-2 focus:border-hrsh-accent outline-none"
                  autoComplete="off"
                />
                <button type="submit" className="px-6 py-2 bg-hrsh-accent text-white rounded-lg font-semibold">Send</button>
              </form>
            )}
            
            {phase === 'round-end' && (
              <div className="text-center p-4 bg-surface-base rounded-lg border border-border-default">
                <h3 className="text-xl font-bold mb-2 text-hrsh-accent">
                  {winner === player?.id ? 'You guessed it!' : `${winner.substring(0, 4)} guessed it!`}
                </h3>
                <p>The word was: <span className="font-bold">{word}</span></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
