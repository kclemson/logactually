

## Privacy Page Refinements for Technical Credibility

### Overview

Update the Privacy page to be more precise about claims, add sources where available, and honestly address the AI-assisted development approach without inviting scrutiny or overpromising.

### Content Changes

#### 1. Rename "Developer Access" → "How This Was Built"

Update the section to honestly describe the development approach while emphasizing that security-critical mechanisms are infrastructure-level:

**Current text:**
> "Technically, I have the ability to see what's logged in the database — but the only reason I ever look at it is if I need to for investigating a bug, and if so then I use my own data (since I use this app daily)."

**New text:**
> "This app was built using AI-assisted development tools. The security mechanisms described above — password hashing, data isolation, session management — are handled at the infrastructure level, not custom code. I can see your email address in the database, but not your password (it's hashed). If I ever need to debug something, I use my own data."

This:
- Acknowledges AI-assisted development upfront (they'll figure it out anyway)
- Emphasizes that security is infrastructure-level (not custom code that could have AI bugs)
- Keeps the "I use my own data" point
- Adds the email-visible-but-not-password detail that builds trust

#### 2. Update "For the Technically Curious" section

**Passwords line** — add that they can't be viewed:
> "Passwords are hashed using bcrypt — never stored in plaintext, and not visible to anyone (including me)"

**Sessions line** — remove vague "secure" wording:
> "Sessions use JWT access tokens (1-hour expiry by default) with single-use refresh tokens"

**Encryption line** — clarify both legs:
> "All traffic is encrypted via HTTPS/TLS — both between your device and the server, and between the server and AI services"

**Infrastructure line** — add link:
> "Infrastructure runs on SOC2 Type II compliant hosting"

Since we can't add clickable links easily in the current structure, we could add a small note at the end of this section with reference links, or just leave the claim as-is since it's verifiable.

#### 3. Optional: Add reference links at the bottom of the technical section

Add a small paragraph after the bullet list:
> "For verification: [Lovable Security](https://lovable.dev/security) · [Infrastructure Security](https://supabase.com/docs/guides/security/soc-2-compliance)"

This gives technically curious users a way to verify the claims without cluttering the main content.

### Implementation

**File: `src/pages/Privacy.tsx`**

Update the `PRIVACY_CONTENT` object:

1. **Line 43-56** - Update `technical` section:
   - Change passwords description to include "not visible to anyone"
   - Change sessions description to be specific about 1-hour expiry and single-use refresh tokens
   - Change traffic description to clarify both legs
   - Add a `links` array for optional reference links

2. **Lines 58-61** - Update `developerAccess` section:
   - Rename title to "How This Was Built"
   - Replace text with the honest AI-assisted development explanation

3. **Lines 171-178** - Update the JSX rendering:
   - Update icon from `UserCheck` to something like `Wrench` (more fitting for "how it was built")
   - Add optional links rendering after the technical section bullet list

### Result

The page will:
- Be honest about AI-assisted development without inviting security scrutiny
- Make claims that are precise and verifiable
- Build trust through transparency (email visible, password not)
- Provide reference links for the technically curious to verify claims

