# spacecraftSystem-frontend

Panel de administración (React + Vite) para la flota: listado, alta/edición/borrado de naves,
configurar museo y teatro, ver ventas, dashboard, enviar naves al taller y gestionar el lado
"dueño de flota" de una reparación (ver estado, aprobar/rechazar presupuesto, recibir la nave).
Incluye un asistente de chat con IA (Gemini o Claude, configurable) sobre los datos de la flota.

## Stack
React 18 + Vite 5, Axios, CSS propio (tema espacial), Firebase Hosting.

## Cómo correr en local
```bash
npm install
cp .env.example .env   # ajustar URLs si los backends no corren en localhost
npm run dev
```
Abre `http://localhost:5173`. Necesita `spacecraftSystem` (8080) corriendo, y
`spacecraft-taller-backend` (8001) para la parte de taller.

## Variables de entorno
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL de `spacecraftSystem` |
| `VITE_TALLER_API_URL` | URL de `spacecraft-taller-backend` |

El asistente de chat corre en una Cloud Function propia (`functions/`), con su propia clave de
API — no vive en el frontend ni en este README.

## Build y deploy
```bash
npm run build
firebase deploy --only hosting
```

## Repos relacionados
Backend: [spacecraftSystem](../spacecraftSystem). Comparte proyecto de Firebase (hosting
multi-site) con [spacecraft-tickets-frontend](../spacecraft-tickets-frontend).
