

## Remove Invite Code Requirement

### Overview
Remove the invite code requirement from the signup flow, allowing anyone to create an account with just email and password.

---

### Changes

**File:** `src/pages/Auth.tsx`

1. **Remove invite-related state variables** (lines 14, 23):
   - Remove `inviteFromUrl` (line 14)
   - Remove `inviteCode` state (line 23)
   - Change `isSignUp` default from `!!inviteFromUrl` to `false` (line 17)

2. **Remove invite validation logic** (lines 83-100):
   - Remove the entire block that validates the invite code via the edge function

3. **Remove invite code input field** (lines 295-306):
   - Remove the entire `{isSignUp && (...)}` block containing the invite code input

---

### Code After Changes

**Simplified state (lines 17-26):**
```tsx
const [isSignUp, setIsSignUp] = useState(false);
const [isResetMode, setIsResetMode] = useState(false);
const [isUpdatingPassword, setIsUpdatingPassword] = useState(isResetCallback);
const [resetSent, setResetSent] = useState(false);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [submitting, setSubmitting] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);
```

**Simplified handleSubmit (lines 78-111):**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setErrorMessage(null);

  const { error } = isSignUp 
    ? await signUp(email, password)
    : await signIn(email, password);

  if (error) {
    setErrorMessage(error.message);
  }

  setSubmitting(false);
};
```

**Form without invite code field** - Remove lines 295-306 entirely (the invite code input block)

---

### Optional Cleanup

The `validate-invite` edge function at `supabase/functions/validate-invite/index.ts` will no longer be needed. You can optionally delete it later, but leaving it won't cause any issues since it simply won't be called.

---

### Files to Modify
1. `src/pages/Auth.tsx` - Remove invite-related state, validation logic, and input field

