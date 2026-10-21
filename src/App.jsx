import { useState, useCallback } from "react";
import BottomNav from "./components/layout/BottomNav";
import WelcomeScreen from "./screens/WelcomeScreen";
import HomeScreen from "./screens/HomeScreen";
import TransactionsScreen from "./screens/TransactionsScreen";
import BudgetScreen from "./screens/BudgetScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SpeakSheet from "./components/quickactions/SpeakSheet";
import ScanSheet from "./components/quickactions/ScanSheet";
import PasteSheet from "./components/quickactions/PasteSheet";
import AddTransactionSheet from "./components/quickactions/AddTransactionSheet";
import EditTransactionSheet from "./components/quickactions/EditTransactionSheet";
import Modal from "./components/ui/Modal";
import { CategoryIcon } from "./components/ui/Avatar";
import Button from "./components/ui/Button";
import { useAuth } from "./context/AuthContext";
import { getCategory } from "./lib/categories";
import { formatCurrency, formatTime, formatDateLong } from "./lib/format";
import { createTransaction, updateTransaction, deleteTransaction } from "./lib/transactionService";
import { defaultPreferences } from "./lib/sampleData";

function App() {
  const { isAuthenticated, loading, user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [activeSheet, setActiveSheet] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const currency = profile?.currency || "INR";

  const handleQuickAction = useCallback((actionId) => {
    setActiveSheet(actionId);
  }, []);

  const handleNavigate = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const handleSignOut = useCallback(async () => {
    await logout();
    setActiveTab("home");
  }, [logout]);

  const hideAmounts = preferences.privacy.hideAmounts;

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleAddTransaction = useCallback(async (txn) => {
    const result = await createTransaction(txn);
    if (!result?.error) {
      triggerRefresh();
    }
    return result;
  }, [triggerRefresh]);

  const handleUpdateTransaction = useCallback(async (id, updates) => {
    const result = await updateTransaction(id, updates);
    if (!result?.error) {
      triggerRefresh();
    }
    return result;
  }, [triggerRefresh]);

  const handleDeleteTransaction = useCallback(async (id) => {
    const result = await deleteTransaction(id);
    if (!result?.error) {
      triggerRefresh();
    }
    return result;
  }, [triggerRefresh]);

  const displayUser = {
    id: user?.id || "unknown",
    name: profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "SpendWise User",
    email: user?.email || "",
    avatarInitials: (profile?.full_name || user?.email?.split("@")[0] || "SW")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
    currency,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-700 flex items-center justify-center shadow-soft">
            <span className="inline-block h-5 w-5 rounded-full border-2 border-ivory-50 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-charcoal-400">Loading SpendWise…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <WelcomeScreen />;
  }

  return (
    <div className="min-h-screen bg-charcoal-900 max-w-md mx-auto relative">
      {activeTab === "home" && (
        <HomeScreen
          user={displayUser}
          hideAmounts={hideAmounts}
          currency={currency}
          onQuickAction={handleQuickAction}
          onSeeAllTransactions={() => setActiveTab("transactions")}
          onTransactionClick={(t) => {
            setSelectedTransaction(t);
            setEditSheetOpen(true);
          }}
          onNavigate={handleNavigate}
          refreshKey={refreshKey}
        />
      )}

      {activeTab === "transactions" && (
        <TransactionsScreen
          hideAmounts={hideAmounts}
          currency={currency}
          onAddTransaction={() => setActiveSheet("add")}
          onDataChange={triggerRefresh}
        />
      )}

      {activeTab === "budget" && (
        <BudgetScreen
          hideAmounts={hideAmounts}
          currency={currency}
          refreshKey={refreshKey}
        />
      )}

      {activeTab === "settings" && (
        <SettingsScreen
          user={displayUser}
          preferences={preferences}
          onUpdatePreferences={setPreferences}
          onSignOut={handleSignOut}
        />
      )}

      <BottomNav active={activeTab} onNavigate={handleNavigate} />

      <SpeakSheet
        open={activeSheet === "speak"}
        onClose={() => setActiveSheet(null)}
        onSave={handleAddTransaction}
        onDataChange={triggerRefresh}
        onManualEntry={() => setActiveSheet("add")}
        preferredLanguage={preferences.voiceLanguage || "en-IN"}
      />
      <ScanSheet
        open={activeSheet === "scan"}
        onClose={() => setActiveSheet(null)}
      />
      <PasteSheet
        open={activeSheet === "paste"}
        onClose={() => setActiveSheet(null)}
        onDataChange={triggerRefresh}
      />
      <AddTransactionSheet
        open={activeSheet === "add"}
        onClose={() => setActiveSheet(null)}
        onSave={handleAddTransaction}
      />

      {/* Edit transaction sheet (opened from home or transactions) */}
      <EditTransactionSheet
        open={editSheetOpen}
        transaction={selectedTransaction}
        onClose={() => {
          setEditSheetOpen(false);
          setSelectedTransaction(null);
        }}
        onUpdate={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
}

export default App;
