import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { VarianteColor } from '@/lib/paleta'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  trend?: { value: string; positive: boolean }
  tone?: 'default' | 'warning' | 'danger'
  variante?: VarianteColor
  to?: string
}

const toneStyles: Record<NonNullable<StatCardProps['tone']>, { bg: string; icon: string }> = {
  default: { bg: 'bg-primary-50', icon: 'bg-primary-500' },
  warning: { bg: 'bg-amber-50', icon: 'bg-amber-500' },
  danger: { bg: 'bg-red-50', icon: 'bg-red-500' },
}

export function StatCard({ label, value, icon: Icon, trend, tone = 'default', variante, to }: StatCardProps) {
  const usaVariante = variante && tone === 'default'

  const contenido = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={usaVariante ? { color: variante.text, opacity: 0.75 } : undefined}>
            {label}
          </p>
          <p
            className="mt-1.5 text-3xl font-bold tracking-tight"
            style={usaVariante ? { color: variante.text } : undefined}
          >
            {value}
          </p>
        </div>
        <div
          className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white', !usaVariante && toneStyles[tone].icon)}
          style={usaVariante ? { background: `linear-gradient(135deg, ${variante.dot}, ${variante.dot}CC)` } : undefined}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <p
          className="mt-3 text-xs font-semibold"
          style={usaVariante ? { color: variante.text, opacity: 0.85 } : undefined}
        >
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </>
  )

  const className = clsx(
    'relative block overflow-hidden rounded-3xl border p-5',
    !usaVariante && toneStyles[tone].bg,
    to && 'transition-transform hover:scale-[1.02] cursor-pointer'
  )
  const style = usaVariante
    ? { backgroundColor: variante.bg, borderColor: `${variante.dot}33` }
    : { borderColor: 'transparent' }

  if (to) {
    return (
      <Link to={to} className={className} style={style}>
        {contenido}
      </Link>
    )
  }

  return (
    <div className={className} style={style}>
      {contenido}
    </div>
  )
}
