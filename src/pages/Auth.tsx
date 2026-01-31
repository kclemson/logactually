import { useState } from "react";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-mode";
import { Mail } from "lucide-react";


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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.redirected) {
      return; // Page is redirecting to OAuth provider
    }

    if (result.error) {
      console.error("Google OAuth error:", result.error);
      setErrorMessage("Google sign-in failed. Please try again.");
    }
    
    setIsGoogleLoading(false);
  };


  // Password update form (after clicking reset link)
  if (isUpdatingPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/logactually-logo-horiz.png" alt={APP_NAME} className="h-16 mx-auto mb-2" />
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
            <img src="/logactually-logo-horiz.png" alt={APP_NAME} className="h-16 mx-auto mb-2" />
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
          <img src="/logactually-logo-horiz.png" alt={APP_NAME} className="h-16 mx-auto mb-2" />
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
          
          {isSignUp ? (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setConfirmPassword("");
                    setErrorMessage(null);
                  }}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          ) : (
            <>
              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* OAuth and Email Sign Up buttons */}
              <div className="space-y-2">
                {/* Google */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={submitting || isGoogleLoading || isDemoLoading}
                >
                  {isGoogleLoading ? (
                    "Signing in..."
                  ) : (
                    <>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>

                {/* Email Sign Up */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMessage(null);
                  }}
                  disabled={submitting || isGoogleLoading || isDemoLoading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Sign up with email
                </Button>
              </div>

              {/* Demo link */}
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Or{" "}
                <button
                  type="button"
                  onClick={handleTryDemo}
                  disabled={submitting || isDemoLoading || isGoogleLoading}
                  className="text-primary underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {isDemoLoading ? "loading demo..." : "try the demo"}
                </button>{" "}
                — no account needed
              </p>
            </>
          )}
          <div className="mt-6 text-center text-sm">
            <Link
              to="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy & Security
            </Link>
            <span className="text-muted-foreground"> · </span>
            <Link
              to="/changelog"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Changelog
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
