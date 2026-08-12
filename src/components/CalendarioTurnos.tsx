import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, HeartPulse, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui'
import { linkWhatsapp } from '@/components/CobrarTurnoModal'
import { usePaleta } from '@/hooks/useConfig'
import type { EstadoTurno, Turno } from '@/types'

const toneByEstado: Record<EstadoTurno, 'success' | 'warning' | 'danger'> = {
  confirmado: 'warning',
  completado: 'success',
  cancelado: 'danger',
}

function isoDia(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export function CalendarioTurnos({
  turnos,
  fechasBloqueadas,
  onSelectTurno,
  onCobrar,
  onReprogramar,
  onCancelar,
}: {
  turnos: Turno[]
  fechasBloqueadas: string[]
  onSelectTurno: (t: Turno) => void
  onCobrar: (t: Turno) => void
  onReprogramar: (t: Turno) => void
  onCancelar: (id: string) => void
}) {
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSel, setDiaSel] = useState(isoDia(new Date()))
  const paleta = usePaleta()

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesActual), { weekStartsOn: 1 })
    const fin = endOfWeek(endOfMonth(mesActual), { weekStartsOn: 1 })
    return eachDayOfInterval({ start: inicio, end: fin })
  }, [mesActual])

  const turnosPorDia = useMemo(() => {
    const mapa: Record<string, Turno[]> = {}
    turnos.forEach((t) => {
      if (!mapa[t.fecha]) mapa[t.fecha] = []
      mapa[t.fecha].push(t)
    })
    return mapa
  }, [turnos])

  const turnosDelDiaSel = (turnosPorDia[diaSel] || []).sort((a, b) => a.hora.localeCompare(b.hora))
  const bloqueadoDiaSel = fechasBloqueadas.includes(diaSel)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      {/* Calendario mensual */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setMesActual((m) => subMonths(m, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="font-serif text-base font-semibold capitalize text-slate-900">
            {format(mesActual, 'MMMM yyyy', { locale: es })}
          </p>
          <button onClick={() => setMesActual((m) => addMonths(m, 1))} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-slate-400">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {dias.map((d) => {
            const iso = isoDia(d)
            const enMes = isSameMonth(d, mesActual)
            const turnosDia = (turnosPorDia[iso] || []).filter((t) => t.estado !== 'cancelado')
            const bloqueado = fechasBloqueadas.includes(iso)
            const seleccionado = isSameDay(d, new Date(diaSel + 'T00:00:00'))

            return (
              <button
                key={iso}
                onClick={() => setDiaSel(iso)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                  seleccionado
                    ? 'bg-primary-600 text-white'
                    : bloqueado
                      ? 'bg-red-50 text-red-300'
                      : isToday(d)
                        ? 'bg-primary-50 text-primary-700'
                        : enMes
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-slate-50'
                }`}
              >
                {d.getDate()}
                {turnosDia.length > 0 && (
                  <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${seleccionado ? 'bg-white' : 'bg-primary-500'}`} />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-500" /> Con turnos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-200" /> Día bloqueado
          </span>
        </div>
      </div>

      {/* Lista lateral del día elegido */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-3 font-medium text-slate-900">
          {format(new Date(diaSel + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })}
        </p>

        {bloqueadoDiaSel && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">Marcaste este día como sin atención.</p>
        )}

        {turnosDelDiaSel.length === 0 ? (
          <p className="text-sm text-slate-400">No hay turnos este día.</p>
        ) : (
          <div className="space-y-3">
            {turnosDelDiaSel.map((t, i) => (
              <div
                key={t.id}
                className="rounded-xl border-l-4 p-3"
                style={{ backgroundColor: paleta[i % paleta.length].bg, borderLeftColor: paleta[i % paleta.length].dot }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: paleta[i % paleta.length].text }}>{t.hora}hs</span>
                  <Badge tone={toneByEstado[t.estado]}>{t.estado}</Badge>
                </div>
                <button
                  onClick={() => onSelectTurno(t)}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-800 hover:text-primary-600"
                >
                  {t.cliente}
                  {(t.alergias || t.condiciones) && <HeartPulse className="h-3.5 w-3.5 text-amber-500" />}
                </button>
                <p className="text-xs text-slate-500">{t.servicio}</p>

                {t.estado === 'confirmado' && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                    <button onClick={() => onReprogramar(t)} className="text-slate-500 hover:text-slate-700">
                      Reprogramar
                    </button>
                    <button onClick={() => onCobrar(t)} className="text-emerald-600 hover:text-emerald-700">
                      Cobrar y finalizar
                    </button>
                    <button onClick={() => onCancelar(t.id)} className="text-red-500 hover:text-red-700">
                      Cancelar
                    </button>
                  </div>
                )}

                {t.estado === 'completado' && t.telefono && (
                  <a
                    href={linkWhatsapp(
                      t.telefono,
                      `¡Hola ${t.cliente.split(' ')[0]}! Gracias por tu visita hoy 💜 Del 1 al 10, ¿qué tan probable es que nos recomiendes?`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Pedir opinión
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
