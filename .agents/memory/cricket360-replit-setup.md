---
name: Cricket360 Replit workflow setup
description: Two-workflow setup for the Cricket360 app — landing page on port 5000 and Expo metro on port 8080
---

## Two workflows required

1. **Start application** — `node scripts/serve-landing.js` on port 5000 (webview)
2. **Expo Dev Server** — `PORT=8080 pnpm --filter @workspace/mobile dev` on port 8080 (console)

**Why:** The landing page serves the QR code. The Expo metro bundler serves the actual JS bundle. Both must run together for Expo Go on a phone to work.

## Expo domain env vars

- `REPLIT_EXPO_DEV_DOMAIN` — special Replit proxy domain for Expo Go connections (e.g. `xxx.expo.sisko.replit.dev`). Use this as EXPS_URL in the landing page template — NOT the request host.
- `REPLIT_DEV_DOMAIN` — the main dev domain (port 5000 webview).

**How to apply:** `scripts/serve-landing.js` reads `REPLIT_EXPO_DEV_DOMAIN` at startup and injects it as the QR code deep-link URL (`exps://...`).

## Package versions (expo@54)

These three deps must match expo@54 expectations (NOT their npm latest):
- `expo-file-system`: `~19.0.23`
- `expo-print`: `~15.0.8`
- `expo-sharing`: `~14.0.8`

**Why:** Expo 54 ships with its own peer version requirements. The original package.json had `^56.x` versions which triggered version mismatch warnings on every start.

## Supabase secrets

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Both stored as Replit secrets (shared environment). The app auto-enables Supabase mode when these are set.
