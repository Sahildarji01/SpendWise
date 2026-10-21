import { useState, useEffect, useMemo, useCallback } from "react";
import { TrendingUp, TrendingDown, Wallet, ChevronRight, PiggyBank, AlertTriangle, Info } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import ProgressBar from "../components/ui/ProgressBar";
import QuickActions from "../components/quickactions/QuickActions";
import TransactionItem from "../components/transactions/TransactionItem";
import { ErrorState } from "../components/ui/States";
import { DashboardSkeleton } from "../components/ui/Skeleton";
import {
  formatCurrency,
  getMonthName,
  getRemainingDays,
  cn,
} from "../lib/format";
import { fetchMonthTransactions, fetchRecentTransactions } from "../lib/transactionService";
import { fetchOverallBudget } from "../lib/budgetService";
import { computeBudgetStatus, computeDailyAllowance, getAlertInfo } from "../lib/budgetCalculations";
import { getCategory, categoryKeys } from "../lib/categories";
import { CategoryIcon } from "../components/ui/Avatar";

export default function HomeScreen({
  user,
  hideAmounts,
  currency,
  onQuickAction,
  onSeeAllTransactions,
  onTransactionClick,
  onNavigate,
  refreshKey,
}) {
  const today = new Date();
  const [monthTxns, setMonthTxns] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [monthResult, recentResult, budgetResult] = await Promise.all([
      fetchMonthTransactions(today),
      fetchRecentTransactions(5),
      fetchOverallBudget(today),
    ]);

    if (monthResult.error) {
      setError(monthResult.error.message || "Failed to load dashboard data");
      setLoading(false);
      return;
    }

    if (recentResult.error) {
      setRecentTxns([]);
    } else {
      setRecentTxns(recentResult.data || []);
    }

    setMonthTxns(monthResult.data || []);
    setBudget(budgetResult.error ? null : budgetResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  const stats = useMemo(() => {
    const income = monthTxns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthTxns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netCashFlow = income - expenses;
    const daysRemaining = getRemainingDays(today);

    // Expense totals by category
    const categoryTotals = {};
    monthTxns
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
      });

    const topCategories = Object.entries(categoryTotals)
      .map(([key, total]) => ({ key, total, ...getCategory(key) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    // Budget calculations
    const budgetStatus = budget
      ? computeBudgetStatus(budget.amount, expenses)
      : null;
    const dailyAllowance = budget
      ? computeDailyAllowance(budget.amount, expenses, today)
      : 0;
    const alertInfo = budgetStatus ? getAlertInfo(budgetStatus.alertState, budgetStatus.overspend) : null;

    return { income, expenses, netCashFlow, daysRemaining, categoryTotals, topCategories, budgetStatus, dailyAllowance, alertInfo };
  }, [monthTxns, today, budget]);

  const display = (amount) => (hideAmounts ? "••••" : formatCurrency(amount, { currency }));

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="pb-24">
        <div className="px-4 pt-6 pb-2">
          <h1 className="font-display text-2xl font-semibold text-ivory-50">
            Hi, {user.name.split(" ")[0]}
          </h1>
        </div>
        <ErrorState
          title="Couldn't load your dashboard"
          description={error}
          onRetry={loadDashboard}
        />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-xs text-charcoal-400 uppercase tracking-wider font-medium">
          {getMonthName(today)}
        </p>
        <h1 className="font-display text-2xl font-semibold text-ivory-50 mt-0.5">
          Hi, {user.name.split(" ")[0]}
        </h1>
      </div>

      <div className="px-4 space-y-4 stagger">
        {/* Net cash flow hero card */}
        <Card className="bg-gradient-to-br from-forest-600 to-forest-800 border-forest-500/20 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-forest-400/10" />
          <div className="absolute -bottom-12 -left-4 h-24 w-24 rounded-full bg-forest-300/5" />

          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-forest-100/80">Net Cash Flow</span>
              <Badge variant="forest" size="sm">
                {stats.daysRemaining}d left
              </Badge>
            </div>
            <p className="font-display text-4xl font-semibold text-ivory-50 tnum">
              {display(stats.netCashFlow)}
            </p>
            <p className="text-xs text-forest-100/60 mt-1">
              Income minus expenses for {getMonthName(today)}
            </p>

            <div className="mt-4 pt-4 border-t border-forest-400/15 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-forest-100/70">Income</p>
                <p className="text-base font-semibold text-ivory-50 tnum">
                  {display(stats.income)}
                </p>
              </div>
              <div>
                <p className="text-xs text-forest-100/70">Expenses</p>
                <p className="text-base font-semibold text-ivory-50 tnum">
                  {display(stats.expenses)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <Card padded={false} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-error/10 flex items-center justify-center">
                <TrendingDown size={15} className="text-error" />
              </div>
              <span className="text-xs text-charcoal-400">Spent this month</span>
            </div>
            <p className="text-xl font-semibold text-ivory-50 tnum">
              {display(stats.expenses)}
            </p>
          </Card>
          <Card padded={false} className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-forest-500/15 flex items-center justify-center">
                <TrendingUp size={15} className="text-forest-300" />
              </div>
              <span className="text-xs text-charcoal-400">Income this month</span>
            </div>
            <p className="text-xl font-semibold text-ivory-50 tnum">
              {display(stats.income)}
            </p>
          </Card>
        </div>

        {/* Budget section */}
        {budget && stats.budgetStatus ? (
          <div className="space-y-3">
            <Card padded={false} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-forest-500/15 flex items-center justify-center">
                    <PiggyBank size={15} className="text-forest-300" />
                  </div>
                  <span className="text-xs text-charcoal-400">Budget Progress</span>
                </div>
                <button
                  onClick={() => onNavigate?.("budget")}
                  className="flex items-center gap-0.5 text-xs text-forest-300 hover:text-forest-200 transition-colors"
                >
                  Details
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-sm text-ivory-100 tnum">
                  {display(stats.budgetStatus.spent)} <span className="text-charcoal-400">/ {display(stats.budgetStatus.budget)}</span>
                </span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    stats.budgetStatus.alertState === "exceeded"
                      ? "text-error"
                      : stats.budgetStatus.alertState === "approaching"
                        ? "text-accent-400"
                        : "text-forest-300"
                  )}
                >
                  {stats.budgetStatus.percentUsed.toFixed(0)}%
                </span>
              </div>
              <ProgressBar
                value={stats.budgetStatus.spent}
                max={stats.budgetStatus.budget}
                size="md"
                showOverflow
              />

              <div className="flex justify-between mt-2">
                <span className="text-xs text-charcoal-400">
                  {stats.budgetStatus.remaining < 0
                    ? `${display(stats.budgetStatus.overspend)} over budget`
                    : `${display(stats.budgetStatus.remaining)} remaining`}
                </span>
                <span className="text-xs text-charcoal-400 tnum">
                  {display(stats.dailyAllowance)}/day
                </span>
              </div>
            </Card>

            {/* Budget alert */}
            {stats.alertInfo?.title && (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-xl px-3 py-2.5 border",
                  stats.alertInfo.tone === "error"
                    ? "bg-error/10 border-error/20 text-error"
                    : "bg-accent-500/10 border-accent-500/20 text-accent-400"
                )}
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">{stats.alertInfo.title}</p>
                  <p className="text-xs mt-0.5 opacity-90">{stats.alertInfo.message}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card
            onClick={() => onNavigate?.("budget")}
            className="flex items-center gap-3 border-dashed border-accent-500/20"
          >
            <div className="h-10 w-10 rounded-xl bg-accent-500/10 flex items-center justify-center shrink-0">
              <PiggyBank size={20} className="text-accent-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ivory-100">Set up a budget</p>
              <p className="text-xs text-charcoal-400">Track spending limits and see your safe-to-spend amount.</p>
            </div>
            <ChevronRight size={18} className="text-charcoal-500 shrink-0" />
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-ivory-100 mb-3">Quick Actions</h2>
          <QuickActions onSelect={onQuickAction} />
        </div>

        {/* Top spending categories */}
        {stats.topCategories.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-ivory-100 mb-3">Top Categories</h2>
            <Card padded={false} className="p-4 space-y-3">
              {stats.topCategories.map((cat) => {
                const Icon = cat.icon;
                const pct = stats.expenses > 0 ? (cat.total / stats.expenses) * 100 : 0;
                return (
                  <div key={cat.key} className="flex items-center gap-3">
                    <CategoryIcon icon={Icon} color={cat.color} bg={cat.bg} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-ivory-200">{cat.short}</span>
                        <span className="text-xs text-charcoal-400 tnum">{display(cat.total)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-charcoal-700/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-ivory-100">Recent Activity</h2>
            <button
              onClick={onSeeAllTransactions}
              className="flex items-center gap-0.5 text-xs text-forest-300 hover:text-forest-200 transition-colors"
            >
              See all
              <ChevronRight size={14} />
            </button>
          </div>
          <Card padded={false} className="px-4 py-1">
            {recentTxns.length === 0 ? (
              <div className="py-8 text-center">
                <Wallet size={28} className="text-charcoal-500 mx-auto mb-2" />
                <p className="text-sm text-charcoal-400">No transactions yet</p>
                <p className="text-xs text-charcoal-500 mt-1">Use Quick Actions to add one</p>
              </div>
            ) : (
              recentTxns.map((t) => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onClick={() => onTransactionClick(t)}
                  hideAmount={hideAmounts}
                  currency={currency}
                />
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
