import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { RequireAuth } from '@/components/RequireAuth'
import { IndexRedirect } from '@/components/IndexRedirect'
import { Ventas } from '@/pages/Ventas'
import { Productos } from '@/pages/Productos'
import { Caja } from '@/pages/Caja'
import { Inventario } from '@/pages/Inventario'
import { Clientes } from '@/pages/Clientes'
import { Cuotas } from '@/pages/Cuotas'
import { Turnos } from '@/pages/Turnos'
import { Reportes } from '@/pages/Reportes'
import { Configuracion } from '@/pages/Configuracion'
import { Login } from '@/pages/Login'
import { Reservar } from '@/pages/Reservar'
import { Tienda } from '@/pages/Tienda'
import { Encuesta } from '@/pages/Encuesta'
import { ReporteImprimible } from '@/pages/ReporteImprimible'

export function App() {
  return (
    <Routes>
      {/* Públicas, sin login */}
      <Route path="/login" element={<Login />} />
      <Route path="/reservar" element={<Reservar />} />
      <Route path="/tienda" element={<Tienda />} />
      <Route path="/encuesta" element={<Encuesta />} />
      <Route path="/reporte-imprimible" element={<ReporteImprimible />} />

      {/* Panel interno, requiere sesión */}
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route
          index
          element={<IndexRedirect />}
        />
        <Route
          path="ventas"
          element={
            <RequireAuth modulo="ventas">
              <Ventas />
            </RequireAuth>
          }
        />
        <Route
          path="productos"
          element={
            <RequireAuth modulo="productos">
              <Productos />
            </RequireAuth>
          }
        />
        <Route
          path="caja"
          element={
            <RequireAuth modulo="caja">
              <Caja />
            </RequireAuth>
          }
        />
        <Route
          path="inventario"
          element={
            <RequireAuth modulo="inventario">
              <Inventario />
            </RequireAuth>
          }
        />
        <Route
          path="clientes"
          element={
            <RequireAuth modulo="clientes">
              <Clientes />
            </RequireAuth>
          }
        />
        <Route
          path="cuotas"
          element={
            <RequireAuth modulo="cuotas">
              <Cuotas />
            </RequireAuth>
          }
        />
        <Route
          path="turnos"
          element={
            <RequireAuth modulo="turnos">
              <Turnos />
            </RequireAuth>
          }
        />
        <Route
          path="reportes"
          element={
            <RequireAuth modulo="reportes">
              <Reportes />
            </RequireAuth>
          }
        />
        <Route
          path="configuracion"
          element={
            <RequireAuth modulo="configuracion">
              <Configuracion />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  )
}
