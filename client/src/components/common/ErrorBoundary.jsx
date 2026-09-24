import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground">
          <div className="max-w-md w-full p-6 rounded-2xl border border-border bg-card shadow-luxury text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-serif">Something went wrong</h2>
            <p className="text-xs text-muted-foreground">
              An unexpected error occurred while rendering the page. Click reload to refresh the application.
            </p>
            {this.state.error && (
              <div className="p-3 bg-muted/50 rounded-lg text-left overflow-auto max-h-32 text-[11px] font-mono text-destructive">
                {this.state.error.toString()}
              </div>
            )}
            <Button
              variant="luxury"
              onClick={this.handleReload}
              className="w-full gap-2 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
