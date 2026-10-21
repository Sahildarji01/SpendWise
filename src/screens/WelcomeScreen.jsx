import { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Wallet,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { supabaseConfigured } from "../lib/authService";

// Maps Supabase auth error messages to user-friendly text.
function friendlyAuthError(error) {
  if (!error) return null;
  const msg = error.message?.toLowerCase() || "";
  if (msg.includes("invalid login credentials"))
    return "Incorrect email or password. Please try again.";
  if (msg.includes("user already registered"))
    return "An account with this email already exists. Try signing in instead.";
  if (msg.includes("password should be at least"))
    return "Password must be at least 6 characters.";
  if (msg.includes("unable to send email") || msg.includes("rate limit"))
    return "We couldn't send the reset email right now. Please wait a moment and try again.";
  if (msg.includes("not configured"))
    return "Supabase isn't configured yet. Add your project URL and anon key to .env to enable authentication.";
  if (msg.includes("network") || msg.includes("fetch"))
    return "Network error. Check your connection and try again.";
  return error.message || "Something went wrong. Please try again.";
}

export default function WelcomeScreen() {
  const { signIn, signUp, sendPasswordReset, isAuthenticated } = useAuth();
  const [mode, setMode] = useState("welcome"); // welcome | signin | signup | reset
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // If already authenticated (session restored), caller (App.jsx) handles redirect.
  // This screen is only rendered for unauthenticated users.

  const validate = () => {
    const errs = {};
    if (mode === "signup" && name.trim().length < 1) {
      errs.name = "Please enter your name";
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errs.email = "Enter a valid email address";
    }
    if (mode !== "reset" && password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setAuthError(null);
    if (!validate()) return;
    setLoading(true);

    if (mode === "signin") {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        setAuthError(friendlyAuthError(error));
      }
      // On success, onAuthStateChange in AuthContext updates session → App redirects.
    } else if (mode === "signup") {
      const { error, profileError } = await signUp(email, password, name.trim());
      setLoading(false);
      if (error) {
        setAuthError(friendlyAuthError(error));
      } else if (profileError) {
        // Auth succeeded but profile row couldn't be created — non-blocking.
        setAuthError(
          "Your account was created, but we couldn't save your profile. This may resolve on your next sign-in."
        );
      }
      // If email confirmation is OFF, session is set immediately → App redirects.
      // If ON, user needs to confirm email before they can sign in.
    }
  };

  const handleReset = async (e) => {
    e?.preventDefault();
    setAuthError(null);
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErrors({ email: "Enter a valid email address" });
      return;
    }
    setLoading(true);
    const { error } = await sendPasswordReset(email);
    setLoading(false);
    if (error) {
      setAuthError(friendlyAuthError(error));
    } else {
      setResetSent(true);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrors({});
    setAuthError(null);
    setResetSent(false);
  };

  // --- Welcome / landing screen ---
  if (mode === "welcome") {
    return (
      <div className="min-h-screen flex flex-col bg-charcoal-900 safe-top safe-bottom">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="animate-slide-up">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center mb-8 shadow-medium">
              <Wallet size={36} className="text-ivory-50" />
            </div>
            <h1 className="font-display text-4xl font-semibold text-ivory-50 mb-3">
              SpendWise
            </h1>
            <p className="text-base text-charcoal-300 max-w-xs mx-auto leading-relaxed">
              Know what's safe to spend. Track every dollar with clarity and confidence.
            </p>
          </div>
        </div>

        <div className="px-6 pb-10 space-y-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button variant="primary" size="lg" fullWidth onClick={() => switchMode("signup")}>
            Get Started
            <ArrowRight size={20} />
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={() => switchMode("signin")}>
            I already have an account
          </Button>
          <p className="text-center text-xs text-charcoal-500 pt-2">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
          {!supabaseConfigured && (
            <p className="text-center text-xs text-accent-400 pt-1">
              Supabase not configured — set up credentials in .env to enable auth
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Password reset screen ---
  if (mode === "reset") {
    return (
      <div className="min-h-screen flex flex-col bg-charcoal-900 safe-top safe-bottom">
        <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
          <div className="animate-slide-up">
            <button
              onClick={() => switchMode("signin")}
              className="flex items-center gap-1 text-sm text-charcoal-400 hover:text-ivory-200 transition-colors mb-6"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </button>

            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center mb-6 shadow-soft">
              <Wallet size={26} className="text-ivory-50" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-ivory-50 mb-2">
              Reset Password
            </h1>
            <p className="text-sm text-charcoal-400 mb-8">
              Enter your email and we'll send you a link to reset your password.
            </p>

            {resetSent ? (
              <div className="rounded-xl bg-forest-500/10 border border-forest-500/20 p-4 flex items-start gap-3 animate-scale-in">
                <CheckCircle2 size={20} className="text-forest-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-forest-300">Check your email</p>
                  <p className="text-xs text-charcoal-400 mt-1">
                    We sent a password reset link to {email}. Follow the link in the email to reset your password.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  leftIcon={<Mail size={18} />}
                  autoComplete="email"
                />

                {authError && (
                  <div className="flex items-start gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2.5 animate-fade">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                  Send Reset Link
                  {!loading && <ArrowRight size={20} />}
                </Button>
              </form>
            )}

            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="w-full text-center text-sm text-charcoal-400 hover:text-ivory-200 transition-colors mt-6"
            >
              Remember your password? Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Sign in / Sign up screens ---
  const isSignup = mode === "signup";

  return (
    <div className="min-h-screen flex flex-col bg-charcoal-900 safe-top safe-bottom">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        <div className="animate-slide-up">
          <button
            onClick={() => switchMode("welcome")}
            className="flex items-center gap-1 text-sm text-charcoal-400 hover:text-ivory-200 transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center mb-6 shadow-soft">
            <Wallet size={26} className="text-ivory-50" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-ivory-50 mb-2">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-charcoal-400 mb-8">
            {isSignup
              ? "Start tracking your spending in under a minute."
              : "Sign in to continue managing your spending."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <Input
                label="Full Name"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                leftIcon={<User size={18} />}
                autoComplete="name"
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail size={18} />}
              autoComplete="email"
            />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-charcoal-400 hover:text-ivory-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              autoComplete={isSignup ? "new-password" : "current-password"}
            />

            {authError && (
              <div className="flex items-start gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2.5 animate-fade">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              {isSignup ? "Create Account" : "Sign In"}
              {!loading && <ArrowRight size={20} />}
            </Button>
          </form>

          {!isSignup && (
            <button
              type="button"
              onClick={() => switchMode("reset")}
              className="w-full text-center text-sm text-charcoal-400 hover:text-ivory-200 transition-colors mt-4"
            >
              Forgot your password?
            </button>
          )}

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-charcoal-500">or</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          <button
            type="button"
            onClick={() => switchMode(isSignup ? "signin" : "signup")}
            className="w-full text-center text-sm text-charcoal-400 hover:text-ivory-200 transition-colors"
          >
            {isSignup
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
