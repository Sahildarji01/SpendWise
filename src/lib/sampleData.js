// Sample data for SpendWise Phase 1
// This is illustrative data to demonstrate the UI.
// In Phase 2, this will be replaced with Supabase queries.

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

function dateInMonth(day, hour = 10, minute = 0) {
  return new Date(currentYear, currentMonth, day, hour, minute).toISOString();
}

export const sampleUser = {
  id: "local-user",
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
  avatarInitials: "AM",
  monthlyIncome: 5200,
};

export const monthlyBudget = {
  total: 3200,
  spent: 2138.42,
  categories: {
    food: { budget: 650, spent: 412.18 },
    transport: { budget: 400, spent: 186.50 },
    shopping: { budget: 500, spent: 389.99 },
    entertainment: { budget: 200, spent: 95.00 },
    home: { budget: 1200, spent: 980.00 },
    health: { budget: 150, spent: 74.75 },
    coffee: { budget: 80, spent: 56.00 },
    subscriptions: { budget: 120, spent: 120.00 },
    gifts: { budget: 100, spent: 0 },
    travel: { budget: 300, spent: 0 },
    education: { budget: 200, spent: 0 },
    other: { budget: 100, spent: 24.00 },
  },
};

export const sampleTransactions = [
  {
    id: "t-001",
    merchant: "Whole Foods Market",
    category: "food",
    amount: -84.32,
    date: dateInMonth(today.getDate(), 18, 45),
    note: "Weekly groceries",
  },
  {
    id: "t-002",
    merchant: "Blue Bottle Coffee",
    category: "coffee",
    amount: -6.50,
    date: dateInMonth(today.getDate(), 8, 15),
    note: "Morning latte",
  },
  {
    id: "t-003",
    merchant: "Uber",
    category: "transport",
    amount: -14.80,
    date: dateInMonth(today.getDate() - 1, 9, 30),
    note: "Ride to office",
  },
  {
    id: "t-004",
    merchant: "Netflix",
    category: "subscriptions",
    amount: -15.49,
    date: dateInMonth(today.getDate() - 1, 0, 1),
    note: "Monthly subscription",
  },
  {
    id: "t-005",
    merchant: "Amazon",
    category: "shopping",
    amount: -42.99,
    date: dateInMonth(today.getDate() - 2, 14, 20),
    note: "USB-C cable & notebook",
  },
  {
    id: "t-006",
    merchant: "Sweetgreen",
    category: "food",
    amount: -13.75,
    date: dateInMonth(today.getDate() - 2, 12, 45),
    note: "Lunch",
  },
  {
    id: "t-007",
    merchant: "CVS Pharmacy",
    category: "health",
    amount: -28.40,
    date: dateInMonth(today.getDate() - 3, 16, 10),
    note: "Vitamins & first aid",
  },
  {
    id: "t-008",
    merchant: "Shell Gas Station",
    category: "transport",
    amount: -52.00,
    date: dateInMonth(today.getDate() - 3, 7, 50),
    note: "Full tank",
  },
  {
    id: "t-009",
    merchant: "AMC Theatres",
    category: "entertainment",
    amount: -24.00,
    date: dateInMonth(today.getDate() - 4, 20, 15),
    note: "Movie night",
  },
  {
    id: "t-010",
    merchant: "Salary Deposit",
    category: "income",
    amount: 2600.00,
    date: dateInMonth(1, 9, 0),
    note: "Biweekly paycheck",
  },
  {
    id: "t-011",
    merchant: "Rent Payment",
    category: "home",
    amount: -1850.00,
    date: dateInMonth(1, 10, 0),
    note: "Monthly rent",
  },
  {
    id: "t-012",
    merchant: "Spotify Premium",
    category: "subscriptions",
    amount: -9.99,
    date: dateInMonth(today.getDate() - 5, 0, 1),
    note: "Monthly subscription",
  },
  {
    id: "t-013",
    merchant: "Target",
    category: "shopping",
    amount: -67.30,
    date: dateInMonth(today.getDate() - 6, 15, 30),
    note: "Household items",
  },
  {
    id: "t-014",
    merchant: "Chipotle",
    category: "food",
    amount: -11.85,
    date: dateInMonth(today.getDate() - 6, 13, 0),
    note: "Burrito bowl",
  },
  {
    id: "t-015",
    merchant: "Equinox",
    category: "health",
    amount: -46.35,
    date: dateInMonth(today.getDate() - 7, 6, 30),
    note: "Gym membership",
  },
  {
    id: "t-016",
    merchant: "Lyft",
    category: "transport",
    amount: -22.50,
    date: dateInMonth(today.getDate() - 7, 22, 45),
    note: "Ride home",
  },
  {
    id: "t-017",
    merchant: "Trader Joe's",
    category: "food",
    amount: -38.92,
    date: dateInMonth(today.getDate() - 8, 17, 20),
    note: "Snacks & frozen items",
  },
  {
    id: "t-018",
    merchant: "Starbucks",
    category: "coffee",
    amount: -5.25,
    date: dateInMonth(today.getDate() - 8, 8, 0),
    note: "Cold brew",
  },
  {
    id: "t-019",
    merchant: "Electric Bill",
    category: "home",
    amount: -87.50,
    date: dateInMonth(today.getDate() - 9, 11, 0),
    note: "Monthly utility",
  },
  {
    id: "t-020",
    merchant: "Amazon",
    category: "shopping",
    amount: -129.70,
    date: dateInMonth(today.getDate() - 10, 19, 15),
    note: "Desk lamp & organizer",
  },
  {
    id: "t-021",
    merchant: "Local Bodega",
    category: "food",
    amount: -8.40,
    date: dateInMonth(today.getDate() - 10, 12, 30),
    note: "Sandwich",
  },
  {
    id: "t-022",
    merchant: "App Store",
    category: "subscriptions",
    amount: -94.52,
    date: dateInMonth(today.getDate() - 11, 0, 1),
    note: "Annual app subscriptions",
  },
  {
    id: "t-023",
    merchant: "Chevron",
    category: "transport",
    amount: -48.00,
    date: dateInMonth(today.getDate() - 12, 7, 30),
    note: "Gas refill",
  },
  {
    id: "t-024",
    merchant: "Bookstore",
    category: "education",
    amount: -34.99,
    date: dateInMonth(today.getDate() - 13, 14, 0),
    note: "Finance book",
  },
  {
    id: "t-025",
    merchant: "Salary Deposit",
    category: "income",
    amount: 2600.00,
    date: dateInMonth(15, 9, 0),
    note: "Biweekly paycheck",
  },
  {
    id: "t-026",
    merchant: "Internet Bill",
    category: "home",
    amount: -42.50,
    date: dateInMonth(today.getDate() - 14, 11, 0),
    note: "Monthly utility",
  },
  {
    id: "t-027",
    merchant: "Muji",
    category: "shopping",
    amount: -23.40,
    date: dateInMonth(today.getDate() - 15, 16, 20),
    note: "Stationery",
  },
  {
    id: "t-028",
    merchant: "Whole Foods Market",
    category: "food",
    amount: -72.15,
    date: dateInMonth(today.getDate() - 15, 18, 0),
    note: "Grocery run",
  },
  {
    id: "t-029",
    merchant: "Concert Tickets",
    category: "entertainment",
    amount: -71.00,
    date: dateInMonth(today.getDate() - 16, 20, 0),
    note: "Live music event",
  },
  {
    id: "t-030",
    merchant: "Pharmacy Refill",
    category: "health",
    amount: -15.00,
    date: dateInMonth(today.getDate() - 17, 10, 0),
    note: "Prescription",
  },
];

// Empty state sample (for when no transactions exist)
export const emptyTransactions = [];

// Settings preferences
export const defaultPreferences = {
  currency: "USD",
  notifications: {
    budgetAlerts: true,
    transactionAlerts: true,
    weeklySummary: false,
  },
  privacy: {
    hideAmounts: false,
    biometricLock: false,
  },
  appearance: "dark",
  voiceLanguage: "en-IN",
};
