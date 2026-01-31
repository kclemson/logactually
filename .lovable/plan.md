

## Standardize CORS Headers Across All Edge Functions

### Problem

Six out of eight edge functions are missing the `x-supabase-client-*` headers that the Supabase JS client sends with every request. When a browser makes a CORS preflight (`OPTIONS`) request and these headers aren't in `Access-Control-Allow-Headers`, the browser **blocks the actual request** before it even reaches your server.

This is the most likely cause of the "failed to send a request to the edge function" errors reported by User #17.

### Current State

| Function | Has Full Headers? |
|----------|-------------------|
| analyze-weights | Yes |
| delete-account | Yes |
| analyze-food | **No** |
| lookup-upc | **No** |
| validate-invite | **No** |
| create-demo-user | **No** |
| populate-demo-data | **No** |
| log-scanner-debug | **No** |
| run-prompt-tests | **No** |

### Solution

Update all edge functions to use the standardized CORS headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

### Files to Update

| File | Change |
|------|--------|
| `supabase/functions/analyze-food/index.ts` | Add missing `x-supabase-client-*` headers |
| `supabase/functions/lookup-upc/index.ts` | Add missing `x-supabase-client-*` headers |
| `supabase/functions/validate-invite/index.ts` | Add missing `x-supabase-client-*` headers |
| `supabase/functions/create-demo-user/index.ts` | Add missing `x-supabase-client-*` headers |
| `supabase/functions/populate-demo-data/index.ts` | Add missing `x-supabase-client-*` headers |
| `supabase/functions/log-scanner-debug/index.ts` | Add missing `x-supabase-client-*` headers |
| `supabase/functions/run-prompt-tests/index.ts` | Add missing `x-supabase-client-*` headers |

### Technical Details

**Why this matters:**

1. The Supabase JS client automatically sends platform/runtime headers with every request
2. Browser CORS preflight (`OPTIONS`) checks if these headers are allowed
3. If `Access-Control-Allow-Headers` doesn't include them, the browser blocks the request
4. The client receives a network-level error: "Failed to send a request to the edge function"

**Why some functions worked despite missing headers:**

- Network conditions, browser versions, and exact client library versions affect which headers are sent
- Some requests may have succeeded by chance when fewer headers were included
- The inconsistency makes debugging difficult

### Risk Assessment

| Risk | Level | Notes |
|------|-------|-------|
| Breaking changes | None | Adding allowed headers is purely additive |
| Deployment issues | Very Low | Simple string change, no logic changes |
| Security implications | None | These are informational headers, not credentials |

**Overall Risk: Very Low** - This is a simple, additive fix that standardizes behavior across all functions.

