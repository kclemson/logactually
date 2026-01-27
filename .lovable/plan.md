

## Remove seed-test-user Edge Function

### Overview

Clean up the `seed-test-user` edge function now that the test account has been created and populated. The test user data is already in the database, so this seeding function is no longer needed.

### Changes

| File | Action |
|------|--------|
| `supabase/functions/seed-test-user/index.ts` | Delete |
| `supabase/config.toml` | Remove `[functions.seed-test-user]` section |

### Implementation Details

#### 1. Delete Edge Function

Remove the entire `supabase/functions/seed-test-user/` directory.

#### 2. Update Config

Remove these lines from `supabase/config.toml`:

```toml
[functions.seed-test-user]
verify_jwt = false
```

#### 3. Delete Deployed Function

Use the edge function deletion tool to remove the deployed function from the backend.

### Memory Update

The `testing/test-user-seed-data` memory note will remain valid since it documents the test account credentials and data characteristics, which are still useful for future reference.

