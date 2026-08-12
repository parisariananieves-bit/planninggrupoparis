# Oletha Beauty · Gestión

PWA construida con React + TypeScript + Vite + Tailwind que usa Google Sheets (vía Apps Script) como backend. Módulos: Dashboard, Ventas, Productos, Caja, Inventario, Clientes, Cuotas, Configuración.

Se puede "instalar" como app desde el navegador en cualquier celular o computadora (Chrome/Safari: "Agregar a pantalla de inicio" / "Instalar app") — layout responsive con sidebar en desktop y navegación inferior en mobile.

## Módulo de Configuración

Todo lo que la dueña necesita cambiar sin pedir ayuda está en **Configuración** (ícono de engranaje, arriba a la derecha en mobile / abajo del menú en desktop):
- Logo (pegando un link) y colores de marca (selector visual, se aplican al instante en toda la app).
- Nombre del negocio y email de notificaciones.
- IVA.
- Comisión de cada medio de pago.

Todo se guarda directo en la hoja **CONFIG** de Google Sheets — no requiere tocar código.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Query + React Router
- **Backend**: Google Apps Script (Web App)
- **Base de datos**: Google Sheets
- **Hosting**: Vercel

## Estructura

```
src/
  api/client.ts     → cliente HTTP para hablar con Apps Script (GET y POST)
  components/       → Layout, Navbar, StatCard, Spinner, UI base (Modal, Button, Input...)
  pages/            → Dashboard, Ventas, Productos, Caja, Inventario, Clientes, Cuotas
  hooks/            → useConfig (colores dinámicos), useEntities (React Query por entidad)
  types/            → tipos TypeScript de todas las entidades
  lib/format.ts     → formateo de moneda y fecha (es-AR)

public/             → logo.png, favicon, íconos PWA, manifest, service worker

apps-script/        → archivos .gs para pegar en Apps Script, en este orden
  00_SETUP.gs        → crea toda la base de datos en Sheets (ejecutar UNA VEZ)
  01_API_ROUTER.gs   → doGet/doPost + switch de acciones
  02_CONFIG.gs       → incluye updateConfig, usada por el módulo de Configuración
  03_PRODUCTOS.gs
  04_VENTAS.gs
  05_CAJA.gs
  06_INVENTARIO.gs
  07_CLIENTES.gs
  08_CUOTAS.gs
  09_KPIS.gs
```

## Paso 1 — Crear la base de datos en Google Sheets

1. Creá una planilla nueva en Google Sheets (vacía, el nombre no importa).
2. Extensions > Apps Script.
3. Creá un archivo `.gs` nuevo por cada archivo de la carpeta `apps-script/` (mismo nombre, mismo orden) y pegá el contenido correspondiente.
4. En `01_API_ROUTER.gs`, cambiá `API_KEY` por una clave segura (guardala, la vas a necesitar en el paso 3).
5. En el editor, seleccioná la función `crearBaseDeDatos` en el desplegable de funciones (arriba) y hacé clic en **Ejecutar**. La primera vez te va a pedir autorización — aceptá los permisos.
6. Esto crea las 7 hojas (CONFIG, PRODUCTOS, VENTAS, CAJA, INVENTARIO, CLIENTES, CUOTAS) con los encabezados correctos. Andá a la hoja **CONFIG** y completá el nombre del negocio, el email, el IVA y las comisiones reales de cada medio de pago.

## Paso 2 — Publicar el Web App

1. En Apps Script: **Implementar > Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Ejecutar como: **Yo**.
4. Quién tiene acceso: **Cualquier persona**.
5. Copiá la URL generada (termina en `/exec`) — es tu `VITE_API_URL`.

Cada vez que modifiques código en Apps Script tenés que hacer **Implementar > Gestionar implementaciones > editar (ícono lápiz) > Nueva versión**, o los cambios no se reflejan en la URL publicada.

## Paso 3 — Setup local del frontend

```bash
npm install
cp .env.example .env.local
# completar .env.local con la URL del paso 2 y la API_KEY del paso 1
npm run dev
```

`.env.local`:
```
VITE_API_URL=https://script.google.com/macros/s/TU_ID/exec
VITE_API_KEY=la_misma_clave_que_pusiste_en_01_API_ROUTER.gs
```

## Paso 4 — Deploy en Vercel

1. Subí este repo a GitHub.
2. En [vercel.com](https://vercel.com), **Add New > Project**, importá el repo. Vercel detecta Vite automáticamente (build command `npm run build`, output `dist`).
3. En **Settings > Environment Variables** agregá `VITE_API_URL` y `VITE_API_KEY` con los mismos valores del `.env.local`.
4. Deploy. A partir de ahí, cada push a `main` en GitHub dispara un deploy automático.

Importante: como esto es un proyecto Vite con build (no HTML estático), las variables `VITE_*` se inyectan en el momento del build. Si cambiás una variable de entorno en Vercel después del primer deploy, tenés que forzar un **Redeploy** (no alcanza con guardar la variable) para que tome efecto.
