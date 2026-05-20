import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] caught', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-aurora-soft p-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-danger-500 to-danger-700 flex items-center justify-center shadow-[0_18px_48px_-18px_rgba(244,63,94,0.55)] mb-6">
            <AlertOctagon className="h-10 w-10 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-900 tracking-tight mb-2">
            Something broke
          </h1>
          <p className="text-ink-500 mb-6">
            Sorry — an unexpected error stopped the page from rendering. Try
            refreshing, or go back to your dashboard.
          </p>

          {import.meta.env.DEV && (
            <pre className="text-left text-xs rounded-2xl bg-ink-900 text-ink-100 p-4 mb-6 overflow-auto max-h-40 border border-ink-800">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                this.reset();
                window.location.reload();
              }}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-semibold shadow-[0_8px_24px_-8px_rgba(93,82,247,0.55)] hover:-translate-y-0.5 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Reload page
            </button>
            <button
              onClick={() => {
                this.reset();
                window.location.href = '/';
              }}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-surface-0 border border-surface-200 text-ink-700 font-semibold shadow-soft hover:bg-surface-50"
            >
              <Home className="h-4 w-4" />
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
