

## Remove Logins and L2day Columns from Admin User Table

Remove the "Logins" and "L2day" (logins today) columns from the admin users table since "Last activity" already covers that need.

### Technical Details

In `src/pages/Admin.tsx`:

1. Remove the two `<TableHead>` elements for "Logins" and "L2day"
2. Remove the two corresponding `<TableCell>` elements that display `login_count` and `logins_today`
3. Remove any mobile-specific hiding classes (`hidden sm:table-cell`) that were applied to these columns

No other files need changes. The `login_count` and `logins_today` fields in the RPC response can remain -- they're harmless and may be used elsewhere.

