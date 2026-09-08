import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-status-danger/10 flex items-center justify-center text-status-danger mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">HRSH ran into an unexpected error.</h1>
          <p className="text-sm text-text-muted mb-6 max-w-md">
            Something went wrong while rendering this component. 
            {import.meta.env.DEV && this.state.error && (
              <span className="block mt-2 font-mono text-xs text-status-danger bg-status-danger/10 p-2 rounded text-left overflow-auto">
                {this.state.error.message}
              </span>
            )}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-hrsh-accent text-white rounded-lg text-sm font-medium hover:bg-hrsh-accent-hover transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-surface-raised border border-border-default rounded-lg text-sm font-medium hover:border-border-accent transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
