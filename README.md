# M.0.m IDE (Fullstack)

This project is now a **fullstack app**:

- **Frontend**: React + Vite IDE interface (responsive layout for desktop + mobile)
- **Backend**: Node.js HTTP API for chat + health endpoints
- **AI Mode**: local `ultra-think` response mode for faster, structured coding guidance

## Run fullstack locally

```bash
npm install
npm run dev:fullstack
```

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8787/api`

## Scripts

- `npm run dev` — frontend only
- `npm run dev:server` — backend only
- `npm run dev:fullstack` — frontend + backend
- `npm run build` — frontend build
- `npm run test` — unit tests

## Notes

- Chat requests now hit `POST /api/chat`.
- Health check is available at `GET /api/health`.


## Enterprise notes

Lihat detail readiness, kekurangan, dan roadmap enterprise di `ENTERPRISE_WEB_GAP_ANALYSIS.md`.


## Provider configuration

Default provider endpoint is OpenAI-compatible:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional)
- `OPENAI_BASE_URL` (optional, default `https://api.openai.com/v1`)

For OpenRouter, set:

- `OPENAI_API_KEY=<OPENROUTER_API_KEY>`
- `OPENAI_BASE_URL=https://openrouter.ai/api/v1`
- `OPENROUTER_SITE_URL` (optional but recommended)
- `OPENROUTER_APP_NAME` (optional but recommended)
