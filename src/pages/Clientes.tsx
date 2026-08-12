import { useState, type FormEvent } from 'react'
import { HeartPulse, Plus, Search } from 'lucide-react'
import { useAddCliente, useClientes, useTurnos, useUpdateCliente } from '@/hooks/useEntities'
import { usePaleta } from '@/hooks/useConfig'
import { Button, EmptyState, ErrorBanner, Input, Modal, PageHeader } from '@/components/ui'
import { Spinner } from '@/components/Spinner'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Cliente, Turno } from '@/types'

export function Clientes() {
  const { data: clientes, isLoading, error } = useClientes()
  const { data: turnos } = useTurnos()
  const addCliente = useAddCliente()
  const updateCliente = useUpdateCliente()
  const paleta = usePaleta()
  const [open, setOpen] = useState(false)
  const [clienteEdit, setClienteEdit] = useState<Cliente | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const clientesFiltrados = (clientes || []).filter((c) => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return true
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.telefono.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  })

  function turnosConSalud(nombreCliente: string) {
    return (turnos || []).filter(
      (t) => t.cliente.trim().toLowerCase() === nombreCliente.trim().toLowerCase() && (t.alergias || t.condiciones)
    )
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    addCliente.mutate(
      {
        nombre: String(form.get('nombre')),
        email: String(form.get('email') || ''),
        telefono: String(form.get('telefono') || ''),
        direccion: String(form.get('direccion') || ''),
        notas: String(form.get('notas') || ''),
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Base de clientes — tocá cualquiera para editar"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo cliente
          </Button>
        }
      />

      {isLoading && <Spinner full />}
      {error && <ErrorBanner message={(error as Error).message} />}

      {clientes && clientes.length > 0 && (
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      )}

      {clientes && clientes.length === 0 && <EmptyState message="Todavía no cargaste ningún cliente." />}
      {clientes && clientes.length > 0 && clientesFiltrados.length === 0 && (
        <EmptyState message="No encontré ningún cliente con esa búsqueda." />
      )}

      {clientesFiltrados.length > 0 && (
        <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Compras</th>
                <th className="px-4 py-3">Total gastado</th>
                <th className="px-4 py-3">Última compra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesFiltrados.map((c, i) => {
                const conSalud = turnosConSalud(c.nombre)
                return (
                  <tr
                    key={c.id}
                    onClick={() => setClienteEdit(c)}
                    className="cursor-pointer border-l-4 hover:opacity-90"
                    style={{ borderLeftColor: paleta[i % paleta.length].dot }}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 font-medium text-slate-900">
                        {c.nombre}
                        {conSalud.length > 0 && <HeartPulse className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.telefono || c.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-900">{c.cantidadCompras}</td>
                    <td className="px-4 py-3 text-slate-900">{formatCurrency(c.totalCompras)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(c.ultimaCompra)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo cliente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" name="nombre" required />
          <Input label="Email" name="email" type="email" />
          <Input label="Teléfono" name="telefono" />
          <Input label="Dirección" name="direccion" />
          <Input label="Notas" name="notas" />
          {addCliente.isError && <ErrorBanner message={(addCliente.error as Error).message} />}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={addCliente.isPending}>
              {addCliente.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      {clienteEdit && (
        <EditarClienteModal
          cliente={clienteEdit}
          fichaSalud={turnosConSalud(clienteEdit.nombre)}
          updateCliente={updateCliente}
          onClose={() => setClienteEdit(null)}
        />
      )}
    </div>
  )
}

function EditarClienteModal({
  cliente,
  fichaSalud,
  updateCliente,
  onClose,
}: {
  cliente: Cliente
  fichaSalud: Turno[]
  updateCliente: ReturnType<typeof useUpdateCliente>
  onClose: () => void
}) {
  const [nombre, setNombre] = useState(cliente.nombre)
  const [email, setEmail] = useState(cliente.email)
  const [telefono, setTelefono] = useState(cliente.telefono)
  const [direccion, setDireccion] = useState(cliente.direccion)
  const [notas, setNotas] = useState(cliente.notas)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateCliente.mutate(
      { id: cliente.id, nombre, email, telefono, direccion, notas },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal open onClose={onClose} title={`Editar: ${cliente.nombre}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Input label="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        <Input label="Notas" value={notas} onChange={(e) => setNotas(e.target.value)} />

        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          <p><strong>{cliente.cantidadCompras}</strong> compras · <strong>{formatCurrency(cliente.totalCompras)}</strong> gastados en total</p>
          <p className="mt-0.5">Estos números se actualizan solos con cada venta, no se editan a mano.</p>
        </div>

        {fichaSalud.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <HeartPulse className="h-4 w-4" /> Ficha de salud
            </p>
            <div className="space-y-2">
              {fichaSalud.map((t) => (
                <div key={t.id} className="rounded-xl bg-amber-50 p-3 text-xs">
                  <p className="mb-1 text-amber-600">{formatDate(t.fecha)} · {t.servicio}</p>
                  {t.alergias && <p className="text-amber-900"><span className="font-medium">Alergias:</span> {t.alergias}</p>}
                  {t.condiciones && <p className="text-amber-900"><span className="font-medium">Condiciones:</span> {t.condiciones}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {updateCliente.isError && <ErrorBanner message={(updateCliente.error as Error).message} />}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateCliente.isPending}>
            {updateCliente.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
