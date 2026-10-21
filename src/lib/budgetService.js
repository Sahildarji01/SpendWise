// Service layer for budget CRUD and queries.
// All functions return { data, error } for uniform error handling.
import { supabase } from "./supabase";
import { toMonthKey } from "./budgetCalculations.js";

// Fetch all budgets (overall + category) for a given month.
// monthDate is a Date object; we convert to YYYY-MM-01.
export async function fetchBudgets(monthDate = new Date()) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const monthKey = toMonthKey(monthDate);

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("month", monthKey)
    .order("category", { ascending: true, nullsFirst: true });

  return { data, error };
}

// Fetch the overall budget (category = null) for a given month.
export async function fetchOverallBudget(monthDate = new Date()) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const monthKey = toMonthKey(monthDate);

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("month", monthKey)
    .is("category", null)
    .maybeSingle();

  return { data, error };
}

// Create or update the overall budget for a month (upsert).
// If a budget already exists for this user+month (category=null), update it.
export async function saveOverallBudget(amount, monthDate = new Date()) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const monthKey = toMonthKey(monthDate);
  const amt = Number(amount);

  if (isNaN(amt) || amt <= 0) {
    return { data: null, error: { message: "Budget amount must be a positive number." } };
  }

  // Try to fetch existing
  const { data: existing, error: fetchErr } = await fetchOverallBudget(monthDate);
  if (fetchErr) return { data: null, error: fetchErr };

  if (existing) {
    const { data, error } = await supabase
      .from("budgets")
      .update({ amount: amt })
      .eq("id", existing.id)
      .select("*")
      .maybeSingle();
    return { data, error };
  }

  const { data, error } = await supabase
    .from("budgets")
    .insert({ month: monthKey, amount: amt, category: null })
    .select("*")
    .maybeSingle();

  return { data, error };
}

// Create or update a category budget for a month.
export async function saveCategoryBudget(category, amount, monthDate = new Date()) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const monthKey = toMonthKey(monthDate);
  const amt = Number(amount);

  if (!category) {
    return { data: null, error: { message: "Category is required." } };
  }
  if (isNaN(amt) || amt <= 0) {
    return { data: null, error: { message: "Budget amount must be a positive number." } };
  }

  // Check for existing
  const { data: existing, error: fetchErr } = await supabase
    .from("budgets")
    .select("*")
    .eq("month", monthKey)
    .eq("category", category)
    .maybeSingle();

  if (fetchErr) return { data: null, error: fetchErr };

  if (existing) {
    const { data, error } = await supabase
      .from("budgets")
      .update({ amount: amt })
      .eq("id", existing.id)
      .select("*")
      .maybeSingle();
    return { data, error };
  }

  const { data, error } = await supabase
    .from("budgets")
    .insert({ month: monthKey, amount: amt, category })
    .select("*")
    .maybeSingle();

  return { data, error };
}

// Delete a budget by id.
export async function deleteBudget(id) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const { data, error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle();

  return { data, error };
}

// Fetch all months that have budgets for the user (for month picker).
// Returns array of month keys (YYYY-MM-01) sorted descending.
export async function fetchBudgetedMonths() {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const { data, error } = await supabase
    .from("budgets")
    .select("month")
    .order("month", { ascending: false });

  if (error) return { data: null, error };

  // Deduplicate months
  const months = [...new Set((data || []).map((b) => b.month))].sort().reverse();
  return { data: months, error: null };
}
