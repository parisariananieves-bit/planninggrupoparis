export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

// Genera la lista de horarios posibles (ej: ["09:00","10:00",...]) a partir
// de la hora de inicio/fin y duración de turno configuradas por el negocio.
export function generarHorarios(horaInicio: string, horaFin: string, duracionMin: number): string[] {
  const horarios: string[] = []
  const [hIni, mIni] = horaInicio.split(':').map(Number)
  const [hFin, mFin] = horaFin.split(':').map(Number)

  let minutos = hIni * 60 + mIni
  const minutosFin = hFin * 60 + mFin

  while (minutos < minutosFin) {
    const h = Math.floor(minutos / 60)
    const m = minutos % 60
    horarios.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    minutos += duracionMin || 60
  }

  return horarios
}

export function minutosDesdeHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// De todos los horarios "de grilla" (generarHorarios), deja solo los que
// realmente entran sin pisar otro turno ya reservado, teniendo en cuenta
// cuánto dura EL SERVICIO ELEGIDO (no un valor fijo genérico) y cuánto
// duraba cada turno existente.
export function filtrarHorariosDisponibles(
  horariosGrilla: string[],
  duracionServicioMin: number,
  horaFin: string,
  turnosOcupados: { hora: string; duracion: number }[]
): string[] {
  const finJornada = minutosDesdeHHMM(horaFin)

  return horariosGrilla.filter((hora) => {
    const inicio = minutosDesdeHHMM(hora)
    const fin = inicio + duracionServicioMin
    if (fin > finJornada) return false

    return !turnosOcupados.some((t) => {
      const inicioExistente = minutosDesdeHHMM(t.hora)
      const finExistente = inicioExistente + (t.duracion || 60)
      return inicio < finExistente && fin > inicioExistente
    })
  })
}
