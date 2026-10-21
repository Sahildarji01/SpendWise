import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, SlidersHorizontal, X, Receipt, Plus } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import Card from "../components/ui/Card";
import TransactionItem from "../components/transactions/TransactionItem";
import { EmptyState, ErrorState } from "../components/ui/States";
import { TransactionSkeleton } from "../components/ui/Skeleton";
import BottomSheet from "../components/ui/BottomSheet";
import Button from "../components/ui/Button";
import EditTransactionSheet from "../components/quickactions/EditTransactionSheet";
import { categoryKeys, getCategory } from "../lib/categories";
import { fetchTransactions, deleteTransaction, updateTransaction } from "../lib/transactionService";
import { groupBy, formatDate, formatCurrency, getMonthRange, cn } from "../lib/format";

export default function TransactionsScreen({ hideAmounts, currency, onAddTransaction, onDataChange }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategories, setActiveCategories] = useState([]);
  const [typeFilter, setTypeFilter] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [sortBy, setSortBy] = useState("date");
  const [editingTxn, setEditingTxn] = useState(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [year, month] = selectedMonth.split("-").map(Number);
    const range = getMonthRange(new Date(year, month - 1, 1));

    const { data, error: fetchError } = await fetchTransactions({
      startDate: range.start,
      endDate: range.end,
      categories: activeCategories,
      type: typeFilter,
      search: search.trim(),
    });

    if (fetchError) {
      setError(fetchError.message || "Failed to load transactions");
      setTransactions([]);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  }, [selectedMonth, activeCategories, typeFilter, search]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadTransactions();
    }, search ? 300 : 0);
    return () => clearTimeout(debounceTimer);
  }, [loadTransactions]);

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];
    sorted.sort((a, b) => {
      if (sortBy === "amount") {
        return Math.abs(b.amount) - Math.abs(a.amount);
      }
      const dateCompare = new Date(b.transaction_date) - new Date(a.transaction_date);
      if (dateCompare !== 0) return dateCompare;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return sorted;
  }, [transactions, sortBy]);

  const grouped = useMemo(() => {
    return groupBy(sortedTransactions, (t) => formatDate(t.transaction_date));
  }, [sortedTransactions]);

  const totalSpent = sortedTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const toggleCategory = (key) => {
    setActiveCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setActiveCategories([]);
    setSearch("");
    setTypeFilter(null);
    setSortBy("date");
  };

  const hasActiveFilters = activeCategories.length > 0 || search.length > 0 || typeFilter !== null;

  const handleEdit = (txn) => {
    setEditingTxn(txn);
    setEditSheetOpen(true);
  };

  const handleEditSave = async (id, updates) => {
    const result = await updateTransaction(id, updates);
    if (!result?.error) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? result.data : t))
      );
      onDataChange?.();
    }
    return result;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    const { error: deleteError } = await deleteTransaction(deleteConfirm.id);
    setDeleting(false);
    if (deleteError) {
      setError(deleteError.message || "Failed to delete transaction");
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== deleteConfirm.id));
    setDeleteConfirm(null);
    onDataChange?.();
  };

  const monthOptions = useMemo(() => {
    const now = new Date();
    const options = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      options.push({ value, label });
    }
    return options;
  }, []);

  return (
    <div className="pb-24">
      <TopBar
        title="Activity"
        right={
          <button
            onClick={onAddTransaction}
            className="h-9 w-9 rounded-lg flex items-center justify-center bg-forest-500/15 text-forest-300 hover:bg-forest-500/25 transition-colors"
          >
            <Plus size={20} />
          </button>
        }
      />

      {/* Search + filter bar */}
      <div className="px-4 pt-4 pb-3 sticky top-14 z-10 bg-charcoal-900/80 backdrop-blur-xl">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions"
            className="w-full h-11 rounded-xl bg-charcoal-800 border border-[var(--border)] text-ivory-50 text-sm pl-11 pr-10 placeholder:text-charcoal-500 focus:outline-none focus:border-forest-400/40 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-ivory-200"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setShowFilters(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all border",
              hasActiveFilters
                ? "bg-forest-500/15 text-forest-300 border-forest-500/20"
                : "bg-charcoal-800 text-charcoal-300 border-[var(--border)]"
            )}
          >
            <SlidersHorizontal size={13} />
            Filters
            {hasActiveFilters && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-forest-500/20 text-forest-300 text-[10px]">
                {(activeCategories.length || 0) + (typeFilter ? 1 : 0)}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-charcoal-400 hover:text-ivory-200 shrink-0 transition-colors"
            >
              <X size={12} />
              Clear
            </button>
          )}
          <div className="flex-1" />
          <span className="text-xs text-charcoal-400 tnum shrink-0">
            {formatCurrency(totalSpent, { currency })} spent
          </span>
        </div>
      </div>

      {/* Transaction list */}
      <div className="px-4 space-y-4">
        {loading ? (
          <Card padded={false} className="px-4 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </Card>
        ) : error ? (
          <ErrorState
            title="Couldn't load transactions"
            description={error}
            onRetry={loadTransactions}
          />
        ) : sortedTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={hasActiveFilters ? "No matching transactions" : "No transactions yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Tap the + button above to add your first transaction."
            }
            action={
              hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-xl bg-charcoal-700 text-ivory-100 text-sm font-medium hover:bg-charcoal-600 transition-colors"
                >
                  Clear filters
                </button>
              ) : (
                <Button variant="primary" size="sm" onClick={onAddTransaction}>
                  <Plus size={16} />
                  Add Transaction
                </Button>
              )
            }
          />
        ) : (
          Object.entries(grouped).map(([dateLabel, items]) => {
            const dayTotal = items
              .filter((t) => t.type === "expense")
              .reduce((sum, t) => sum + Number(t.amount), 0);
            return (
              <div key={dateLabel} className="animate-slide-up">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-xs font-medium text-charcoal-400 uppercase tracking-wide">
                    {dateLabel}
                  </span>
                  {dayTotal > 0 && (
                    <span className="text-xs text-charcoal-500 tnum">
                      {formatCurrency(dayTotal, { currency })}
                    </span>
                  )}
                </div>
                <Card padded={false} className="px-4 py-1">
                  {items.map((t) => (
                    <TransactionItem
                      key={t.id}
                      transaction={t}
                      onClick={() => handleEdit(t)}
                      showDate={false}
                      hideAmount={hideAmounts}
                      currency={currency}
                    />
                  ))}
                </Card>
              </div>
            );
          })
        )}
      </div>

      {/* Filter Sheet */}
      <BottomSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter & Sort"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ivory-200 mb-2">Month</label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full h-12 rounded-xl bg-charcoal-800 border border-[var(--border-strong)] text-ivory-50 text-sm px-4 focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20 transition-all appearance-none"
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ivory-200 mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: null, label: "All" },
                { val: "expense", label: "Expenses" },
                { val: "income", label: "Income" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setTypeFilter(opt.val)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                    typeFilter === opt.val
                      ? "bg-forest-500/15 text-forest-300 border-forest-500/20"
                      : "bg-charcoal-800 text-charcoal-400 border-[var(--border)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ivory-200 mb-2">Sort by</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSortBy("date")}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                  sortBy === "date" ? "bg-forest-500/15 text-forest-300 border-forest-500/20" : "bg-charcoal-800 text-charcoal-400 border-[var(--border)]"
                )}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy("amount")}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                  sortBy === "amount" ? "bg-forest-500/15 text-forest-300 border-forest-500/20" : "bg-charcoal-800 text-charcoal-400 border-[var(--border)]"
                )}
              >
                Amount
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ivory-200 mb-2">Categories</label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {categoryKeys.map((key) => {
                const cat = getCategory(key);
                const Icon = cat.icon;
                const isActive = activeCategories.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border",
                      isActive ? "border-2" : "bg-charcoal-800/60 border border-[var(--border)] text-charcoal-400"
                    )}
                    style={isActive ? { backgroundColor: cat.bg, borderColor: cat.color, color: cat.color } : {}}
                  >
                    <Icon size={14} />
                    <span className="truncate">{cat.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={clearFilters}>Clear all</Button>
            <Button fullWidth onClick={() => setShowFilters(false)}>
              Show {sortedTransactions.length} results
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Edit Sheet */}
      <EditTransactionSheet
        open={editSheetOpen}
        transaction={editingTxn}
        onClose={() => setEditSheetOpen(false)}
        onUpdate={handleEditSave}
        onDelete={async (id) => {
          const result = await deleteTransaction(id);
          if (!result?.error) {
            setTransactions((prev) => prev.filter((t) => t.id !== id));
            onDataChange?.();
          }
          return result;
        }}
      />

      {/* Delete confirmation */}
      <BottomSheet
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Transaction"
      >
        <div className="space-y-4">
          <p className="text-sm text-ivory-100">
            Delete this transaction? This cannot be undone.
          </p>
          {deleteConfirm && (
            <p className="text-xs text-charcoal-400">
              {deleteConfirm.description} — {formatCurrency(deleteConfirm.amount, { currency })}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth loading={deleting} onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
