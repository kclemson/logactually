

## Add Account Deletion Feature

Add a secure account deletion capability to the Settings page with a low-visual-weight hyperlink trigger and a type-to-confirm dialog requiring users to type "delete" before proceeding.

---

### Architecture Overview

Since `supabase.auth.admin.deleteUser()` requires the service role key (which must never be exposed to the client), we need an edge function to handle the deletion securely.

```text
Settings Page
     │
     ▼
"Delete account" hyperlink
     │
     ▼
DeleteAccountDialog
     │ (requires typing "delete")
     ▼
Edge Function: delete-account
     │ (validates JWT, uses service role)
     ▼
supabase.auth.admin.deleteUser()
     │
     ▼
Sign out and redirect to /auth
```

---

### Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/delete-account/index.ts` | New edge function to delete user |
| `supabase/config.toml` | Add config for delete-account function |
| `src/components/DeleteAccountDialog.tsx` | New dialog with type-to-confirm |
| `src/pages/Settings.tsx` | Add hyperlink trigger and dialog |

---

### 1. Edge Function: `delete-account`

Securely deletes the authenticated user:

```typescript
// Validates JWT to get user ID
const { data: claimsData } = await supabase.auth.getClaims(token);
const userId = claimsData.claims.sub;

// Use service role client to delete user
const adminClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const { error } = await adminClient.auth.admin.deleteUser(userId);
```

Security measures:
- Validates user JWT before deletion
- Only deletes the authenticated user (cannot delete others)
- Uses service role key server-side only

---

### 2. DeleteAccountDialog Component

A confirmation dialog that:
- Explains the consequences (permanent, all data deleted)
- Requires typing "delete" to enable the delete button
- Shows loading state during deletion
- Handles errors gracefully

```typescript
interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

UI layout:
```text
┌────────────────────────────────────────┐
│ Delete Account                      X  │
├────────────────────────────────────────┤
│ This will permanently delete your      │
│ account and all associated data.       │
│ This action cannot be undone.          │
│                                        │
│ Type "delete" to confirm:              │
│ [................]                     │
│                                        │
│ [error message if any]                 │
│                                        │
│        [Cancel]  [Delete Account]      │
│                   (disabled until      │
│                    "delete" typed)     │
└────────────────────────────────────────┘
```

---

### 3. Settings Page Updates

Add a subtle hyperlink-style trigger in the Account section:

```tsx
<CollapsibleSection title="Account" icon={User}>
  <div className="space-y-3">
    {/* Email display */}
    {/* Change Password button */}
    
    {/* Subtle delete account link */}
    <button
      onClick={() => setDeleteAccountOpen(true)}
      className="text-sm text-muted-foreground hover:text-destructive hover:underline"
    >
      Delete account
    </button>
  </div>
</CollapsibleSection>
```

Visual characteristics:
- Small text (`text-sm`)
- Muted color (`text-muted-foreground`)
- No button styling - just text
- Subtle hover effect (turns red, underlines)

---

### Technical Details

**Edge function authentication pattern** (same as analyze-food):
- Extracts JWT from Authorization header
- Validates with `supabase.auth.getClaims()`
- Gets user ID from claims

**After successful deletion:**
1. Edge function returns success
2. Client calls `signOut()` from useAuth
3. Redirect to /auth page

**Cascade behavior:**
- Supabase will cascade delete user data based on foreign key constraints
- RLS policies ensure user only owns their own data

---

### Security Considerations

- Service role key is only used server-side in edge function
- User can only delete their own account (validated by JWT)
- Type-to-confirm prevents accidental deletion
- No recovery mechanism (intentionally permanent)

