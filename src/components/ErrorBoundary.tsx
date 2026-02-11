import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full border border-red-200">
            <h1 className="text-xl font-bold text-red-600 mb-2">Algo deu errado</h1>
            <p className="text-gray-700 mb-4">
              O aplicativo encontrou um erro. Abra o Console do navegador (F12 → Console) para mais detalhes.
            </p>
            <details className="text-sm text-left">
              <summary className="cursor-pointer text-rose-600 font-medium mb-2">Ver mensagem de erro</summary>
              <pre className="bg-gray-100 p-3 rounded overflow-auto text-gray-800 break-all">
                {this.state.error.message}
              </pre>
            </details>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
