import React, { Component, ErrorInfo, ReactNode } from 'react';

interface WebGLErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Resilient WebGL Error Boundary
 * Prevents 3D Canvas context failures or Three.js / R3F runtime exceptions
 * from crashing the entire React tree and leaving a blank page.
 */
export class WebGLErrorBoundary extends Component<WebGLErrorBoundaryProps, WebGLErrorBoundaryState> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WebGLErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[BLACKBOX 3D] WebGL rendering error caught by boundary, falling back gracefully:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
