

## GitHub Cleanup: Prepare Codebase for Open Source

### 1. Fix hardcoded Supabase project ID in ProtectedRoute.tsx

Replace the hardcoded storage key on line 11:
```ts
// Before
const storageKey = 'sb-enricsnosdrhmfvbjaei-auth-token';

// After
const storageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
```

### 2. Add `.env` to `.gitignore` and create `.env.example`

Add `.env` to the gitignore file so credentials aren't committed. Create a `.env.example` with placeholder values:

```
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

### 3. Update README with setup instructions

Expand the README to reference `.env.example` and include instructions for forking/self-hosting, including the Supabase schema setup.

### Items to consciously decide on (no code changes unless you want them)

- **Privacy page social links** (`Privacy.tsx`): Your Bluesky and Mastodon handles are embedded. Keep as-is if this is your public project.
- **index.html author meta tag**: Currently `kcloadletter.com`. Keep or remove.
- **OG image URL**: Hardcoded to `logactually.lovable.app`. This is fine since forks would replace it.
- **Demo credentials** (`demo-mode.ts`): Intentionally public and read-only -- no change needed.

### Files changed

1. `src/components/ProtectedRoute.tsx` -- replace hardcoded project ID
2. `.gitignore` -- add `.env`
3. `.env.example` -- new file with placeholder values
4. `README.md` -- update setup instructions to reference `.env.example`

