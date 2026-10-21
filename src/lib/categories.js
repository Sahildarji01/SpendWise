// Centralized category metadata — colors, icons, and labels
import {
  UtensilsCrossed,
  Car,
  ShoppingCart,
  Film,
  House,
  HeartPulse,
  Briefcase,
  Plane,
  GraduationCap,
  Receipt,
  Coffee,
  Smartphone,
  Gift,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

export const categories = {
  food: {
    label: "Food & Dining",
    short: "Food",
    icon: UtensilsCrossed,
    color: "#4f8f6c",
    bg: "rgba(79, 143, 108, 0.12)",
  },
  transport: {
    label: "Transportation",
    short: "Transport",
    icon: Car,
    color: "#3a6b9c",
    bg: "rgba(58, 107, 156, 0.12)",
  },
  shopping: {
    label: "Shopping",
    short: "Shopping",
    icon: ShoppingCart,
    color: "#d9983a",
    bg: "rgba(217, 152, 58, 0.12)",
  },
  entertainment: {
    label: "Entertainment",
    short: "Entertainment",
    icon: Film,
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
  },
  home: {
    label: "Home & Utilities",
    short: "Home",
    icon: House,
    color: "#7ba372",
    bg: "rgba(123, 163, 114, 0.12)",
  },
  health: {
    label: "Health & Wellness",
    short: "Health",
    icon: HeartPulse,
    color: "#c0483d",
    bg: "rgba(192, 72, 61, 0.12)",
  },
  income: {
    label: "Income",
    short: "Income",
    icon: TrendingUp,
    color: "#2e6b49",
    bg: "rgba(46, 107, 73, 0.15)",
  },
  travel: {
    label: "Travel",
    short: "Travel",
    icon: Plane,
    color: "#3a8b9c",
    bg: "rgba(58, 139, 156, 0.12)",
  },
  education: {
    label: "Education",
    short: "Education",
    icon: GraduationCap,
    color: "#7c5ca8",
    bg: "rgba(124, 92, 168, 0.12)",
  },
  coffee: {
    label: "Coffee & Snacks",
    short: "Coffee",
    icon: Coffee,
    color: "#b87a28",
    bg: "rgba(184, 122, 40, 0.12)",
  },
  subscriptions: {
    label: "Subscriptions",
    short: "Subscriptions",
    icon: Smartphone,
    color: "#5c7ca8",
    bg: "rgba(92, 124, 168, 0.12)",
  },
  gifts: {
    label: "Gifts & Donations",
    short: "Gifts",
    icon: Gift,
    color: "#a85c8b",
    bg: "rgba(168, 92, 139, 0.12)",
  },
  other: {
    label: "Other",
    short: "Other",
    icon: Receipt,
    color: "#7c7a74",
    bg: "rgba(124, 122, 116, 0.12)",
  },
};

export const categoryKeys = Object.keys(categories);

export function getCategory(key) {
  return categories[key] || categories.other;
}
