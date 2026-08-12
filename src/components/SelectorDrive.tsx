import { useState } from 'react'
import { HardDrive } from 'lucide-react'
import { useConfig } from '@/hooks/useConfig'
import { api } from '@/api/client'

declare global {
  interface Window {
    google?: any
    gapi?: any
  }
}

let scriptsCargados: Promise<void> | null = null

function cargarScripts(): Promise<void> {
  if (scriptsCargados) return scriptsCargados

  scriptsCargados = new Promise((resolve, reject) => {
    let restantes = 2
    function listo() {
      restantes -= 1
      if (restantes === 0) resolve()
    }

    const s1 = document.createElement('script')
    s1.src = 'https://accounts.google.com/gsi/client'
    s1.onload = listo
    s1.onerror = reject
    document.head.appendChild(s1)

    const s2 = document.createElement('script')
    s2.src = 'https://apis.google.com/js/api.js'
    s2.onload = () => window.gapi.load('picker', listo)
    s2.onerror = reject
    document.head.appendChild(s2)
  })

  return scriptsCargados
}

// Botón que solo aparece si el negocio cargó sus credenciales de Google
// Cloud en Configuración. Al tocarlo, pide acceso a Drive (una vez) y
// abre el selector nativo de Google para elegir un archivo ya existente,
// en vez de subir uno nuevo.
export function SelectorDrive({ onSeleccionar, disabled }: { onSeleccionar: (url: string) => void; disabled?: boolean }) {
  const { data: config } = useConfig()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!config?.googleClientId || !config?.googleApiKey) return null

  async function abrirPicker() {
    setError(null)
    setCargando(true)
    try {
      await cargarScripts()

      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: config!.googleClientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (respuesta: { access_token?: string; error?: string }) => {
          if (respuesta.error || !respuesta.access_token) {
            setError('No se pudo conectar con Google Drive.')
            setCargando(false)
            return
          }
          mostrarPicker(respuesta.access_token)
        },
      })
      tokenClient.requestAccessToken()
    } catch {
      setError('No se pudo cargar el selector de Drive.')
      setCargando(false)
    }
  }

  function mostrarPicker(accessToken: string) {
    const vista = new window.gapi.picker.api.DocsView(window.gapi.picker.api.ViewId.DOCS_IMAGES)
    const picker = new window.gapi.picker.api.PickerBuilder()
      .addView(vista)
      .setOAuthToken(accessToken)
      .setDeveloperKey(config!.googleApiKey)
      .setCallback((data: any) => {
        if (data.action === window.gapi.picker.api.Action.PICKED) {
          const fileId = data.docs[0].id
          confirmarSeleccion(fileId)
        }
        if (data.action === window.gapi.picker.api.Action.CANCEL) {
          setCargando(false)
        }
      })
      .build()
    picker.setVisible(true)
  }

  async function confirmarSeleccion(fileId: string) {
    try {
      const { url } = await api.post<{ url: string }>('compartirArchivoDrive', { fileId })
      onSeleccionar(url)
    } catch {
      setError('No se pudo usar esa foto. Probá con otra.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={abrirPicker}
        disabled={disabled || cargando}
        className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline disabled:opacity-50"
      >
        <HardDrive className="h-3.5 w-3.5" /> {cargando ? 'Abriendo Drive...' : 'Elegir desde Drive'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
