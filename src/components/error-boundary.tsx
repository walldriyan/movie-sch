
'use client';

import React from 'react';
import { Button } from './ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error | null, resetErrorBoundary: () => void }) {
  return (
    <div className="w-full bg-background text-foreground">
      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-8 text-center">
        <div className="max-w-lg">
          <h1 className="text-5xl font-bold text-destructive">Oops!</h1>
          <h2 className="mt-4 font-serif text-3xl font-bold">Something Went Wrong</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We've encountered an unexpected issue on our end. Please try again.
          </p>
          <pre className="mt-4 text-xs text-left bg-muted p-2 rounded-md overflow-x-auto">
            {error?.message || 'An unknown error occurred.'}
          </pre>
          <Button onClick={resetErrorBoundary} className="mt-8" size="lg">
            Try again
          </Button>
        </div>
      </main>
    </div>
  );
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetState = () => {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.resetState} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
