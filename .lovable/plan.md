

## Free Demo Mode with RLS-Enforced Read-Only Accounts

### Overview

Add a "Try Demo" button on the login screen that signs users into a pre-populated demo account. The account has an `is_read_only` flag that is enforced at both the database level (bulletproof) and UI level (friendly experience). Demo users can browse all features, experience the inline editing UX, but cannot persist any changes.

**This plan covers the infrastructure and UI only. Demo data seeding will be planned separately.**

---

### Architecture Summary

```text
+------------------+     +------------------+     +------------------+
|   Auth Page      |     |   Database       |     |   UI Layer       |
|                  |     |                  |     |                  |
| [Try Demo] btn   |---->| profiles.        |---->| useReadOnly()    |
| Signs in with    |     | is_read_only     |     | hook checks flag |
| public creds     |     | = true           |     |                  |
+------------------+     +------------------+     +------------------+
                                |
                                v
                    +------------------------+
                    |  RLS Policies          |
                    |                        |
                    | INSERT/UPDATE/DELETE   |
                    | blocked when           |
                    | is_read_only = true    |
                    +------------------------+
```

**Two layers of protection:**
1. **Database (RLS)**: Even if someone bypasses the UI, database refuses writes
2. **UI**: Shows friendly overlay instead of cryptic error messages

---

### Phase 1: Database Changes (This Plan)

#### 1. Add `is_read_only` Column to Profiles

```sql
ALTER TABLE profiles 
ADD COLUMN is_read_only BOOLEAN NOT NULL DEFAULT false;
```

#### 2. Create Helper Function for RLS

A security definer function prevents recursive RLS issues and centralizes the check:

```sql
CREATE OR REPLACE FUNCTION public.is_read_only_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_read_only FROM profiles WHERE id = _user_id),
    false
  )
$$;
```

#### 3. Update RLS Policies (13 Total)

Modify all INSERT, UPDATE, and DELETE policies on user-writable tables:

| Table | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|
| `food_entries` | Update | Update | Update |
| `weight_sets` | Update | Update | Update |
| `saved_meals` | Update | Update | Update |
| `saved_routines` | Update | Update | Update |
| `feedback` | Update | N/A | N/A |

**Policy update pattern:**

```sql
-- Before
WITH CHECK (auth.uid() = user_id)

-- After
WITH CHECK (
  auth.uid() = user_id 
  AND NOT is_read_only_user(auth.uid())
)
```

#### 4. Update Admin Stats Functions

Add `include_read_only` parameter (defaults to `false`) and include telemetry:

**get_user_stats additions:**
- New parameter: `include_read_only boolean DEFAULT false`
- New output field: `is_read_only` per user
- Filter: `WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)`

**get_usage_stats additions:**
- New parameter: `include_read_only boolean DEFAULT false`  
- New output field: `read_only_users` (always included for telemetry)
- Same filter pattern on user counts

---

### Phase 2: Frontend Changes (This Plan)

#### New Files

| File | Purpose |
|------|---------|
| `src/lib/demo-mode.ts` | Demo credentials constants |
| `src/hooks/useReadOnly.ts` | Hook to fetch/manage read-only state from profile |
| `src/contexts/ReadOnlyContext.tsx` | Context provider for app-wide access |
| `src/components/ReadOnlyOverlay.tsx` | Modal for welcome message + blocked action notices |
| `src/components/DemoBanner.tsx` | Persistent amber banner at top of screen |

#### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Wrap with ReadOnlyProvider |
| `src/pages/Auth.tsx` | Add "Try Demo" button below sign-in form |
| `src/components/Layout.tsx` | Render DemoBanner and ReadOnlyOverlay conditionally |
| `src/components/FoodItemsTable.tsx` | Intercept Enter key saves, show overlay instead |
| `src/components/WeightItemsTable.tsx` | Same interception pattern |
| `src/components/LogInput.tsx` | Block submit, show overlay |
| `src/pages/Settings.tsx` | Hide Change Password and Delete Account for read-only users |

---

### Phase 3: Demo Account Setup (This Plan - Minimal)

1. **Create demo user** with public credentials:
   - Email: `demo@logactually.com`
   - Password: `demodemo`

2. **Set read-only flag** on the demo account:
   ```sql
   UPDATE profiles SET is_read_only = true WHERE id = '<demo-user-uuid>';
   ```

**Note:** Demo data seeding will be planned separately to ensure realistic, representative sample data.

---

### User Experience Flow

