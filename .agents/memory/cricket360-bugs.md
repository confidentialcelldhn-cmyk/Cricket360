---
name: Cricket360 bug patterns
description: Architectural quirks and non-obvious decisions found during the initial bug-fix session
---

## Coach-batch linking is bidirectional but only one side was being queried
`getCoachBatches` was only filtering via `batch.coachIds`; coaches also carry `batchIds`. Fixed by checking both directions.

**Why:** Two sources of truth (`coaches.batch_ids` and `batches.coach_ids`) can diverge in Supabase.

**How to apply:** When adding a coach to a batch, update BOTH the coach record's `batch_ids` AND the batch record's `coach_ids`.

## Password change doesn't persist across Supabase re-login
`changePassword` updated Supabase Auth (`supabase.auth.updateUser`) but NOT the `users` table. Login reads from `users` table via `loginViaUsersTable`. Fixed by also calling `updateUserRecord` in `supabaseService.ts`.

**Why:** The app uses a custom `users` table for auth (not Supabase Auth directly), so both places must stay in sync.

## Date parsing: getAge() NaN
`dateOfBirth` is stored as ISO `YYYY-MM-DD` internally but may arrive as display format `DD/MM/YYYY`. `new Date("DD/MM/YYYY")` returns `Invalid Date`. Shared `getAge()` and `parseDate()` utilities now handle both formats from `utils/dateUtils.ts`.

## uploadQrPhoto was missing from DataContext
`settings.tsx` destructures `uploadQrPhoto` from `useData()` but the function was never implemented or added to the context. This caused a runtime crash whenever the Settings screen was interacted with (the source of the "error page on deactivate" — ErrorBoundary caught it from the still-mounted Settings screen).

## supabaseService imports should be merged
`AuthContext.tsx` had two separate imports from `@/lib/supabaseService`. Keep them as one `import { a, b } from "..."` line.
