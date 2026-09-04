import { Link } from 'react-router-dom';
import { GameRegistry } from '../engine/GameRegistry';

export default function Multiplayer() {
  const multiplayerGames = GameRegistry.getMultiplayer();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold tracking-tight">Play Online</h1>
        <p className="text-text-muted text-sm mt-1">Compete with friends and players worldwide</p>
      </div>

      {/* Entry points */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-surface-raised border border-border-default rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">⚡</div>
          <h2 className="text-base font-semibold mb-1">Quick Match</h2>
          <p className="text-text-muted text-xs mb-4">Jump into a game instantly.</p>
          <button className="px-6 py-2.5 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white rounded-xl font-medium text-sm transition-colors opacity-50 cursor-not-allowed">
            Coming Soon
          </button>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">🏠</div>
          <h2 className="text-base font-semibold mb-1">Create Room</h2>
          <p className="text-text-muted text-xs mb-4">Set up a private or public room.</p>
          <Link to="/room/create" className="inline-block px-6 py-2.5 bg-surface-overlay hover:bg-surface-hover text-text-primary rounded-xl font-medium text-sm transition-colors border border-border-default">
            Create Room
          </Link>
        </div>

        <div className="bg-surface-raised border border-border-default rounded-2xl p-6 text-center flex flex-col justify-between">
          <div>
            <div className="text-3xl mb-3">🔑</div>
            <h2 className="text-base font-semibold mb-1">Join Room</h2>
            <p className="text-text-muted text-xs mb-4">Enter a 5-character code.</p>
          </div>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const input = new FormData(e.currentTarget).get('roomId') as string;
              if (input && input.trim().length >= 4) {
                window.location.href = `/room/${input.trim().toUpperCase()}`;
              }
            }}
            className="flex gap-2"
          >
            <input 
              type="text" 
              name="roomId" 
              placeholder="Code" 
              maxLength={5}
              className="w-full bg-surface-base border border-border-default rounded-xl px-3 py-2 text-sm text-center font-bold uppercase focus:outline-none focus:border-hrsh-accent placeholder:font-normal placeholder:normal-case"
            />
            <button type="submit" className="px-4 py-2 bg-surface-overlay hover:bg-surface-hover border border-border-default rounded-xl font-medium text-sm transition-colors">
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Available multiplayer games */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Multiplayer Games</h2>
        <div className="space-y-3">
          {multiplayerGames.map((game) => (
            <Link
              key={game.id}
              to={`/games/${game.slug}`}
              className="flex items-center justify-between bg-surface-raised border border-border-default rounded-xl px-4 py-3 hover:border-border-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{game.icon}</span>
                <div>
                  <div className="text-sm font-medium">{game.title}</div>
                  <div className="text-xs text-text-muted">{game.shortDescription}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wider"
                  style={{ backgroundColor: `${game.color}20`, color: game.color }}
                >
                  {game.category}
                </span>
                <span className="text-xs text-text-muted">{game.minPlayers}–{game.maxPlayers}P</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Multiplayer roadmap */}
      <div className="bg-surface-raised border border-border-default rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-4">What's Coming</h2>
        <div className="space-y-3 text-sm">
          {[
            { icon: '🎯', title: 'Ranked Matches', desc: 'Competitive matchmaking with ratings' },
            { icon: '🏆', title: 'Tournaments', desc: 'Single-elimination brackets for up to 16 players' },
            { icon: '👥', title: 'Friend System', desc: 'Add friends and challenge them directly' },
            { icon: '📺', title: 'Spectator Mode', desc: 'Watch live matches and learn from the best' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="text-lg mt-0.5">{item.icon}</span>
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-text-muted text-xs">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
