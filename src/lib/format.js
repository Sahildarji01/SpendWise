// Currency formatting — defaults to INR (₹) per SpendWise spec.
// The currency code is passed in from the user's profile; defaults to INR.
export function formatCurrency(amount, opts = {}) {
  const { showSign = false, compact = false, currency = "INR" } = opts;
  const abs = Math.abs(amount);
  const formatted = compact
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(abs)
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(abs);

  if (showSign) {
    return `${amount < 0 ? "−" : "+"}${formatted}`;
  }
  return amount < 0 ? `−${formatted}` : formatted;
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getMonthName(date = new Date()) {
  return date.toLocaleDateString("en-IN", { month: "long" });
}

export function getDaysInMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getDayOfMonth(date = new Date()) {
  return date.getDate();
}

export function getRemainingDays(date = new Date()) {
  return getDaysInMonth(date) - getDayOfMonth(date);
}

export function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatPercentage(value, decimals = 0) {
  return `${value.toFixed(decimals)}%`;
}

// Returns the first and last day of the given date's calendar month as ISO strings.
export function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

// Converts a Date to yyyy-mm-dd for date inputs.
export function toDateInputValue(date = new Date()) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}
