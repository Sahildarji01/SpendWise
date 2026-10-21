import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ClipboardPaste,
  Check,
  Sparkles,
  Trash2,
  AlertTriangle,
  Copy,
  ArrowDownLeft,
  ArrowUpRight,
  Tag,
  Calendar,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import BottomSheet from "../ui/BottomSheet";
import Button from "../ui/Button";
import { categoryKeys, getCategory } from "../../lib/categories";
import { formatCurrency, cn } from "../../lib/format";
import { parsePastedTransactions, detectDuplicates, validateDraft } from "../../lib/pasteParser";
import { createTransactions, fetchRecentForDuplicates } from "../../lib/transactionService";

const paymentMethods = ["Cash", "Card", "UPI", "Bank Transfer", "Other"];

const EXAMPLE =
  "Your UPI payment of Rs. 250.00 to HP Petrol Pump was successful on 20 Oct 2026.\n\nRs. 1,200.00 debited from your account via Card to Amazon India on 19 Oct 2026.\n\nSalary of Rs. 45,000.00 credited to your account on 18 Oct 2026.";

export default function PasteSheet({ open, onClose, onDataChange }) {
  const [pastedText, setPastedText] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [dupMarks, setDupMarks] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveResults, setSaveResults] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!open) {
      setPastedText("");
      setDrafts([]);
      setDupMarks([]);
      setParsing(false);
      setSaving(false);
      setError(null);
      setSaveResults(null);
      setExpandedId(null);
    }
  }, [open]);

  const handleParse = useCallback(async () => {
    if (!pastedText.trim()) {
      setError("Paste at least one message to parse.");
      return;
    }

    setParsing(true);
    setError(null);
    setDrafts([]);
    setDupMarks([]);
    setSaveResults(null);

    // Parse synchronously (deterministic)
    const parsed = parsePastedTransactions(pastedText);

    if (parsed.length === 0) {
      setParsing(false);
      setError("No transactions detected. Check the message format and try again.");
      return;
    }

    // Fetch existing transactions for duplicate detection
    const { data: existing } = await fetchRecentForDuplicates();
    const marks = detectDuplicates(parsed, existing || []);

    setDrafts(parsed);
    setDupMarks(marks);
    setParsing(false);
  }, [pastedText]);

  const updateDraft = (id, updates) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates };
        // Recompute field flags
        const fields = {};
        if (!updated.description?.trim()) fields.description = "Review needed";
        if (!updated.transaction_date) fields.date = "Review needed";
        if (!updated.type) fields.type = "Review needed";
        if (!updated.payment_method) fields.paymentMethod = "Review needed";
        updated.fields = fields;
        return updated;
      })
    );
  };

  const removeDraft = (id) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const toggleSelect = (id) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  const selectedDrafts = useMemo(() => drafts.filter((d) => d.selected), [drafts]);

  const validationErrors = useMemo(() => {
    const errs = {};
    for (const d of selectedDrafts) {
      const { valid, errors } = validateDraft(d);
      if (!valid) errs[d.id] = errors;
    }
    return errs;
  }, [selectedDrafts]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const handleSave = async () => {
    if (selectedDrafts.length === 0) {
      setError("Select at least one transaction to save.");
      return;
    }
    if (hasValidationErrors) {
      setError("Fix the errors in selected transactions before saving.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaveResults(null);

    const result = await createTransactions(
      selectedDrafts.map((d) => ({
        type: d.type,
        amount: Number(d.amount),
        description: d.description.trim(),
        category: d.category,
        transaction_date: d.transaction_date,
        payment_method: d.payment_method || null,
        notes: d.notes || null,
      }))
    );

    setSaving(false);

    if (result?.error) {
      setError(result.error.message || "Failed to save transactions.");
      setSaveResults(result.results);
      return;
    }

    const succeeded = result.results?.filter((r) => !r.error).length || 0;
    const failed = result.results?.filter((r) => r.error).length || 0;
    setSaveResults({ succeeded, failed });

    if (onDataChange) onDataChange();

    // Clear sensitive pasted text
    setPastedText("");

    if (failed === 0) {
      setTimeout(() => onClose(), 1500);
    }
  };

  const confidenceLabel = (conf) => {
    if (conf >= 0.75) return "High";
    if (conf >= 0.5) return "Medium";
    return "Low";
  };

  const confidenceColor = (conf) => {
    if (conf >= 0.75) return "text-forest-300";
    if (conf >= 0.5) return "text-accent-400";
    return "text-error";
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Paste Transactions">
      <div className="space-y-4">
        {/* Input phase — show when no drafts parsed yet */}
        {drafts.length === 0 && !parsing && (
          <>
            <div>
              <label className="block text-sm font-medium text-ivory-200 mb-1.5">
                Paste bank SMS, UPI alerts, or transaction messages
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  setError(null);
                }}
                placeholder={"Paste one or more messages here...\n\nExample:\nYour UPI payment of Rs. 250.00 to HP Petrol Pump was successful on 20 Oct 2026."}
                rows={5}
                className="w-full rounded-xl bg-charcoal-800 border border-[var(--border-strong)] text-ivory-50 text-sm p-3.5 placeholder:text-charcoal-500 focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20 transition-all resize-none"
              />
              <div className="mt-2 flex items-start gap-2">
                <Sparkles size={14} className="text-forest-400 shrink-0 mt-0.5" />
                <p className="text-xs text-charcoal-400">
                  Paste multiple messages separated by blank lines. We'll extract amounts, merchants, dates, and payment methods automatically.
                </p>
              </div>
            </div>

            <button
              onClick={() => setPastedText(EXAMPLE)}
              className="text-xs text-forest-300 hover:text-forest-200 transition-colors"
            >
              Try an example
            </button>

            {error && (
              <div className="flex items-start gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2.5 animate-fade">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button
                fullWidth
                disabled={!pastedText.trim()}
                onClick={handleParse}
              >
                <ClipboardPaste size={16} />
                Parse Transactions
              </Button>
            </div>
          </>
        )}

        {/* Parsing indicator */}
        {parsing && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-10 w-10 rounded-2xl bg-forest-500/15 flex items-center justify-center mb-3">
              <span className="inline-block h-5 w-5 rounded-full border-2 border-forest-300 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-charcoal-300">Parsing messages…</p>
          </div>
        )}

        {/* Review phase — show parsed drafts */}
        {drafts.length > 0 && !parsing && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ivory-100">
                  {drafts.length} {drafts.length === 1 ? "transaction" : "transactions"} detected
                </h3>
                <p className="text-xs text-charcoal-400 mt-0.5">
                  Review and edit before saving. Tap a card to expand.
                </p>
              </div>
              <button
                onClick={() => {
                  setDrafts([]);
                  setDupMarks([]);
                  setPastedText("");
                  setSaveResults(null);
                }}
                className="text-xs text-charcoal-400 hover:text-ivory-200 transition-colors"
              >
                Start over
              </button>
            </div>

            {/* Draft list */}
            <div className="space-y-2.5 max-h-[40vh] overflow-y-auto">
              {drafts.map((draft, index) => {
                const dup = dupMarks[index];
                const isExpanded = expandedId === draft.id;
                const valErrs = validationErrors[draft.id];
                const cat = getCategory(draft.category);

                return (
                  <div
                    key={draft.id}
                    className={cn(
                      "rounded-xl border transition-all",
                      draft.selected
                        ? "bg-charcoal-800/60 border-[var(--border-strong)]"
                        : "bg-charcoal-800/30 border-[var(--border)] opacity-50",
                      dup?.existing && "ring-1 ring-accent-500/30"
                    )}
                  >
                    {/* Header row */}
                    <div className="flex items-start gap-2.5 p-3">
                      {/* Select checkbox */}
                      <button
                        onClick={() => toggleSelect(draft.id)}
                        className={cn(
                          "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                          draft.selected
                            ? "bg-forest-500 border-forest-500"
                            : "border-charcoal-500 hover:border-charcoal-400"
                        )}
                      >
                        {draft.selected && <Check size={12} className="text-ivory-50" />}
                      </button>

                      {/* Summary */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : draft.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium",
                              draft.type === "income" ? "text-forest-300" : "text-error"
                            )}
                          >
                            {draft.type === "income" ? (
                              <ArrowUpRight size={12} />
                            ) : (
                              <ArrowDownLeft size={12} />
                            )}
                            {draft.type}
                          </span>
                          <span className={cn("text-xs", confidenceColor(draft.confidence))}>
                            {confidenceLabel(draft.confidence)}
                          </span>
                          {dup?.existing && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-accent-400">
                              <Copy size={10} /> Possible duplicate
                            </span>
                          )}
                          {dup?.internal && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-accent-400">
                              <Copy size={10} /> Repeated
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-ivory-50 truncate">
                          {draft.description || "— no description —"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-semibold text-ivory-100 tnum">
                            {formatCurrency(draft.amount)}
                          </span>
                          <span className="text-xs text-charcoal-400">
                            {draft.payment_method || "No method"}
                          </span>
                          {valErrs && (
                            <span className="text-xs text-error">
                              Needs attention
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expand/collapse + remove */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : draft.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-charcoal-400 hover:text-ivory-200 hover:bg-charcoal-700/60 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button
                          onClick={() => removeDraft(draft.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-charcoal-400 hover:text-error hover:bg-error/10 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded editor */}
                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3 border-t border-[var(--border)] pt-3 animate-slide-up">
                        {/* Type toggle */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-charcoal-800/60 rounded-xl border border-[var(--border)]">
                          <button
                            onClick={() => updateDraft(draft.id, { type: "expense" })}
                            className={cn(
                              "flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all",
                              draft.type === "expense"
                                ? "bg-error/15 text-error"
                                : "text-charcoal-400"
                            )}
                          >
                            <ArrowDownLeft size={14} />
                            Expense
                          </button>
                          <button
                            onClick={() => updateDraft(draft.id, { type: "income", category: "income" })}
                            className={cn(
                              "flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all",
                              draft.type === "income"
                                ? "bg-forest-500/15 text-forest-300"
                                : "text-charcoal-400"
                            )}
                          >
                            <ArrowUpRight size={14} />
                            Income
                          </button>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-xs font-medium text-ivory-200 mb-1">
                            Description
                          </label>
                          <div className="relative">
                            <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
                            <input
                              type="text"
                              value={draft.description}
                              onChange={(e) => updateDraft(draft.id, { description: e.target.value })}
                              placeholder="Merchant or description"
                              className={cn(
                                "w-full h-10 rounded-lg bg-charcoal-800 border text-ivory-50 text-sm pl-10 pr-3",
                                "placeholder:text-charcoal-500 focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20 transition-all",
                                valErrs?.description ? "border-error/50" : "border-[var(--border-strong)]"
                              )}
                            />
                          </div>
                          {valErrs?.description && (
                            <p className="mt-1 text-xs text-error">{valErrs.description}</p>
                          )}
                        </div>

                        {/* Amount + Date row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-ivory-200 mb-1">
                              Amount (₹)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 text-sm">₹</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                value={draft.amount}
                                onChange={(e) => updateDraft(draft.id, { amount: parseFloat(e.target.value) })}
                                className={cn(
                                  "w-full h-10 rounded-lg bg-charcoal-800 border text-ivory-50 text-sm pl-7 pr-3 tnum",
                                  "focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20 transition-all",
                                  valErrs?.amount ? "border-error/50" : "border-[var(--border-strong)]"
                                )}
                              />
                            </div>
                            {valErrs?.amount && (
                              <p className="mt-1 text-xs text-error">{valErrs.amount}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-ivory-200 mb-1">
                              Date
                            </label>
                            <div className="relative">
                              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
                              <input
                                type="date"
                                value={draft.transaction_date}
                                onChange={(e) => updateDraft(draft.id, { transaction_date: e.target.value })}
                                className={cn(
                                  "w-full h-10 rounded-lg bg-charcoal-800 border text-ivory-50 text-sm pl-9 pr-2",
                                  "focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20 transition-all",
                                  valErrs?.transaction_date ? "border-error/50" : "border-[var(--border-strong)]"
                                )}
                              />
                            </div>
                            {valErrs?.transaction_date && (
                              <p className="mt-1 text-xs text-error">{valErrs.transaction_date}</p>
                            )}
                          </div>
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-xs font-medium text-ivory-200 mb-1.5">
                            Category
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {(draft.type === "income" ? ["income"] : categoryKeys.filter((k) => k !== "income")).map((key) => {
                              const c = getCategory(key);
                              const Icon = c.icon;
                              const isSelected = draft.category === key;
                              return (
                                <button
                                  key={key}
                                  onClick={() => updateDraft(draft.id, { category: key })}
                                  className={cn(
                                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    isSelected ? "border-2" : "bg-charcoal-800/60 border border-[var(--border)] text-charcoal-400"
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

                        {/* Payment method */}
                        <div>
                          <label className="block text-xs font-medium text-ivory-200 mb-1">
                            Payment Method
                          </label>
                          <div className="relative">
                            <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
                            <select
                              value={draft.payment_method || ""}
                              onChange={(e) => updateDraft(draft.id, { payment_method: e.target.value || null })}
                              className="w-full h-10 rounded-lg bg-charcoal-800 border border-[var(--border-strong)] text-ivory-50 text-sm pl-9 pr-3 focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20 transition-all appearance-none"
                            >
                              <option value="">Select method</option>
                              {paymentMethods.map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-xs font-medium text-ivory-200 mb-1">
                            Notes
                          </label>
                          <div className="relative">
                            <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
                            <input
                              type="text"
                              value={draft.notes || ""}
                              onChange={(e) => updateDraft(draft.id, { notes: e.target.value })}
                              placeholder="Optional notes"
                              className="w-full h-10 rounded-lg bg-charcoal-800 border border-[var(--border-strong)] text-ivory-50 text-sm pl-9 pr-3 placeholder:text-charcoal-500 focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Duplicate warning */}
            {(dupMarks.some((d) => d?.existing) || dupMarks.some((d) => d?.internal)) && (
              <div className="flex items-start gap-2 text-sm text-accent-400 bg-accent-500/10 border border-accent-500/20 rounded-xl px-3 py-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  Some transactions may be duplicates. Review carefully before saving — duplicates are not removed automatically.
                </span>
              </div>
            )}

            {/* Save error */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2.5 animate-fade">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Save results */}
            {saveResults && saveResults.succeeded > 0 && saveResults.failed === 0 && (
              <div className="flex items-center gap-2 text-forest-300 text-sm animate-fade">
                <Check size={16} />
                {saveResults.succeeded} {saveResults.succeeded === 1 ? "transaction" : "transactions"} saved successfully
              </div>
            )}
            {saveResults && saveResults.failed > 0 && (
              <div className="flex items-start gap-2 text-sm text-accent-400 bg-accent-500/10 border border-accent-500/20 rounded-xl px-3 py-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  {saveResults.succeeded} saved, {saveResults.failed} failed. You can retry the failed ones.
                </span>
              </div>
            )}

            {/* Save bar */}
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" fullWidth onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                fullWidth
                disabled={selectedDrafts.length === 0 || saving || hasValidationErrors}
                loading={saving}
                onClick={handleSave}
              >
                {saving
                  ? "Saving…"
                  : `Save ${selectedDrafts.length} ${selectedDrafts.length === 1 ? "Transaction" : "Transactions"}`}
              </Button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
