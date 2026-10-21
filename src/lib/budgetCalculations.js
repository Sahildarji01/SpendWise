// Shared budget calculation logic — used by both BudgetScreen and HomeScreen.
// All calculations use local calendar-month rules for consistency.
import { getDaysInMonth, getRemainingDays } from "./format.js";

// Convert a Date to the first-of-month date string (YYYY-MM-01).
export function toMonthKey(date) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0].slice(0, 8) + "01";
}

// Get the month key for a date relative to today by an offset (-1 = last month, 0 = current).
export function getMonthKeyByOffset(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return toMonthKey(d);
}

// Sum expenses for a given month from a list of transactions.
export function sumMonthExpenses(transactions, monthKey) {
  return transactions
    .filter((t) => t.type === "expense" && t.transaction_date && t.transaction_date.startsWith(monthKey.slice(0, 7)))
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

// Sum expenses for a specific category in a given month.
export function sumCategoryExpenses(transactions, monthKey, category) {
  return transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        t.category === category &&
        t.transaction_date &&
        t.transaction_date.startsWith(monthKey.slice(0, 7))
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);
}

// Compute budget status: spent, remaining, percentUsed, overspend, alertState.
export function computeBudgetStatus(budgetAmount, spent) {
  const budget = Number(budgetAmount) || 0;
  const totalSpent = Number(spent) || 0;
  const remaining = budget - totalSpent;
  const percentUsed = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const overspend = totalSpent > budget ? totalSpent - budget : 0;

  let alertState = "normal";
  if (budget > 0) {
    if (percentUsed >= 100) alertState = "exceeded";
    else if (percentUsed >= 80) alertState = "approaching";
  }

  return {
    budget,
    spent: totalSpent,
    remaining,
    percentUsed: Math.min(percentUsed, 999),
    overspend,
    alertState,
  };
}

// Compute daily safe-to-spend allowance.
// remaining budget / days remaining in month (including today).
// Returns 0 if budget exceeded or no days remaining.
export function computeDailyAllowance(budgetAmount, spent, date = new Date()) {
  const budget = Number(budgetAmount) || 0;
  const totalSpent = Number(spent) || 0;
  const remaining = budget - totalSpent;

  if (remaining <= 0) return 0;

  const daysRemaining = getRemainingDays(date) + 1; // include today
  if (daysRemaining <= 0) return 0;

  return remaining / daysRemaining;
}

// Compute category budget status for all category budgets.
export function computeCategoryBudgets(categoryBudgets, transactions, monthKey) {
  return categoryBudgets.map((cb) => {
    const spent = sumCategoryExpenses(transactions, monthKey, cb.category);
    const status = computeBudgetStatus(cb.amount, spent);
    return {
      ...cb,
      spent,
      remaining: status.remaining,
      percentUsed: status.percentUsed,
      overspend: status.overspend,
      alertState: status.alertState,
    };
  });
}

// Get alert message and tone for a given alertState.
export function getAlertInfo(alertState, overspend = 0) {
  switch (alertState) {
    case "exceeded":
      return {
        tone: "error",
        title: "Budget exceeded",
        message:
          overspend > 0
            ? `You've overspent by this amount. Consider reducing expenses for the rest of the month.`
            : "You've reached your budget limit.",
      };
    case "approaching":
      return {
        tone: "warning",
        title: "Approaching your limit",
        message: "You've used 80% or more of your budget. Spend carefully for the rest of the month.",
      };
    default:
      return {
        tone: "normal",
        title: null,
        message: null,
      };
  }
}
