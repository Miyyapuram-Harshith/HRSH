import { useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';

export function Onboarding() {
  const [name, setName] = useState('');
  const { setName: saveName } = usePlayerStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length >= 2) {
      await saveName(trimmed);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-[scale-in_0.3s_ease-out]">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">HRSH</h1>
          <p className="text-text-secondary text-sm">Play. Challenge. Repeat.</p>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-1">Welcome to HRSH</h2>
          <p className="text-text-muted text-sm mb-6">Choose your player name to get started.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="player-name" className="sr-only">Player name</label>
              <input
                id="player-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                autoFocus
                className="w-full bg-surface-base border border-border-default rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-hrsh-accent focus:ring-1 focus:ring-hrsh-accent transition-colors text-sm"
              />
              <p className="text-text-muted text-xs mt-2">2–20 characters. You can change this later.</p>
            </div>

            <button
              type="submit"
              disabled={name.trim().length < 2}
              className="w-full bg-hrsh-accent hover:bg-hrsh-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-4 py-3 text-sm transition-all duration-150 active:scale-[0.98]"
            >
              Continue
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          No account required. Your data stays on this device.
        </p>
      </div>
    </div>
  );
}
