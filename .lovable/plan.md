

## Create Test User with 45+ Days of Food Data

### Overview
Create a dedicated test user account pre-populated with realistic food entry data spanning at least 45 days over the last 60 days. This will enable comprehensive testing of the Trends page charts (7-day, 30-day, and 90-day views) and other features.

---

### Approach

Since this project uses invite-code-protected signups, I'll need to:
1. Create the test user via Supabase Auth admin API (bypassing invite code)
2. Insert 45+ days of food entries with realistic, varied data

---

### Step 1: Create Test User

Create a new user in auth.users with known credentials:

| Field | Value |
|-------|-------|
| Email | `testuser@logactually.test` |
| Password | `testpassword123` |

The profile record will be auto-created by the existing `handle_new_user` trigger.

---

### Step 2: Generate Food Entry Data

Insert food entries for 45-50 random days within the last 60 days.

**Data characteristics:**
- 1-4 entries per day (realistic logging behavior)
- Varied meal types: breakfast, lunch, dinner, snacks
- Realistic calorie ranges: 150-800 per entry
- Proper macro distributions
- Some days with higher/lower totals to create interesting chart patterns

**Sample meals to include:**

| Meal Type | Example | Calories | Protein | Carbs | Fat |
|-----------|---------|----------|---------|-------|-----|
| Breakfast | Eggs & toast | 350 | 18 | 30 | 16 |
| Breakfast | Oatmeal with berries | 280 | 8 | 48 | 6 |
| Lunch | Chicken salad | 450 | 35 | 20 | 25 |
| Lunch | Turkey sandwich | 380 | 28 | 42 | 12 |
| Dinner | Salmon with rice | 550 | 40 | 45 | 22 |
| Dinner | Pasta with meat sauce | 620 | 28 | 72 | 24 |
| Snack | Apple + peanut butter | 280 | 7 | 35 | 14 |
| Snack | Greek yogurt | 150 | 15 | 12 | 4 |

---

### Step 3: Implementation

**Create a one-time edge function** `seed-test-user` that:
1. Creates the test user via Supabase admin auth
2. Generates 45-50 days of varied food entries
3. Returns success/failure status

The function will use the service role key to bypass RLS for inserting data.

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/seed-test-user/index.ts` | Create new edge function |
| `supabase/config.toml` | Add function configuration |

---

### Test User Credentials

After creation, you can log in with:
```text
Email: testuser@logactually.test
Password: testpassword123
```

---

### Data Distribution

```text
Days with data:     45-50 days
Date range:         Last 60 days
Entries per day:    1-4 (randomized)
Total entries:      ~100-150

Daily calorie range: 800-2400 (varies by entries)
Weekly patterns:     Some days skipped to simulate real usage
```

---

### After Running

The Trends page will show:
- **7-day view**: Recent data with daily variations
- **30-day view**: ~25 days of data with gaps
- **90-day view**: ~45 days clustered in the last 60 days

This provides realistic test scenarios for chart rendering, averages calculation, and empty-day handling.

