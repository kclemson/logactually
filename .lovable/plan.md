

## Rebrand Sign-In Page

### Overview
Make the sign-in page more engaging and on-brand by updating the visual hierarchy and using the OpenGraph tagline.

---

### Changes to `src/pages/Auth.tsx`

#### 1. Make icon significantly larger
- Before: `w-16 h-16` (64px)
- After: `w-24 h-24` (96px) with more bottom margin

#### 2. Remove "Welcome Back" title
- Delete the conditional `CardTitle` that shows "Welcome Back" / "Create Account" / "You're Invited!"

#### 3. Add app name prominently below icon
- Display "Log Actually" using `APP_NAME` constant
- Style with `text-2xl font-bold`

#### 4. Use exact OpenGraph tagline
- **"Braindump what you ate, and AI handles the nutrition math"**
- Use `APP_DESCRIPTION` constant for consistency

---

### Updated Visual Structure

```text
Before:                              After:
+----------------------+             +----------------------+
|     [icon 64px]      |             |     [icon 96px]      |
|    Welcome Back      |             |     Log Actually     |
| Sign in to continue  |             | Braindump what you   |
|  tracking your...    |             | ate, and AI handles  |
+----------------------+             | the nutrition math   |
                                     +----------------------+
```

---

### Code Changes

```tsx
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';

<CardHeader className="text-center">
  <img 
    src="/favicon.png" 
    alt={APP_NAME} 
    className="w-24 h-24 mx-auto mb-4"
  />
  <CardTitle className="text-2xl font-bold">
    {APP_NAME}
  </CardTitle>
  <CardDescription>
    {APP_DESCRIPTION}
  </CardDescription>
</CardHeader>
```

---

### All Auth Views

| View | Title | Description |
|------|-------|-------------|
| **Sign In** | Log Actually | Braindump what you ate, and AI handles the nutrition math |
| **Sign Up** | Log Actually | Braindump what you ate, and AI handles the nutrition math |
| **Sign Up (invited)** | Log Actually | Braindump what you ate, and AI handles the nutrition math |
| **Password Reset** | Log Actually | Enter your email to receive a reset link |
| **Set New Password** | Log Actually | Enter your new password below |

---

### Files Changed

| File | Action |
|------|--------|
| `src/pages/Auth.tsx` | Update icon size, remove old title, add APP_NAME/APP_DESCRIPTION |

