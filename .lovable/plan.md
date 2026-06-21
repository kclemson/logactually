# Fix Custom tab flicker in bottom nav

## What's happening

The bottom nav shows the **Custom** tab only when `settings.showCustomLogs` is true. While the `user-settings` query is (re)loading, the hook falls back to `DEFAULT_SETTINGS`, where `showCustomLogs` is `false`. For a brief moment the nav renders the default (no Custom tab), then re-renders with the real settings once they resolve — so the tab disappears and reappears.

Confirmed by reproduction: on a cold render the nav first paints `Food · Exercise · Calendar · Trends · Settings` (no Custom, no Admin), then a beat later becomes `Food · Exercise · Custom · Calendar · Trends · Settings · Admin`. The **Admin** tab flashes for the same reason (its `isAdmin` query defaults to `false` while loading). On navigation, anything that makes these queries briefly fall back to defaults (e.g. the preview re-syncing) produces the same flash.

## The fix

Seed both queries with the user's **last-known value from localStorage** so the very first paint already reflects the real state — no flash to defaults. The network fetch still runs and overwrites with fresh data.

### `src/hooks/useUserSettings.ts`
- Add a tiny localStorage helper that reads/writes the resolved settings under a per-user key (e.g. `user-settings:<user.id>`).
- In the `useQuery`, add `placeholderData` that returns the persisted settings for the current user when present (kept distinct from `DEFAULT_SETTINGS`). `placeholderData` shows immediately while still fetching, so `staleTime: Infinity` and refetch behavior are unchanged.
- At the end of `queryFn`, after computing `merged`, write it to localStorage so the next load has an accurate seed. (Side-effect lives inside the fetch function, not a `useEffect`, per project conventions.)

### `src/hooks/useIsAdmin.ts`
- Same pattern: persist the boolean result under a per-user key (e.g. `is-admin:<user.id>`) and use `placeholderData` to seed it, so the Admin tab doesn't flash either.

## Notes
- Keys are namespaced by `user.id` so values never leak between accounts; a different/absent user simply gets no placeholder and falls back to current behavior.
- Frontend-only change. No backend, schema, or data changes.
- Verify by repeating the cold-load reproduction: the nav should paint with Custom (and Admin) present on the first frame, with no disappear/reappear.