**Demo Login:**
1. User clicks "Try Demo" on Auth page
2. Auto-signs into demo account
3. Redirected to Food Log
4. Welcome overlay appears briefly
5. Persistent amber banner shows at top

**Attempting an Edit:**
1. User taps a cell → enters edit mode normally
2. User types new value and presses Enter
3. Overlay appears: "This demo is read-only"
4. Edit cancelled, cell reverts to original
5. Options: "Create Free Account" or "Keep Browsing"

**Settings Page (Read-Only User):**
- Email displayed but no password change option
- No delete account option
- Saved Meals/Routines visible but not editable
- Export buttons disabled with explanation

---

### Technical Details

#### ReadOnlyContext Implementation

```typescript
// src/contexts/ReadOnlyContext.tsx
interface ReadOnlyContextType {
  isReadOnly: boolean;
  showOverlay: boolean;
  overlayMode: 'welcome' | 'blocked';
  triggerOverlay: () => void;
  dismissOverlay: () => void;
}
```

The context fetches `is_read_only` from the profiles table on user change and provides:
- `isReadOnly`: Whether current user has the flag set
- `triggerOverlay()`: Called when user attempts a blocked action
- Welcome overlay shown once on first demo login

#### Interception Points in Table Components

In `FoodItemsTable.tsx` (lines ~97-134) and `WeightItemsTable.tsx` (lines ~76-93):

```typescript
const handleKeyDown = (e, index, field) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    
    // NEW: Check read-only before saving
    if (isReadOnly) {
      triggerOverlay();
      setEditingCell(null);
      (e.target as HTMLElement).blur();
      return;
    }
    
    // Existing save logic...
  }
};
```

Similar pattern for delete button clicks.

#### LogInput Gating

In `LogInput.tsx` (line ~183):

```typescript
const handleSubmit = async () => {
  if (isReadOnly) {
    triggerOverlay();
    return;
  }
  // Existing submit logic...
};
```

---

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | Add column, helper function, update 13 RLS policies, update stats functions |
| `src/lib/demo-mode.ts` | Create | Demo credentials constants |
| `src/hooks/useReadOnly.ts` | Create | Hook to fetch read-only state |
| `src/contexts/ReadOnlyContext.tsx` | Create | Context provider |
| `src/components/ReadOnlyOverlay.tsx` | Create | Modal component |
| `src/components/DemoBanner.tsx` | Create | Persistent banner |
| `src/App.tsx` | Modify | Add ReadOnlyProvider wrapper |
| `src/pages/Auth.tsx` | Modify | Add "Try Demo" button |
| `src/components/Layout.tsx` | Modify | Render banner + overlay |
| `src/components/FoodItemsTable.tsx` | Modify | Intercept saves |
| `src/components/WeightItemsTable.tsx` | Modify | Intercept saves |
| `src/components/LogInput.tsx` | Modify | Block submit |
| `src/pages/Settings.tsx` | Modify | Hide sensitive sections |

---

### Implementation Sequence

1. Database migration: Add column, helper function, update 13 RLS policies
2. Database migration: Update get_user_stats and get_usage_stats with new parameter
3. Create demo user account (empty for now)
4. Create new files: demo-mode.ts, useReadOnly.ts, ReadOnlyContext.tsx
5. Create UI components: ReadOnlyOverlay.tsx, DemoBanner.tsx
6. Modify App.tsx: Add provider wrapper
7. Modify Auth.tsx: Add "Try Demo" button
8. Modify Layout.tsx: Render banner and overlay
9. Modify table components: Block saves in FoodItemsTable, WeightItemsTable
10. Modify LogInput.tsx: Block submit
11. Modify Settings.tsx: Hide/disable restricted sections
12. Test end-to-end: Verify RLS blocks writes, UI shows friendly messages

---

### Security Considerations

- **Password is public**: Intentional and safe because the account cannot modify any data
- **RLS is the source of truth**: Even if UI checks are bypassed, database refuses writes
- **No admin privileges**: Demo account has no special roles
- **Data isolation**: Demo data is isolated to that account
- **Stats flexibility**: Admins can choose whether to include/exclude read-only users

---

### Deferred: Demo Data Seeding

Will be planned separately to carefully design:
- Realistic food entries spanning ~90 days
- Varied meal patterns (breakfast/lunch/dinner, weekday/weekend)
- Exercise entries with progressive overload patterns
- 3-5 saved meals representing common user patterns
- 2-3 saved routines

