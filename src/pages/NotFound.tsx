import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-5xl mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-text-muted mb-6">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-hrsh-accent hover:bg-hrsh-accent-hover text-white rounded-xl font-medium text-sm transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
