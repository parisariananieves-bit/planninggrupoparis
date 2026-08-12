import { Camera, X } from 'lucide-react'
import { comprimirImagen } from '@/lib/imagen'
import { SelectorDrive } from '@/components/SelectorDrive'

export interface FotoNueva {
  base64: string
  mimeType: string
  nombre: string
  preview: string
}

export function SelectorFotos({
  fotosExistentes,
  onQuitarExistente,
  onAgregarExistente,
  fotosNuevas,
  onAgregarNueva,
  onQuitarNueva,
  procesando,
  onProcesando,
  maximo = 6,
}: {
  fotosExistentes: string[]
  onQuitarExistente: (url: string) => void
  onAgregarExistente: (url: string) => void
  fotosNuevas: FotoNueva[]
  onAgregarNueva: (foto: FotoNueva) => void
  onQuitarNueva: (idx: number) => void
  procesando: boolean
  onProcesando: (v: boolean) => void
  maximo?: number
}) {
  const total = fotosExistentes.length + fotosNuevas.length

  async function handleFiles(files: FileList) {
    onProcesando(true)
    try {
      for (const file of Array.from(files)) {
        if (fotosExistentes.length + fotosNuevas.length >= maximo) break
        const base64 = await comprimirImagen(file)
        onAgregarNueva({ base64, mimeType: 'image/jpeg', nombre: 'foto.jpg', preview: `data:image/jpeg;base64,${base64}` })
      }
    } finally {
      onProcesando(false)
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        Fotos <span className="font-normal text-slate-400">(hasta {maximo})</span>
      </span>
      <div className="flex flex-wrap gap-2">
        {fotosExistentes.map((url) => (
          <div key={url} className="relative">
            <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => onQuitarExistente(url)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {fotosNuevas.map((f, idx) => (
          <div key={idx} className="relative">
            <img src={f.preview} alt="" className="h-20 w-20 rounded-xl object-cover" />
            <button
              type="button"
              onClick={() => onQuitarNueva(idx)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-900"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {total < maximo && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-500">
            <Camera className="h-5 w-5" />
            <span className="text-[10px] font-medium">{procesando ? '...' : 'Agregar'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={procesando}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      {total < maximo && (
        <div className="mt-2">
          <SelectorDrive onSeleccionar={onAgregarExistente} disabled={procesando} />
        </div>
      )}
    </div>
  )
}
