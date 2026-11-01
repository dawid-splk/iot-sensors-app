# Frontend: Serie pomiarowe

React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui (Chart.js, TanStack Query, react-hook-form + zod).

```bash
npm install
npm run dev      # http://localhost:5173, proxy /api -> http://localhost:8080
npm run build    # type check + production build to dist/
npm run lint
```

Typy API są w `src/api/schema.ts` (generowane z `docs/zai-api-26z.yaml`).
