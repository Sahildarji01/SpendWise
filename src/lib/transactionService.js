// Service layer for transaction CRUD and monthly queries.
// All functions return { data, error } for uniform error handling.
import { supabase } from "./supabase";

// Fetch transactions for a date range (defaults to current month).
// Supports search, category filter, type filter, and pagination.
export async function fetchTransactions({
  startDate = null,
  endDate = null,
  search = "",
  categories = [],
  type = null, // 'income' | 'expense' | null
  page = 0,
  pageSize = 50,
} = {}) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  let query = supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (startDate) query = query.gte("transaction_date", startDate);
  if (endDate) query = query.lte("transaction_date", endDate);
  if (type) query = query.eq("type", type);
  if (categories.length > 0) query = query.in("category", categories);
  if (search) query = query.ilike("description", `%${search}%`);

  query = query.range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, error } = await query;
  return { data, error };
}

// Fetch all transactions for the current month (for dashboard calculations).
export async function fetchMonthTransactions(date = new Date()) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("transaction_date", start.toISOString().split("T")[0])
    .lte("transaction_date", end.toISOString().split("T")[0])
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  return { data, error };
}

// Fetch all expense transactions for a given month key (YYYY-MM-01).
// Used by budget calculations for both current and previous months.
export async function fetchMonthExpenses(monthKey) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const year = parseInt(monthKey.slice(0, 4), 10);
  const month = parseInt(monthKey.slice(5, 7), 10) - 1;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, category, transaction_date, description")
    .eq("type", "expense")
    .gte("transaction_date", start.toISOString().split("T")[0])
    .lte("transaction_date", end.toISOString().split("T")[0]);

  return { data, error };
}

// Fetch recent transactions (for dashboard preview).
export async function fetchRecentTransactions(limit = 5) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data, error };
}

export async function createTransaction(txn) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      category: txn.category,
      transaction_date: txn.transaction_date,
      payment_method: txn.payment_method || null,
      notes: txn.notes || null,
    })
    .select("*")
    .maybeSingle();

  return { data, error };
}

export async function updateTransaction(id, updates) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const { data, error } = await supabase
    .from("transactions")
    .update({
      type: updates.type,
      amount: updates.amount,
      description: updates.description,
      category: updates.category,
      transaction_date: updates.transaction_date,
      payment_method: updates.payment_method || null,
      notes: updates.notes || null,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  return { data, error };
}

export async function deleteTransaction(id) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .select("*")
    .maybeSingle();

  return { data, error };
}

// Batch-create multiple transactions. Returns per-item results so the UI
// can report which succeeded and which failed (partial failure handling).
export async function createTransactions(drafts) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const rows = drafts.map((d) => ({
    type: d.type,
    amount: d.amount,
    description: d.description,
    category: d.category,
    transaction_date: d.transaction_date,
    payment_method: d.payment_method || null,
    notes: d.notes || null,
  }));

  const { data, error } = await supabase
    .from("transactions")
    .insert(rows)
    .select("*");

  if (error) {
    return { data: null, error, results: drafts.map(() => ({ data: null, error })) };
  }

  // Map results back to drafts by order (Supabase returns inserted rows in order)
  const results = drafts.map((_, i) => ({
    data: data?.[i] || null,
    error: null,
  }));

  return { data, error: null, results };
}

// Fetch recent transactions for duplicate detection (last 90 days).
export async function fetchRecentForDuplicates() {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, description, transaction_date, notes")
    .gte("transaction_date", since.toISOString().split("T")[0])
    .order("transaction_date", { ascending: false });

  return { data, error };
}
