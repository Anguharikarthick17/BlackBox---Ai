import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class PortfolioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'Calculation engine exception',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PORTFOLIO_ERROR_BOUNDARY] Caught error in Portfolio Lab:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-screen-2xl mx-auto px-4 py-12">
          <div className="border border-crimson/30 bg-crimson/5 rounded-lg p-8 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-crimson/10 text-crimson flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-sm font-bold text-graphite uppercase tracking-wider mb-2">
              Portfolio Lab encountered an unexpected calculation error.
            </h2>
            <p className="text-xs text-graphite-400 font-mono mb-6 leading-relaxed">
              The quantitative risk engine detected an invalid mathematical state or calculation exception.
              All other workspace modules remain active and operational.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-crimson flex items-center gap-2 text-xs !px-5 !py-2.5 shadow-sm cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset to Default Allocation</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
