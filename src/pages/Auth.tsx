import { useState } from "react";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-mode";

export default function Auth() {
  const { user, signUp, signIn, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const isResetCallback = searchParams.get("reset") === "true";

  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(isResetCallback);
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Only redirect if user is logged in AND not in password update mode
  if (user && !isUpdatingPassword) {
    return <Navigate to="/" replace />;
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    // Log error for debugging but don't expose to user
    if (error) {
      console.error("Password reset error:", error.message);
    }

    // Always show "success" to prevent account enumeration
    setResetSent(true);
    setSubmitting(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Password updated successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);

  if (error) {
    setErrorMessage(error.message);
  } else if (isSignUp) {
    // Track signup as first login (fire-and-forget)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.rpc('increment_login_count', { user_id: user.id });
      }
    });
  }

  setSubmitting(false);
  };

  const handleTryDemo = async () => {
    setIsDemoLoading(true);
    setErrorMessage(null);
    const { error } = await signIn(DEMO_EMAIL, DEMO_PASSWORD);
    if (error) {
      setErrorMessage("Demo temporarily unavailable. Please try again later.");
    }
    setIsDemoLoading(false);
  };

  // Password update form (after clicking reset link)
  if (isUpdatingPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/favicon.png" alt={APP_NAME} className="w-24 h-24 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              {errorMessage && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</div>
              )}
              {successMessage && (
                <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">{successMessage}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password reset request form
  if (isResetMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/favicon.png" alt={APP_NAME} className="w-24 h-24 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
            <CardDescription>{resetSent ? "Check your email" : "Reset your password"}</CardDescription>
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <div className="space-y-4">
                <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                  If an account exists for this email, you'll receive a password reset link shortly.
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsResetMode(false);
                    setResetSent(false);
                    setEmail("");
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {errorMessage && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsResetMode(false);
                    setErrorMessage(null);
                  }}
                >
                  Back to Sign In
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/favicon.png" alt={APP_NAME} className="w-24 h-24 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
          <CardDescription>Braindump what you ate or lifted — AI handles the rest</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
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
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
            <p>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setConfirmPassword("");
                  setErrorMessage(null);
                }}
                className="text-primary underline-offset-4 hover:underline"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
            <p>
              Or{" "}
              <button
                type="button"
                onClick={handleTryDemo}
                disabled={submitting || isDemoLoading}
                className="text-blue-500 underline-offset-4 hover:underline disabled:opacity-50"
              >
                {isDemoLoading ? "loading demo..." : "try the demo"}
              </button>{" "}
              — no account needed
            </p>
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy & Security
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
