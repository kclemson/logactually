

## Add Privacy & Security Page

### Overview

Create a new Privacy & Security page with approachable, transparent copy that communicates the solo-developer nature of the project, modern security practices, and technical details for savvy users. Add links from the Auth page footer, Settings account section, and Help page footer.

---

### New Files

#### `src/pages/Privacy.tsx`

Create a new page matching the Help page's minimal aesthetic:

- Close button in top-right (navigates back)
- Shield icon in header
- Clean sections with muted text and keyword highlights
- Mobile-friendly layout
- `PRIVACY_CONTENT` constant for easy copy editing

---

### File Changes

#### `src/App.tsx`

Add public route for `/privacy`:

```tsx
import Privacy from "./pages/Privacy";

// Add alongside other routes (outside ProtectedRoute):
<Route path="/privacy" element={<Privacy />} />
```

#### `src/pages/Auth.tsx`

Add footer link below the auth form

#### `src/pages/Settings.tsx`

Add link in the Account section near "Delete account"

#### `src/pages/Help.tsx`

Add link in the footer alongside the "made by" credit

---

### Link Placement Summary

| Location | Placement | Visibility |
|----------|-----------|------------|
| Auth page | Footer below form | Pre-login |
| Settings > Account | Near "Delete account" | Logged in |
| Help page | Footer section | Logged in |

---

### Revised Copy

**The Short Version**

Your data is yours. It's not sold, there are no ads, and no tracking pixels. This is a passion project built by one person, currently free to use.

---

**What Data Is Collected**

- **Email address** — for login
- **Food and exercise entries** — what you choose to log
- **Saved meals and routines** — for quick re-logging
- **Preferences** — like theme and weight units

---

**What Data Is *Not* Collected**

- No third-party analytics
- No tracking cookies or pixels
- No selling or sharing data with anyone

---

**How AI Processing Works**

When you log food or exercise, your text is sent to an AI model to provide nutritional or exercise information. Only the text you enter is sent — no user identifiers, account info, or other context is included. The AI knows the request came from this app, but nothing more specific than that.

---

**For the Technically Curious**

If you're wondering about the security implementation:

- **Passwords** are hashed using bcrypt — never stored in plaintext
- **Data isolation** is enforced through Row-Level Security (RLS) policies — authenticated users can only access their own data
- **Sessions** use JWT tokens with secure, time-limited expiry
- **All traffic** is encrypted via HTTPS/TLS
- **Infrastructure** runs on SOC2 Type II compliant hosting

---

**Developer Access**

As a solo project, the developer has database access for debugging and support purposes. However, there is no routine review or mining of individual user data — logs are only accessed when investigating specific technical issues or responding to support requests.

---

**Your Data, Your Control**

- Export your data anytime as CSV (Settings → Export)
- Delete your account permanently (Settings → Account)
- Questions or concerns? Drop a note in the Help section

*Last updated: January 2026*

---

### Technical Implementation

The page will follow the same pattern as `Help.tsx`:

- `PRIVACY_CONTENT` constant at the top for easy copy editing
- `highlightText` helper for keyword emphasis
- Lucide icons: `Shield` (header), `Database`, `Bot`, `Code`, `UserCheck`, `Eye`
- `X` close button navigating to `/`
- Collapsible or distinct styling for the "Technically Curious" section

