import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Wallet,
  TrendingDown,
  CalendarDays,
  Info,
} from "lucide-react";
import TopBar from "../components/layout/TopBar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ProgressBar from "../components/ui/ProgressBar";
import { ErrorState } from "../components/ui/States";
import { formatCurrency, getMonthName, cn } from "../lib/format";
import { categoryKeys, getCategory } from "../lib/categories";
import {
  toMonthKey,
  computeBudgetStatus,
  computeDailyAllowance,
  computeCategoryBudgets,
  getAlertInfo,
} from "../lib/budgetCalculations";
import {
  fetchBudgets,
  saveOverallBudget,
  saveCategoryBudget,
  deleteBudget,
} from "../lib/budgetService";
import { fetchMonthExpenses } from "../lib/transactionService";

export default function BudgetScreen({ hideAmounts, currency, refreshKey }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCategory, setBudgetCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const monthKey = toMonthKey(selectedDate);
  const isCurrentMonth = monthKey === toMonthKey(new Date());

  const display = (amount) => (hideAmounts ? "••••" : formatCurrency(amount, { currency }));

  const loadBudgetData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [budgetResult, expenseResult] = await Promise.all([
      fetchBudgets(selectedDate),
      fetchMonthExpenses(monthKey),
    ]);

    if (budgetResult.error) {
      setError(budgetResult.error.message || "Failed to load budgets.");
      setLoading(false);
      return;
    }

    if (expenseResult.error) {
      setError(expenseResult.error.message || "Failed to load spending data.");
      setLoading(false);
      return;
    }

    setBudgets(budgetResult.data || []);
    setExpenses(expenseResult.data || []);
    setLoading(false);
  }, [selectedDate, monthKey]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData, refreshKey]);

  const overallBudget = useMemo(
    () => budgets.find((b) => b.category === null),
    [budgets]
  );

  const categoryBudgets = useMemo(
    () => budgets.filter((b) => b.category !== null),
    [budgets]
  );

  const totalSpent = useMemo(
    () => expenses.reduce((sum, t) => sum + Number(t.amount), 0),
    [expenses]
  );

  const budgetStatus = useMemo(
    () => computeBudgetStatus(overallBudget?.amount || 0, totalSpent),
    [overallBudget, totalSpent]
  );

  const dailyAllowance = useMemo(
    () =>
      overallBudget
        ? computeDailyAllowance(overallBudget.amount, totalSpent, selectedDate)
        : 0,
    [overallBudget, totalSpent, selectedDate]
  );

  const categoryStatuses = useMemo(
    () => computeCategoryBudgets(categoryBudgets, expenses, monthKey),
    [categoryBudgets, expenses, monthKey]
  );

  const alertInfo = getAlertInfo(budgetStatus.alertState, budgetStatus.overspend);

  const goToPrevMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() - 1);
    setSelectedDate(d);
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + 1);
    setSelectedDate(d);
  };

  const openSetBudget = () => {
    setEditingBudget(null);
    setBudgetCategory(null);
    setBudgetAmount(overallBudget ? String(Math.round(Number(overallBudget.amount))) : "");
    setSaveError(null);
    setShowBudgetModal(true);
  };

  const openEditOverall = () => {
    setEditingBudget(overallBudget);
    setBudgetCategory(null);
    setBudgetAmount(String(Math.round(Number(overallBudget.amount))));
    setSaveError(null);
    setShowBudgetModal(true);
  };

  const openAddCategory = () => {
    setEditingBudget(null);
    setBudgetCategory("");
    setBudgetAmount("");
    setSaveError(null);
    setShowBudgetModal(true);
  };

  const openEditCategory = (cb) => {
    setEditingBudget(cb);
    setBudgetCategory(cb.category);
    setBudgetAmount(String(Math.round(Number(cb.amount))));
    setSaveError(null);
    setShowBudgetModal(true);
  };

  const handleSaveBudget = async () => {
    const amt = parseFloat(budgetAmount);
    if (isNaN(amt) || amt <= 0) {
      setSaveError("Enter a valid positive amount.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    let result;
    if (budgetCategory === null) {
      result = await saveOverallBudget(amt, selectedDate);
    } else {
      if (!budgetCategory) {
        setSaveError("Select a category.");
        setSaving(false);
        return;
      }
      result = await saveCategoryBudget(budgetCategory, amt, selectedDate);
    }

    setSaving(false);

    if (result?.error) {
      setSaveError(result.error.message || "Failed to save budget.");
      return;
    }

    setShowBudgetModal(false);
    loadBudgetData();
  };

  const handleDeleteBudget = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const result = await deleteBudget(deleteId);

    setDeleting(false);

    if (result?.error) {
      setSaveError(result.error.message || "Failed to delete budget.");
      return;
    }

    setDeleteId(null);
    loadBudgetData();
  };

  const availableCategories = useMemo(() => {
    const used = new Set(categoryBudgets.map((b) => b.category));
    return categoryKeys.filter((k) => k !== "income" && (!used.has(k) || editingBudget?.category === k));
  }, [categoryBudgets, editingBudget]);

  if (loading) {
    return (
      <div className="pb-24">
        <TopBar title="Budget" subtitle={getMonthName(selectedDate)} />
        <div className="px-4 pt-4">
          <div className="flex flex-col items-center justify-center py-16">
            <span className="inline-block h-6 w-6 rounded-full border-2 border-forest-300 border-t-transparent animate-spin" />
            <p className="text-sm text-charcoal-400 mt-3">Loading budget…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pb-24">
        <TopBar title="Budget" subtitle={getMonthName(selectedDate)} />
        <div className="px-4 pt-4">
          <ErrorState title="Couldn't load your budget" description={error} onRetry={loadBudgetData} />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <TopBar title="Budget" subtitle={getMonthName(selectedDate)} />

      <div className="px-4 pt-4 space-y-4 stagger">
        {/* Month navigator */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-charcoal-400 hover:text-ivory-100 hover:bg-charcoal-700/60 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-1.5">
            <CalendarDays size={15} className="text-charcoal-400" />
            <span className="text-sm font-medium text-ivory-100">
              {getMonthName(selectedDate)} {selectedDate.getFullYear()}
            </span>
          </div>
          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
              isCurrentMonth
                ? "text-charcoal-600 cursor-not-allowed"
                : "text-charcoal-400 hover:text-ivory-100 hover:bg-charcoal-700/60"
            )}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* No budget state */}
        {!overallBudget && (
          <Card className="flex flex-col items-center text-center py-10 border-dashed border-accent-500/20">
            <div className="h-16 w-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mb-4">
              <PiggyBank size={28} className="text-accent-400" />
            </div>
            <h2 className="text-base font-semibold text-ivory-100 mb-1.5">
              No budget set for {getMonthName(selectedDate)}
            </h2>
            <p className="text-sm text-charcoal-400 max-w-xs mb-5">
              Set a monthly spending limit to track your progress and see how much is safe to spend each day.
            </p>
            <Button onClick={openSetBudget}>
              <Plus size={16} />
              Set Up Budget
            </Button>
          </Card>
        )}

        {/* Budget overview */}
        {overallBudget && (
          <Card className="bg-gradient-to-br from-forest-600 to-forest-800 border-forest-500/20 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-forest-400/10" />
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-forest-100/80">Monthly Budget</span>
                <button
                  onClick={openEditOverall}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-forest-100/60 hover:text-ivory-50 hover:bg-forest-500/20 transition-colors"
                >
                  <Pencil size={13} />
                </button>
              </div>
              <p className="font-display text-3xl font-semibold text-ivory-50 tnum">
                {display(budgetStatus.budget)}
              </p>

              <div className="mt-4 pt-4 border-t border-forest-400/15 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown size={14} className="text-forest-100/60" />
                    <span className="text-xs text-forest-100/70">Spent</span>
                  </div>
                  <span className="text-sm font-semibold text-ivory-50 tnum">
                    {display(budgetStatus.spent)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-forest-100/70">Remaining</span>
                  <span
                    className={cn(
                      "text-sm font-semibold tnum",
                      budgetStatus.remaining < 0 ? "text-error" : "text-ivory-50"
                    )}
                  >
                    {display(budgetStatus.remaining)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-forest-100/70">
                    {budgetStatus.percentUsed.toFixed(0)}% used
                  </span>
                  {budgetStatus.overspend > 0 && (
                    <span className="text-xs text-error">
                      {display(budgetStatus.overspend)} over
                    </span>
                  )}
                </div>
                <ProgressBar
                  value={budgetStatus.spent}
                  max={budgetStatus.budget}
                  size="lg"
                  showOverflow
                />
              </div>
            </div>
          </Card>
        )}

        {/* Daily safe-to-spend */}
        {overallBudget && isCurrentMonth && (
          <Card padded={false} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-forest-500/15 flex items-center justify-center">
                  <Wallet size={15} className="text-forest-300" />
                </div>
                <span className="text-xs text-charcoal-400">Safe to spend today</span>
              </div>
            </div>
            <p
              className={cn(
                "text-2xl font-semibold tnum",
                dailyAllowance > 0 ? "text-forest-300" : "text-charcoal-400"
              )}
            >
              {display(dailyAllowance)}
            </p>
            <p className="text-xs text-charcoal-500 mt-1.5 flex items-start gap-1">
              <Info size={11} className="shrink-0 mt-0.5" />
              <span>
                Estimated daily allowance based on your remaining budget. This is a budgeting guide, not your bank balance.
              </span>
            </p>
          </Card>
        )}

        {/* Budget alert */}
        {overallBudget && alertInfo.title && (
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-xl px-3.5 py-3 border",
              alertInfo.tone === "error"
                ? "bg-error/10 border-error/20 text-error"
                : "bg-accent-500/10 border-accent-500/20 text-accent-400"
            )}
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">{alertInfo.title}</p>
              <p className="text-xs mt-0.5 opacity-90">{alertInfo.message}</p>
            </div>
          </div>
        )}

        {/* Category budgets */}
        {overallBudget && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-ivory-100">Category Budgets</h2>
              <button
                onClick={openAddCategory}
                className="flex items-center gap-1 text-xs text-forest-300 hover:text-forest-200 transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            {categoryStatuses.length === 0 ? (
              <Card padded={false} className="p-4 text-center">
                <p className="text-sm text-charcoal-400">
                  No category budgets yet.
                </p>
                <p className="text-xs text-charcoal-500 mt-1">
                  Set limits for specific categories like Food, Transport, or Shopping.
                </p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {categoryStatuses.map((cb) => {
                  const cat = getCategory(cb.category);
                  const CatIcon = cat.icon;
                  const catAlert = getAlertInfo(cb.alertState, cb.overspend);

                  return (
                    <Card key={cb.id} padded={false} className="p-3.5">
                      <div className="flex items-center gap-3 mb-2.5">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: cat.bg }}
                        >
                          <CatIcon size={15} style={{ color: cat.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ivory-100">{cat.short}</p>
                          <p className="text-xs text-charcoal-400 tnum">
                            {display(cb.spent)} of {display(cb.amount)}
                          </p>
                        </div>
                        <button
                          onClick={() => openEditCategory(cb)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-charcoal-400 hover:text-ivory-100 hover:bg-charcoal-700/60 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                      <ProgressBar
                        value={cb.spent}
                        max={cb.amount}
                        size="sm"
                        showOverflow
                      />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-xs text-charcoal-400">
                          {cb.percentUsed.toFixed(0)}% used
                        </span>
                        <span
                          className={cn(
                            "text-xs tnum",
                            cb.remaining < 0 ? "text-error" : "text-charcoal-400"
                          )}
                        >
                          {cb.remaining < 0
                            ? `${display(cb.overspend)} over`
                            : `${display(cb.remaining)} left`}
                        </span>
                      </div>
                      {catAlert.title && (
                        <p
                          className={cn(
                            "text-xs mt-1.5",
                            catAlert.tone === "error" ? "text-error" : "text-accent-400"
                          )}
                        >
                          {catAlert.title}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget modal (create/edit overall or category) */}
      <Modal
        open={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title={
          budgetCategory === null
            ? editingBudget
              ? "Edit Monthly Budget"
              : "Set Monthly Budget"
            : editingBudget
              ? `Edit ${getCategory(budgetCategory).short} Budget`
              : "Add Category Budget"
        }
      >
        <div className="space-y-4">
          {budgetCategory !== null && (
            <div>
              <label className="block text-sm font-medium text-ivory-200 mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableCategories.map((key) => {
                  const c = getCategory(key);
                  const Icon = c.icon;
                  const isSelected = budgetCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setBudgetCategory(key)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        isSelected
                          ? "border-2"
                          : "bg-charcoal-800/60 border-[var(--border)] text-charcoal-400"
                      )}
                      style={isSelected ? { backgroundColor: c.bg, borderColor: c.color, color: c.color } : {}}
                    >
                      <Icon size={12} />
                      {c.short}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ivory-200 mb-1.5">
              {budgetCategory === null ? "Monthly budget limit" : "Category limit"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 text-base">₹</span>
              <input
                type="number"
                inputMode="decimal"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className={cn(
                  "w-full h-12 rounded-xl bg-charcoal-800 border text-ivory-50 text-base pl-9 pr-4",
                  "placeholder:text-charcoal-400 focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20",
                  "transition-all border-[var(--border-strong)]"
                )}
              />
            </div>
          </div>

          {saveError && (
            <div className="flex items-start gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setShowBudgetModal(false)}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleSaveBudget} loading={saving} disabled={saving}>
              {editingBudget ? "Save Changes" : "Set Budget"}
            </Button>
          </div>

          {editingBudget && (
            <button
              onClick={() => {
                setDeleteId(editingBudget.id);
                setShowBudgetModal(false);
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-error hover:text-error/80 transition-colors pt-2"
            >
              <Trash2 size={14} />
              Delete this budget
            </button>
          )}
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Budget?"
      >
        <div className="space-y-4">
          <p className="text-sm text-charcoal-300">
            This will remove the budget. Your transactions are not affected. You can always set a new budget later.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={handleDeleteBudget} loading={deleting} disabled={deleting}>
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
