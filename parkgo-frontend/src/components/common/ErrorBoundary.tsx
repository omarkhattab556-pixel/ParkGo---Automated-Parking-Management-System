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
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] caught', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-rose-100 p-6">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-xl mb-6">
            <AlertOctagon
              className="h-10 w-10 text-white"
              strokeWidth={2.2}
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Something broke
          </h1>
          <p className="text-slate-500 mb-6">
            Sorry — an unexpected error stopped the page from rendering. Try
            refreshing, or go back to your dashboard.
          </p>

          {import.meta.env.DEV && (
            <pre className="text-left text-xs rounded-xl bg-slate-900 text-slate-200 p-3 mb-6 overflow-auto max-h-40">
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
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Reload page
            </button>
            <button
              onClick={() => {
                this.reset();
                window.location.href = '/';
              }}
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium shadow-sm hover:bg-slate-50 transition-all"
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
