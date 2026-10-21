import { useState, useEffect } from "react";
import { Check, DollarSign, Tag, FileText } from "lucide-react";
import BottomSheet from "../ui/BottomSheet";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { categoryKeys, getCategory } from "../../lib/categories";

export default function AddExpenseSheet({ open, onClose, onSave }) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) {
      setMerchant("");
      setAmount("");
      setCategory("food");
      setNote("");
      setErrors({});
      setSaved(false);
    }
  }, [open]);

  const validate = () => {
    const errs = {};
    if (!merchant.trim()) errs.merchant = "Enter a merchant name";
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = "Enter a valid amount";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const newTransaction = {
      merchant: merchant.trim(),
      amount: -parseFloat(amount),
      category,
      date: new Date().toISOString(),
      note: note.trim() || "Manual entry",
    };
    onSave?.(newTransaction);
    setSaved(true);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Expense">
      <div className="space-y-4">
        <Input
          label="Merchant"
          placeholder="e.g. Whole Foods Market"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          error={errors.merchant}
          leftIcon={<Tag size={18} />}
        />

        <Input
          label="Amount"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          leftIcon={<DollarSign size={18} />}
        />

        <div>
          <label className="block text-sm font-medium text-ivory-200 mb-2">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {categoryKeys
              .filter((k) => k !== "income")
              .map((key) => {
                const cat = getCategory(key);
                const Icon = cat.icon;
                const isSelected = category === key;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isSelected
                        ? "border-2"
                        : "bg-charcoal-800/60 border border-[var(--border)] text-charcoal-400 hover:text-ivory-200"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: cat.bg,
                            borderColor: cat.color,
                            color: cat.color,
                          }
                        : {}
                    }
                  >
                    <Icon size={14} />
                    <span className="truncate">{cat.short}</span>
                  </button>
                );
              })}
          </div>
        </div>

        <Input
          label="Note (optional)"
          placeholder="e.g. Weekly groceries"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          leftIcon={<FileText size={18} />}
        />

        {saved && (
          <div className="flex items-center gap-2 text-forest-300 text-sm animate-fade">
            <Check size={16} />
            Expense added
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth disabled={saved} onClick={handleSave}>
            {saved ? "Saved" : "Add Expense"}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
