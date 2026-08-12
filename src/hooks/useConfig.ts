import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { api } from '@/api/client'
import { generarPaleta } from '@/lib/paleta'
import type { Config } from '@/types'

function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r} ${g} ${b}`
}

// Oscurece un color hex un % determinado (0 a 1), para generar variantes
// -600/-700 reales a partir del color único que elige el negocio.
function oscurecer(hex: string, porcentaje: number): string {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  const r = Math.round(((bigint >> 16) & 255) * (1 - porcentaje))
  const g = Math.round(((bigint >> 8) & 255) * (1 - porcentaje))
  const b = Math.round((bigint & 255) * (1 - porcentaje))
  return `${r} ${g} ${b}`
}

// Aclara un color hex mezclándolo con blanco, para variantes -50/-100.
function aclarar(hex: string, porcentaje: number): string {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  const r = Math.round(((bigint >> 16) & 255) + (255 - ((bigint >> 16) & 255)) * porcentaje)
  const g = Math.round(((bigint >> 8) & 255) + (255 - ((bigint >> 8) & 255)) * porcentaje)
  const b = Math.round((bigint & 255) + (255 - (bigint & 255)) * porcentaje)
  return `${r} ${g} ${b}`
}

// El backend a veces va un paso atrás del frontend (falta redesplegar
// Apps Script después de un cambio). En vez de que cada pantalla se
// rompa por un campo que todavía no existe, normalizamos acá, una sola
// vez, y toda la app recibe siempre la forma completa.
function normalizarConfig(raw: Partial<Config>): Config {
  return {
    nombreNegocio: String(raw.nombreNegocio || ''),
    email: String(raw.email || ''),
    logoUrl: String(raw.logoUrl || ''),
    whatsappContacto: String(raw.whatsappContacto || ''),
    iva: raw.iva ?? 0,
    colorPrimario: String(raw.colorPrimario || '#8CA896'),
    colorSecundario: String(raw.colorSecundario || '#D9A28D'),
    comisiones: {
      efectivo: 0,
      debito: 0,
      credito1: 0,
      credito3: 0,
      credito6: 0,
      mercadoPago: 0,
      transferencia: 0,
      cuentaCorriente: 0,
      ...(raw.comisiones || {}),
    },
    turnos: {
      horaInicio: '09:00',
      horaFin: '18:00',
      duracionSlot: 60,
      requiereFichaSalud: true,
      politicasReserva: '',
      ...(raw.turnos || {}),
    },
    gastosFijosMensuales: raw.gastosFijosMensuales ?? 0,
    fechasBloqueadas: raw.fechasBloqueadas || [],
    sitioUrl: String(raw.sitioUrl || ''),
    mensajeBanner: String(raw.mensajeBanner || '✨ Coordinamos tu pedido directo por WhatsApp — respuesta rápida'),
    canalesVenta: raw.canalesVenta?.length ? raw.canalesVenta : ['Mostrador', 'Feria', 'Redes sociales'],
    googleClientId: String(raw.googleClientId || ''),
    googleApiKey: String(raw.googleApiKey || ''),
  }
}

export function useConfig() {
  const query = useQuery({
    queryKey: ['config'],
    queryFn: () => api.get<Config>('getConfig'),
    select: normalizarConfig,
    staleTime: 5 * 60 * 1000,
  })

  // Aplica los colores de marca del negocio como CSS variables globales,
  // generando una escala real (claro para fondos, oscuro para elementos
  // sólidos como el menú activo) a partir del único color que elige el negocio.
  useEffect(() => {
    if (!query.data) return
    const root = document.documentElement
    const primary = query.data.colorPrimario || '#6366f1'
    const accent = query.data.colorSecundario || '#f59e0b'

    root.style.setProperty('--color-primary-50', aclarar(primary, 0.9))
    root.style.setProperty('--color-primary-100', aclarar(primary, 0.8))
    root.style.setProperty('--color-primary-500', hexToRgbTriplet(primary))
    root.style.setProperty('--color-primary-600', oscurecer(primary, 0.15))
    root.style.setProperty('--color-primary-700', oscurecer(primary, 0.3))
    root.style.setProperty('--color-primary-800', oscurecer(primary, 0.42))
    root.style.setProperty('--color-accent-500', hexToRgbTriplet(accent))
    root.style.setProperty('--color-accent-600', oscurecer(accent, 0.15))
    root.style.setProperty('--color-accent-700', oscurecer(accent, 0.3))
    root.style.setProperty('--color-accent-100', aclarar(accent, 0.8))
  }, [query.data])

  return query
}

// Paleta de colores variados (varias tarjetas, distintos tonos) generada
// a partir de los 2 colores de marca — para el look "vivo" tipo dashboard
// de referencia, sin salirse de la identidad del negocio.
export function usePaleta() {
  const { data } = useConfig()
  return useMemo(
    () => generarPaleta(data?.colorPrimario || '#8CA896', data?.colorSecundario || '#D9A28D'),
    [data?.colorPrimario, data?.colorSecundario]
  )
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Config> & { logoBase64?: string; logoMimeType?: string; logoNombre?: string }) =>
      api.post<Config>('updateConfig', body),
    onSuccess: (data) => {
      qc.setQueryData(['config'], data)
    },
  })
}
