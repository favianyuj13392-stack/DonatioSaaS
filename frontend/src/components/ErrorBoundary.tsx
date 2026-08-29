import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-4 border border-slate-100">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Algo salió mal
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ocurrió un error inesperado. Por favor, intenta recargar la página.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="btn-tenant-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
