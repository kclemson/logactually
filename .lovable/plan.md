

## Set Demo Account Daily Calorie Target to 2000

### What Changes

Update the demo account's profile settings in the database to include a `dailyCalorieTarget` of 2000, so the calorie indicator dots appear in the demo account on both History and Food Log pages.

### Approach

Run a SQL migration that updates the `settings` JSONB column on the demo account's profile row, merging in `{"dailyCalorieTarget": 2000}` while preserving any existing settings.

### Technical Details

| Step | Detail |
|------|--------|
| SQL Migration | `UPDATE profiles SET settings = COALESCE(settings, '{}'::jsonb) \|\| '{"dailyCalorieTarget": 2000}'::jsonb WHERE id = (SELECT id FROM auth.users WHERE email = 'demo@logactually.com');` |

Single database change, no code modifications needed.

