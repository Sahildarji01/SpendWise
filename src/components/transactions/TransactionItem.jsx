import { getCategory } from "../../lib/categories";
import { formatCurrency, formatDate, cn } from "../../lib/format";
import { CategoryIcon } from "../ui/Avatar";

export default function TransactionItem({ transaction, onClick, showDate = false, hideAmount = false, currency = "INR" }) {
  const cat = getCategory(transaction.category);
  const Icon = cat.icon;
  const isIncome = transaction.type === "income";
  const signedAmount = isIncome ? transaction.amount : -transaction.amount;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 px-1 text-left rounded-xl transition-colors hover:bg-charcoal-700/30 active:bg-charcoal-700/50"
    >
      <CategoryIcon icon={Icon} color={cat.color} bg={cat.bg} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ivory-50 truncate">
          {transaction.description}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-charcoal-400">
          <span>{cat.short}</span>
          <span className="text-charcoal-600">•</span>
          <span>{showDate ? formatDate(transaction.transaction_date) : (transaction.notes || transaction.payment_method || cat.label)}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p
          className={cn(
            "text-sm font-semibold tnum",
            hideAmount ? "text-charcoal-500" : isIncome ? "text-forest-300" : "text-ivory-50"
          )}
        >
          {hideAmount ? "••••" : formatCurrency(signedAmount, { showSign: true, currency })}
        </p>
      </div>
    </button>
  );
}
