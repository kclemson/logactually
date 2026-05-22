## Fix
Extend `recentUsage` in `src/hooks/useCustomLogTypes.ts` to also include the latest `bloodwork_panels.created_at` per `log_type_id`.

Run both queries in parallel via `Promise.all`, then merge into the same `Record<string, string>` keeping the max `created_at` per type. This makes the "By Type" sort treat a fresh bloodwork upload as recent activity, bumping the Bloodwork type to the top just like medication/measurement entries.

Also invalidate `['custom-log-type-recency']` after a bloodwork upload so the list reorders without a refresh — verify `useBloodworkPanels` already invalidates this key (if not, add it).