# Cricket360

A pnpm monorepo Cricket Academy Management mobile app built with Expo (React Native) and Supabase.

## Structure

```
artifacts/
  api-server/       Express 5 REST API with Drizzle ORM
  mobile/           Expo React Native app (main app)
  mockup-sandbox/   Vite + React + Tailwind + Shadcn UI components
lib/
  api-spec/         OpenAPI spec + Orval codegen config
  api-zod/          Generated Zod validation schemas (from codegen)
  api-client-react/ Generated React Query hooks (from codegen)
  db/               Drizzle ORM schema + PostgreSQL client
scripts/            Utility TypeScript scripts
```

## Key commands

| Command | Description |
|---|---|
| `pnpm install` | Install all dependencies |
| `pnpm --filter @workspace/mobile dev` | Start Expo dev server |
| `node scripts/serve-landing.js` | Serve landing page on port 5000 |
| `pnpm --filter @workspace/api-server dev` | Start API server (dev mode) |
| `pnpm --filter @workspace/api-spec codegen` | Regenerate API client + Zod schemas |

## Environment Variables

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key

## User preferences 
