

## Add Password Confirmation to Sign Up

### Overview
Add a "Confirm Password" field to the sign-up form that requires users to enter their password twice, with validation to ensure both entries match before allowing signup.

---

### Changes

**File:** `src/pages/Auth.tsx`

1. **Add new state variable** for confirm password:
   ```tsx
   const [confirmPassword, setConfirmPassword] = useState('');
   ```

2. **Add password matching validation** in `handleSubmit`:
   ```tsx
   if (isSignUp && password !== confirmPassword) {
     setErrorMessage("Passwords do not match.");
     setSubmitting(false);
     return;
   }
   ```

3. **Add Confirm Password input field** (only shown during sign-up):
   ```tsx
   {isSignUp && (
     <div className="space-y-2">
       <Label htmlFor="confirmPassword">Confirm Password</Label>
       <Input
         id="confirmPassword"
         name="confirmPassword"
         type="password"
         placeholder="Confirm your password"
         autoComplete="new-password"
         value={confirmPassword}
         onChange={(e) => setConfirmPassword(e.target.value)}
         required
         minLength={6}
       />
     </div>
   )}
   ```

4. **Clear confirm password when switching modes**:
   When toggling between Sign In and Sign Up, reset the confirmPassword state to avoid stale data.

---

### User Experience
- The confirm password field only appears when signing up (not during sign in)
- If passwords don't match, a clear error message "Passwords do not match." is shown
- The field has the same validation (minLength={6}) as the main password field
- Uses `autoComplete="new-password"` for proper browser behavior

---

### Files to Modify
1. `src/pages/Auth.tsx` - Add confirmPassword state, validation logic, and input field

