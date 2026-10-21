// Service layer for authentication and profile database operations.
// All functions return { data, error } so callers can handle errors uniformly.
import { supabase, supabaseConfigured } from "./supabase";

function notConfiguredError() {
  return {
    data: null,
    error: {
      message:
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.",
    },
  };
}

// --- Authentication ---

export async function signUpWithEmail(email, password, fullName) {
  if (!supabase) return notConfiguredError();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) return { data: null, error };

  // If signup produced a session (email confirmation is OFF), create the profile row.
  // If email confirmation is ON, the profile is created on first login instead.
  if (data?.user && data?.session) {
    const profileResult = await createProfile(data.user.id, fullName);
    if (profileResult.error) {
      // Profile creation failed — return a warning but don't block the auth session.
      return { data, error: null, profileError: profileResult.error };
    }
  }

  return { data, error: null };
}

export async function signInWithEmail(email, password) {
  if (!supabase) return notConfiguredError();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { data: null, error };

  // Ensure a profile row exists (handles users who signed up before profiles were introduced,
  // or who signed up when email confirmation was ON and never got a profile created).
  if (data?.user) {
    const existing = await fetchProfile(data.user.id);
    if (existing.error || !existing.data) {
      const name =
        data.user.user_metadata?.full_name ||
        data.user.email?.split("@")[0] ||
        "SpendWise User";
      await createProfile(data.user.id, name);
    }
  }

  return { data, error: null };
}

export async function signOut() {
  if (!supabase) return notConfiguredError();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email) {
  if (!supabase) return notConfiguredError();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}`,
  });
  return { data, error };
}

export async function getCurrentSession() {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

export async function getCurrentUser() {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

// --- Profile CRUD ---

export async function fetchProfile(userId) {
  if (!supabase) return notConfiguredError();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, currency, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
  return { data, error };
}

export async function createProfile(userId, fullName, currency = "INR") {
  if (!supabase) return notConfiguredError();
  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, full_name: fullName, currency })
    .select("id, full_name, currency, created_at, updated_at")
    .maybeSingle();
  return { data, error };
}

export async function updateProfile(userId, updates) {
  if (!supabase) return notConfiguredError();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, full_name, currency, created_at, updated_at")
    .maybeSingle();
  return { data, error };
}

export { supabaseConfigured };
