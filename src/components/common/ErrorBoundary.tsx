import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Top-level and section-level Error Boundary for BLACKBOX X
 * Prevents application unmounts and blank screens on unhandled runtime errors.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[BLACKBOX X] Unhandled runtime exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    if (window.location.hash) {
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch (_) {}
    }
    window.location.href = '/';
  };

  handleResetState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV !== 'production';

      return (
        <div className="min-h-[420px] w-full flex flex-col items-center justify-center p-6 bg-cream border border-border rounded-xl shadow-xs text-graphite">
          <div className="max-w-lg w-full text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-crimson/10 border border-crimson/20 flex items-center justify-center text-crimson mb-2">
              <AlertTriangle size={24} />
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-crimson uppercase block mb-1">
                RUNTIME EXCEPTION INTERCEPTED
              </span>
              <h2 className="font-display font-bold text-2xl uppercase tracking-tight text-graphite">
                {this.props.fallbackTitle || 'Quantitative Pipeline Recovered'}
              </h2>
            </div>

            <p className="text-xs text-taupe font-sans leading-relaxed">
              {this.props.fallbackMessage ||
                'An unexpected rendering condition occurred. The deterministic state has been protected from unmounting.'}
            </p>

            {this.state.error && (
              <div className="p-3 bg-white border border-border rounded text-left font-mono text-[11px] text-crimson max-h-36 overflow-y-auto">
                <span className="font-bold">{this.state.error.name}: </span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleResetState}
                className="px-4 py-2 bg-crimson text-white text-xs font-mono font-bold uppercase rounded hover:bg-crimson-deep transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw size={13} />
                <span>Retry Render</span>
              </button>

              <button
                onClick={this.handleHome}
                className="px-4 py-2 bg-white border border-border text-graphite text-xs font-mono font-bold uppercase rounded hover:bg-ivory-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Home size={13} />
                <span>Return to Overview</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
