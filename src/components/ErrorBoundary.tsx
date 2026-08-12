import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Queda en la consola del navegador para diagnóstico técnico.
    console.error('Error atrapado por ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF8F3] px-4 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-xl font-semibold text-slate-900">Algo se rompió acá</h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Sacale una captura a esto y mandásela a Claude para que lo arregle:
          </p>
          <pre className="mt-4 max-w-lg overflow-x-auto rounded-xl bg-slate-900 p-4 text-left text-xs text-red-300">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Recargar la página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
