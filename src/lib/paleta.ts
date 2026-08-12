// A partir de los 2 colores que el negocio elige en Configuración,
// genera una paleta de variantes (rotando el matiz levemente) para que
// las tarjetas y listas se vean coloridas y vivas sin salirse de la
// identidad de marca — el mismo efecto que las apps de referencia
// (tarjetas de calendario en distintos colores pastel).

interface Hsl {
  h: number
  s: number
  l: number
}

function hexToHsl(hex: string): Hsl {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToHex({ h, s, l }: Hsl): string {
  const sN = s / 100
  const lN = l / 100
  const c = (1 - Math.abs(2 * lN - 1)) * sN
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lN - c / 2
  let r = 0
  let g = 0
  let b = 0

  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export interface VarianteColor {
  bg: string
  text: string
  border: string
  dot: string
}

// Genera N variantes rotando el matiz del color base, manteniendo
// saturación y luminosidad suaves (pastel) para que combinen entre sí.
function variantesDesde(hex: string, cantidad: number, pasoGrados: number): VarianteColor[] {
  const base = hexToHsl(hex)
  const variantes: VarianteColor[] = []

  for (let i = 0; i < cantidad; i++) {
    const h = (base.h + i * pasoGrados + 360) % 360
    const bgColor = hslToHex({ h, s: Math.min(base.s, 55), l: 94 })
    const textColor = hslToHex({ h, s: Math.min(base.s + 10, 65), l: 32 })
    const dotColor = hslToHex({ h, s: Math.min(base.s + 15, 70), l: 55 })
    variantes.push({ bg: bgColor, text: textColor, border: bgColor, dot: dotColor })
  }

  return variantes
}

// Paleta combinada: alterna variantes del color primario y del secundario
// para que se note la mezcla de los dos tonos de marca, no solo uno.
export function generarPaleta(colorPrimario: string, colorSecundario: string): VarianteColor[] {
  const desdePrimario = variantesDesde(colorPrimario, 3, 35)
  const desdeSecundario = variantesDesde(colorSecundario, 3, -35)
  const paleta: VarianteColor[] = []
  for (let i = 0; i < 3; i++) {
    paleta.push(desdePrimario[i])
    paleta.push(desdeSecundario[i])
  }
  return paleta
}
