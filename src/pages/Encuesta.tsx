import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Heart, Star } from 'lucide-react'
import { useConfig } from '@/hooks/useConfig'
import { useRegistrarEncuesta } from '@/hooks/useEntities'
import { Button } from '@/components/ui'

export function Encuesta() {
  const { data: config } = useConfig()
  const [searchParams] = useSearchParams()
  const registrar = useRegistrarEncuesta()

  const turnoId = searchParams.get('id') || ''
  const notaParam = searchParams.get('nota')
  const nota = notaParam ? Number(notaParam) : null

  const [comentario, setComentario] = useState('')
  const [comentarioEnviado, setComentarioEnviado] = useState(false)

  useEffect(() => {
    if (turnoId && nota) {
      registrar.mutate({ turnoId, nota })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnoId, nota])

  const logoSrc = config?.logoUrl?.trim() || '/logo.png'
  const nombreNegocio = config?.nombreNegocio || 'Oletha Beauty'

  function enviarComentario() {
    registrar.mutate(
      { turnoId, comentario },
      { onSuccess: () => setComentarioEnviado(true) }
    )
  }

  if (!turnoId || !nota) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F7F5] px-4"><div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary-200/25 blur-3xl" /><div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-accent-500/12 blur-3xl" />
        <p className="text-sm text-slate-500">Este link no es válido.</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F7F5] px-4"><div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary-200/25 blur-3xl" /><div className="pointer-events-none absolute -bottom-20 -right-16 h-72 w-72 rounded-full bg-accent-500/12 blur-3xl" />
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white/80 p-6 text-center shadow-xl backdrop-blur-xl">
        <img src={logoSrc} alt={nombreNegocio} className="mx-auto mb-3 h-16 w-16 rounded-full object-contain" />

        {registrar.isPending && !registrar.isSuccess && (
          <p className="text-sm text-slate-500">Guardando tu nota...</p>
        )}

        {registrar.isSuccess && (
          <>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <Check className="h-7 w-7" />
            </div>
            <p className="font-serif text-lg font-semibold text-slate-900">¡Gracias por tu nota!</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-600">
              Le pusiste <span className="font-bold text-primary-700">{nota}/10</span> a {nombreNegocio}
              <Star className="h-4 w-4 fill-accent-500 text-accent-500" />
            </p>

            {!comentarioEnviado ? (
              <div className="mt-5 text-left">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  ¿Algo más que quieras contarnos? (opcional)
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  placeholder="Tu comentario..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <Button
                  onClick={enviarComentario}
                  disabled={!comentario.trim() || registrar.isPending}
                  className="mt-3 w-full justify-center"
                >
                  Enviar comentario
                </Button>
              </div>
            ) : (
              <p className="mt-5 flex items-center justify-center gap-1.5 text-sm text-primary-700">
                <Heart className="h-4 w-4 fill-primary-600 text-primary-600" /> ¡Gracias por tu tiempo!
              </p>
            )}
          </>
        )}

        {registrar.isError && (
          <p className="text-sm text-red-600">No pudimos registrar tu nota. Intentá de nuevo más tarde.</p>
        )}
      </div>
    </div>
  )
}
