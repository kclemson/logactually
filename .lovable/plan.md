Add one new entry to the top of `CHANGELOG_ENTRIES` in `src/pages/Changelog.tsx`, and update `LAST_UPDATED` to today's date (`Jul-29-26`).

Scope: only user-facing fixes that affect everyone. My Charts is admin/beta-only (`canUseCharts = isAdmin || isBeta`) so nothing about the bloodwork-pin double-render belongs in the changelog.

Proposed entry (no image):

```
{ date: "Jul-29", text: "Trends charts now hide exercises with very little data — you need at least 3 sessions (and a weight logged, for strength exercises) before a chart appears, and low-frequency exercises are hidden once you have others with much more history. Custom log charts also hide until there are at least 2 days of data. Also fixed 'All time' on the Trends page to include your full history instead of stopping partway through." },
```

No other files change.