// Auth context — provides session, user, profile, and auth actions to the whole app.
// Handles session restoration on page reload and reacts to auth state changes.
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  fetchProfile,
} from "../lib/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the profile row for the current user (if any).
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await fetchProfile(userId);
    if (error) {
      setProfile(null);
      return;
    }
    setProfile(data);
  }, []);

  // On mount: restore the existing session (survives page refresh).
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    }

    restoreSession();

    // Listen for auth state changes (login, logout, token refresh, etc.).
    // Wrap async work in an IIFE to avoid the onAuthStateChange deadlock.
    const { data: listener } = supabase
      ? supabase.auth.onAuthStateChange((_event, newSession) => {
          (async () => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            if (newSession?.user) {
              await loadProfile(newSession.user.id);
            } else {
              setProfile(null);
            }
          })();
        })
      : { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      listener.data.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email, password) => {
      const result = await signInWithEmail(email, password);
      return result;
    },
    []
  );

  const signUp = useCallback(
    async (email, password, fullName) => {
      const result = await signUpWithEmail(email, password, fullName);
      return result;
    },
    []
  );

  const logout = useCallback(async () => {
    const { error } = await signOut();
    if (!error) {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
    return { error };
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    return await resetPassword(email);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  const value = {
    session,
    user,
    profile,
    loading,
    isAuthenticated: Boolean(session),
    signIn,
    signUp,
    logout,
    sendPasswordReset,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
