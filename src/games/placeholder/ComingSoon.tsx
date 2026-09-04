// Coming Soon placeholder for future games
import { Link } from 'react-router-dom';

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-4xl mb-4">🚧</div>
      <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
      <p className="text-text-muted text-sm mb-6 text-center max-w-sm">
        This game is being built. Check back soon for multiplayer action.
      </p>
      <Link
        to="/games"
        className="px-6 py-2.5 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white rounded-xl font-medium text-sm transition-colors"
      >
        Browse Games
      </Link>
    </div>
  );
}
