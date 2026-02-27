

## Plan: Remove unused validate-invite edge function

**What's changing**: The `validate-invite` edge function is dead code from the app's early invite-gated signup. We'll delete it entirely and clean up the security finding.

### Steps

1. **Delete** `supabase/functions/validate-invite/index.ts`
2. **Remove** the `[functions.validate-invite]` block from `supabase/config.toml`
3. **Delete** the deployed edge function from the backend
4. **Delete** the `validate_invite_open` security finding

