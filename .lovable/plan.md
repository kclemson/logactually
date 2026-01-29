

## Add Help Page with Feedback Form

### Overview
Create a Help page accessible from the header, move Sign Out to Settings, and add a feedback system with database storage viewable on the Admin page.

---

### Changes Required

#### 1. Database Table for Feedback
Create a `feedback` table to store user submissions:

```sql
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Users can insert their own feedback
create policy "Users can insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- Admins can view all feedback
create policy "Admins can view all feedback"
  on public.feedback for select
  using (has_role(auth.uid(), 'admin'));
```

#### 2. Header Changes
**File:** `src/components/Header.tsx`

- Remove sign out button and related state
- Add "Help" link with `HelpCircle` icon pointing to `/help`

```tsx
// Before: Sign out button
// After: Help link
<Link to="/help" className="text-muted-foreground hover:text-foreground min-h-[44px] px-2 -mr-2 flex items-center gap-1">
  <HelpCircle className="h-4 w-4" />
  <span>Help</span>
</Link>
```

#### 3. Settings Page - Add Sign Out
**File:** `src/pages/Settings.tsx`

Add Sign Out button to the Account section (after Change Password):

```tsx
// Inside Account CollapsibleSection, after Change Password button
<Button 
  variant="outline" 
  size="sm" 
  onClick={handleSignOut}
  disabled={isSigningOut}
>
  {isSigningOut ? 'Signing out...' : 'Sign Out'}
</Button>
```

#### 4. New Help Page
**File:** `src/pages/Help.tsx`

Compact page with:
- 4 bullet points covering key features
- Simple textarea form for feedback
- Submit button that saves to database

```text
+----------------------------------+
|  Tips                            |
|                                  |
|  • Log food & weights now,       |
|    more tracking types coming    |
|                                  |
|  • Braindump your inputs -       |
|    AI handles the formatting     |
|                                  |
|  • Editing calories auto-scales  |
|    protein, carbs & fat          |
|                                  |
|  Feedback                        |
|  +----------------------------+  |
|  | [textarea]                 |  |
|  +----------------------------+  |
|  [Send Feedback]                 |
+----------------------------------+
```

#### 5. Add Route
**File:** `src/App.tsx`

```tsx
import Help from "./pages/Help";
// ...
<Route path="/help" element={<Help />} />
```

#### 6. Admin Page - Feedback Section
**File:** `src/pages/Admin.tsx`

Add a collapsible section at the bottom showing recent feedback:

```tsx
{/* Feedback section */}
{feedback && feedback.length > 0 && (
  <div className="space-y-1">
    <p className="font-medium text-xs text-muted-foreground">Recent Feedback</p>
    {feedback.map((f) => (
      <div key={f.id} className="text-xs border-b border-border/50 py-1">
        <span className="text-muted-foreground">
          {USER_NAMES[f.user_number] ?? `User ${f.user_number}`} • {format(...)}
        </span>
        <p>{f.message}</p>
      </div>
    ))}
  </div>
)}
```

#### 7. New Hook for Feedback
**File:** `src/hooks/useFeedback.ts`

- `useSubmitFeedback` - mutation to insert feedback
- `useAdminFeedback` - query for admin to view all feedback (joins with profiles for user_number)

---

### Files to Create/Modify
1. **Database migration** - Create `feedback` table with RLS
2. **Create:** `src/pages/Help.tsx` - New help page with form
3. **Create:** `src/hooks/useFeedback.ts` - Feedback hooks
4. **Modify:** `src/components/Header.tsx` - Replace sign out with help link
5. **Modify:** `src/pages/Settings.tsx` - Add sign out button to Account section
6. **Modify:** `src/pages/Admin.tsx` - Add feedback display section
7. **Modify:** `src/App.tsx` - Add help route

