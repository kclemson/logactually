

## Secure Password Reset Messaging

### The Problem
The current password reset flow messaging could potentially reveal whether an email account exists in the system. This is a security concern because attackers could use this to enumerate valid accounts.

**Current behavior:**
- Before: "Enter your email to receive a reset link"
- After success: "Password reset email sent! Check your inbox."
- On error: Shows the specific error message

### Solution
Update the messaging to be intentionally ambiguous about whether the account exists:

1. **Always show the same success message** - regardless of whether the email exists
2. **Use neutral language** that doesn't confirm or deny account existence
3. **Suppress Supabase error messages** that might leak account info (still log for debugging)

### Implementation

**File: `src/pages/Auth.tsx`**

#### 1. Update the CardDescription (line 172-177)
```tsx
// FROM:
<CardDescription>
  {resetSent 
    ? "Check your email for a reset link"
    : "Enter your email to receive a reset link"
  }
</CardDescription>

// TO:
<CardDescription>
  {resetSent 
    ? "Check your email"
    : "Reset your password"
  }
</CardDescription>
```

#### 2. Update the success message (lines 181-184)
```tsx
// FROM:
<div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
  Password reset email sent! Check your inbox.
</div>

// TO:
<div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
  If an account exists for this email, you'll receive a password reset link shortly.
</div>
```

#### 3. Update error handling (lines 48-62)
Always show success state to prevent enumeration, but log errors for debugging:

```tsx
const handlePasswordReset = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  setErrorMessage(null);
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?reset=true`,
  });
  
  // Log error for debugging but don't expose to user
  if (error) {
    console.error('Password reset error:', error.message);
  }
  
  // Always show "success" to prevent account enumeration
  setResetSent(true);
  setSubmitting(false);
};
```

### Changes Summary

| Location | Current | Updated |
|----------|---------|---------|
| Card subtitle (before) | "Enter your email to receive a reset link" | "Reset your password" |
| Card subtitle (after) | "Check your email for a reset link" | "Check your email" |
| Success message | "Password reset email sent! Check your inbox." | "If an account exists for this email, you'll receive a password reset link shortly." |
| Error handling | Shows error message | Always shows success (logs error for debugging) |

### Security Benefit
Attackers cannot use the password reset form to determine which email addresses have accounts, preventing account enumeration attacks.

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Update messaging in password reset flow (~4 small edits) |

