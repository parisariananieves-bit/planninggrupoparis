import { useState, type FormEvent } from 'react'
import { Calculator } from 'lucide-react'
import { useRegistrarArqueo } from '@/hooks/useEntities'
import { Button, Card, ErrorBanner, Input } from '@/components/ui'
import { formatCurrency } from '@/lib/format'

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-xl bg-primary-50 p-2 text-primary-600">
        <Calculator className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}

export function ArqueoCard() {
  const registrarArqueo = useRegistrarArqueo()
  const [montoContado, setMontoContado] = useState('')
  const [resultado, setResultado] = useState<{ esperado: number; contado: number; diferencia: number } | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    registrarArqueo.mutate(Number(montoContado), {
      onSuccess: (data) => setResultado(data),
    })
  }

  return (
    <Card className="p-5 md:p-6">
      <SectionHeader title="Arqueo de caja" subtitle="Contá el efectivo físico y comparalo con lo que debería haber" />

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <Input
            label="Efectivo contado ahora"
            type="number"
            step="0.01"
            value={montoContado}
            onChange={(e) => { setMontoContado(e.target.value); setResultado(null) }}
            placeholder="0"
            required
          />
        </div>
        <Button type="submit" disabled={registrarArqueo.isPending || !montoContado}>
          {registrarArqueo.isPending ? 'Comparando...' : 'Comparar'}
        </Button>
      </form>

      {registrarArqueo.isError && (
        <div className="mt-3">
          <ErrorBanner message={(registrarArqueo.error as Error).message} />
        </div>
      )}

      {resultado && (
        <div
          className={`mt-4 rounded-xl p-4 text-sm ${
            Math.abs(resultado.diferencia) < 0.5
              ? 'bg-emerald-50 text-emerald-700'
              : resultado.diferencia > 0
                ? 'bg-blue-50 text-blue-700'
                : 'bg-red-50 text-red-700'
          }`}
        >
          <p>Esperado en efectivo: <strong>{formatCurrency(resultado.esperado)}</strong></p>
          <p>Contado: <strong>{formatCurrency(resultado.contado)}</strong></p>
          <p className="mt-1 font-medium">
            {Math.abs(resultado.diferencia) < 0.5
              ? '✓ Coincide, no se registró ningún ajuste.'
              : resultado.diferencia > 0
                ? `Hay ${formatCurrency(resultado.diferencia)} de más — se registró como ingreso "Ajuste por arqueo" en Caja.`
                : `Faltan ${formatCurrency(Math.abs(resultado.diferencia))} — se registró como egreso "Ajuste por arqueo" en Caja.`}
          </p>
        </div>
      )}
    </Card>
  )
}
