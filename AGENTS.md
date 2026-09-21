# spacecraftSystem-frontend (admin) — AGENTS.md

> Proyecto independiente. Abrir opencode con cwd en `spacecraftSystem-frontend/`, nunca en `Projects/`.
> Stack: React 18.3 + Vite 5 + Axios. Panel admin de la flota + chat IA (Gemini/Claude).

## Cómo correr
- `npm.cmd install`, copiar `.env.example` a `.env`, `npm.cmd run dev` → `:5173` (puerto propio con `strictPort`, sin colisiones)
- Backends en local: flota `http://localhost:8080/api` + taller `http://localhost:8001/api`
- Sin `run-*.ps1` en este repo

## Contrato API
- `VITE_API_URL` (flota) + `VITE_TALLER_API_URL` (taller) por env. En prod no hay `.env.prod`:
  el código hace fallback a `spacecraftsystem.onrender.com/api` y
  `spacecraft-taller-backend.onrender.com/api`. No romper ese fallback.
- Cobros/aprobaciones pasan por el backend; el frontend nunca llama a BankIn directo.

## Deploy
- Proyecto `spacecraft-system`, sitio default (este repo, sin target):
  `npm.cmd run build` + `firebase.cmd deploy --project spacecraft-system --only hosting,functions`
  (functions = MCP + assistants admin/taller; sin `functions` los cambios de IA no suben)
- Ojo: `.firebaserc` no tiene `default`, solo alias `staging-spacecraf` — usar el flag `--project`.

## No hacer
- No hardcodear URLs (rompe el fallback de prod).
- No commitear `.env`, `node_modules/`, `dist/` (ver `.gitignore`).
- Aprobar presupuestos y reversar cobros: solo desde aquí (admin), no desde el taller ni la tienda.
