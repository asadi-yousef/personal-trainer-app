'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's a DOM manipulation error
    if (error.message.includes('removeChild') || 
        error.message.includes('Node') || 
        error.message.includes('NotFoundError') ||
        error.message.includes('Failed to execute') ||
        error.message.includes('not a child of this node') ||
        error.name === 'NotFoundError') {
      console.warn('DOM manipulation error caught, attempting to recover...');
      // Reset the error state after a short delay to allow recovery
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 300);
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-gray-500 mb-2">Something went wrong</div>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="text-indigo-600 hover:text-indigo-700 text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
