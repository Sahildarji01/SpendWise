import { useState, useEffect } from "react";
import { Trash2, Tag, FileText, Calendar, CreditCard, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import BottomSheet from "../ui/BottomSheet";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { categoryKeys, getCategory } from "../../lib/categories";
import { toDateInputValue, formatCurrency, cn } from "../../lib/format";

const paymentMethods = ["Cash", "Card", "UPI", "Bank Transfer", "Other"];

export default function EditTransactionSheet({ open, transaction, onClose, onUpdate, onDelete }) {
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [transactionDate, setTransactionDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (open && transaction) {
      setType(transaction.type || "expense");
      setDescription(transaction.description || "");
      setAmount(transaction.amount != null ? String(transaction.amount) : "");
      setCategory(transaction.category || "food");
      setTransactionDate(transaction.transaction_date || toDateInputValue());
      setPaymentMethod(transaction.payment_method || "");
      setNotes(transaction.notes || "");
      setErrors({});
      setSaving(false);
      setDeleting(false);
      setDbError(null);
      setShowDeleteConfirm(false);
    }
  }, [open, transaction]);

  const validate = () => {
    const errs = {};
    if (!description.trim()) errs.description = "Enter a description";
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = "Enter a valid positive amount";
    }
    if (!transactionDate) errs.transactionDate = "Select a date";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdate = async () => {
    setDbError(null);
    if (!validate()) return;
    setSaving(true);

    const result = await onUpdate(transaction.id, {
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      transaction_date: transactionDate,
      payment_method: paymentMethod || null,
      notes: notes.trim() || null,
    });

    setSaving(false);

    if (result?.error) {
      setDbError(result.error.message || "Failed to update transaction");
      return;
    }
    onClose();
  };

  const handleDelete = async () => {
    setDbError(null);
    setDeleting(true);

    const result = await onDelete(transaction.id);

    setDeleting(false);

    if (result?.error) {
      setDbError(result.error.message || "Failed to delete transaction");
      return;
    }
    onClose();
  };

  if (!transaction) return null;

  const availableCategories = categoryKeys.filter((k) =>
    type === "income" ? k === "income" : k !== "income"
  );

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit Transaction">
      <div className="space-y-4">
        {/* Income / Expense toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-charcoal-800/60 rounded-xl border border-[var(--border)]">
          <button
            onClick={() => { setType("expense"); if (category === "income") setCategory("food"); }}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              type === "expense" ? "bg-error/15 text-error" : "text-charcoal-400"
            )}
          >
            <ArrowDownLeft size={16} />
            Expense
          </button>
          <button
            onClick={() => { setType("income"); setCategory("income"); }}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              type === "income" ? "bg-forest-500/15 text-forest-300" : "text-charcoal-400"
            )}
          >
            <ArrowUpRight size={16} />
            Income
          </button>
        </div>

        <Input
          label="Description"
          placeholder="e.g. Whole Foods Market"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          leftIcon={<Tag size={18} />}
        />

        <Input
          label="Amount (₹)"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          leftIcon={<span className="text-charcoal-400 text-base font-medium">₹</span>}
        />

        <div>
          <label className="block text-sm font-medium text-ivory-200 mb-2">Category</label>
          <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto">
            {availableCategories.map((key) => {
              const cat = getCategory(key);
              const Icon = cat.icon;
              const isSelected = category === key;
              return (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200",
                    isSelected ? "border-2" : "bg-charcoal-800/60 border border-[var(--border)] text-charcoal-400 hover:text-ivory-200"
                  )}
                  style={isSelected ? { backgroundColor: cat.bg, borderColor: cat.color, color: cat.color } : {}}
                >
                  <Icon size={14} />
                  <span className="truncate">{cat.short}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Date"
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          error={errors.transactionDate}
          leftIcon={<Calendar size={18} />}
        />

        <div>
          <label className="block text-sm font-medium text-ivory-200 mb-2">
            Payment Method (optional)
          </label>
          <div className="relative">
            <CreditCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-12 rounded-xl bg-charcoal-800 border border-[var(--border-strong)] text-ivory-50 text-sm pl-11 pr-4 focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20 transition-all appearance-none"
            >
              <option value="">Select method</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Notes (optional)"
          placeholder="Additional details"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          leftIcon={<FileText size={18} />}
        />

        {dbError && (
          <div className="flex items-start gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2.5 animate-fade">
            <span>{dbError}</span>
          </div>
        )}

        {showDeleteConfirm ? (
          <div className="rounded-xl bg-error/10 border border-error/20 p-4 space-y-3 animate-scale-in">
            <p className="text-sm text-ivory-100">
              Delete this transaction? This cannot be undone.
            </p>
            <p className="text-xs text-charcoal-400">
              {transaction.description} — {formatCurrency(transaction.amount)}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" fullWidth onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" fullWidth loading={deleting} onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" fullWidth onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button fullWidth disabled={saving} loading={saving} onClick={handleUpdate}>
                Save Changes
              </Button>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-error/80 hover:text-error transition-colors disabled:opacity-40"
            >
              <Trash2 size={16} />
              Delete Transaction
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
