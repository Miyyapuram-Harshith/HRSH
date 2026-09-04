import { Link } from 'react-router-dom';

const footerLinks = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/accessibility', label: 'Accessibility' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-default mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <div className="text-base font-bold tracking-tight text-text-primary">HRSH</div>
            <div className="text-xs text-text-muted mt-1">Play. Challenge. Repeat.</div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t border-border-subtle">
          <p className="text-xs text-text-muted">
            © {year} Articlarity. HRSH is a product of Articlarity.
          </p>
        </div>
      </div>
    </footer>
  );
}
