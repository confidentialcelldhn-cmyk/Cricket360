---
name: Replit Vite plugin imports
description: Correct ESM import styles for @replit/vite-plugin-cartographer and @replit/vite-plugin-runtime-error-modal
---

## Rule

- `@replit/vite-plugin-cartographer` — use **named import**: `import { cartographer } from "@replit/vite-plugin-cartographer"`
- `@replit/vite-plugin-runtime-error-modal` — use **default import**: `import runtimeErrorModal from "@replit/vite-plugin-runtime-error-modal"`

**Why:** The cartographer package's `.mjs` bundle exposes named exports (`cartographer`, `version`) with no default. The runtime-error-modal bundle exposes only a default. Mixing them up causes a `SyntaxError: does not provide an export named 'default'` or named-export error at Vite config load time.

**How to apply:** Any time a Vite config in this workspace imports these two plugins, use the import styles above.
