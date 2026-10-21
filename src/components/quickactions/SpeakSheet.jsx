import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  Square,
  AlertTriangle,
  Check,
  Tag,
  Calendar,
  CreditCard,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Globe,
  Keyboard,
  X,
} from "lucide-react";
import BottomSheet from "../ui/BottomSheet";
import Button from "../ui/Button";
import Input from "../ui/Input";
import PermissionHelpDialog from "../permissions/PermissionHelpDialog";
import { categoryKeys, getCategory } from "../../lib/categories";
import { cn } from "../../lib/format";
import { parseVoiceStatement } from "../../lib/voiceParser";
import { LANGUAGES, getStrings } from "../../lib/voiceI18n";
import {
  requestMicrophone,
  stopMediaTracks,
  isSpeechRecognitionSupported,
  getPermissionStatus,
} from "../../lib/permissions";

const paymentMethods = ["Cash", "Card", "UPI", "Bank Transfer", "Other"];

export default function SpeakSheet({ open, onClose, onSave, onDataChange, onManualEntry, preferredLanguage = "en-IN" }) {
  const [language, setLanguage] = useState(preferredLanguage);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  const [phase, setPhase] = useState("idle"); // idle | recording | reviewing | saving | saved
  const [draft, setDraft] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [micStatus, setMicStatus] = useState("unknown");
  const recognitionRef = useRef(null);

  const t = getStrings(language);

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setLanguage(preferredLanguage);
      setRecording(false);
      setTranscript("");
      setInterim("");
      setError(null);
      setPhase("idle");
      setDraft(null);
      setDbError(null);

      const speechSupported = isSpeechRecognitionSupported();
      setSupported(speechSupported);

      // Check microphone permission status via Permissions API
      getPermissionStatus("microphone").then((status) => {
        setMicStatus(status);
      });
    }
  }, [open, preferredLanguage]);

  // Stop recognition if sheet closes while recording
  useEffect(() => {
    if (!open && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, [open]);

  // Recheck permission when sheet regains focus (user may have changed browser settings)
  useEffect(() => {
    if (!open) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && phase === "idle") {
        getPermissionStatus("microphone").then((status) => {
          setMicStatus(status);
        });
      }
    };

    const handleFocus = () => {
      if (phase === "idle") {
        getPermissionStatus("microphone").then((status) => {
          setMicStatus(status);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [open, phase]);

  const handleStart = useCallback(async () => {
    setError(null);
    setTranscript("");
    setInterim("");
    setDraft(null);
    setDbError(null);

    // Check speech recognition support
    if (!isSpeechRecognitionSupported()) {
      setSupported(false);
      setError(t.notSupported);
      return;
    }

    // Check microphone permission status first
    const currentStatus = await getPermissionStatus("microphone");
    setMicStatus(currentStatus);

    // If status is unknown or prompt, request access via getUserMedia
    // This triggers the browser's permission prompt
    if (currentStatus === "unknown" || currentStatus === "prompt") {
      const result = await requestMicrophone();
      if (!result.granted) {
        if (result.error === "denied") {
          setMicStatus("denied");
          setError(t.micDenied);
          setShowHelp(true);
        } else if (result.error === "no-device") {
          setError(t.noMicrophone);
        } else if (result.error === "busy") {
          setError(t.micBusy);
        } else if (result.error === "insecure") {
          setError(t.insecureContext);
        } else if (result.error === "unsupported") {
          setSupported(false);
          setError(t.notSupported);
        } else {
          setError(t.micError);
        }
        return;
      }
      // Permission granted — stop the temporary audio tracks immediately
      // SpeechRecognition will manage its own audio stream
      stopMediaTracks(result.stream);
      setMicStatus("granted");
    } else if (currentStatus === "denied") {
      setError(t.micDenied);
      setShowHelp(true);
      return;
    } else if (currentStatus === "unsupported") {
      setSupported(false);
      setError(t.notSupported);
      return;
    }

    // Start speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = language;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setRecording(true);
      setPhase("recording");
    };

    rec.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      if (finalText) setTranscript(finalText);
      setInterim(interimText);
    };

    rec.onerror = (event) => {
      setRecording(false);
      setPhase("idle");

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMicStatus("denied");
        setError(t.micDenied);
        setShowHelp(true);
      } else if (event.error === "no-speech") {
        setError(t.noTranscript);
      } else if (event.error === "language-not-supported") {
        setError(t.notSupportedLanguage);
      } else {
        setError(t.micError);
      }
    };

    rec.onend = () => {
      setRecording(false);
      recognitionRef.current = null;

      setTranscript((currentTranscript) => {
        if (currentTranscript && currentTranscript.trim()) {
          const parsed = parseVoiceStatement(currentTranscript, language);
          if (parsed) {
            setDraft(parsed);
            setPhase("reviewing");
          } else {
            setPhase("idle");
            setError(t.couldNotParse);
          }
        } else {
          setPhase("idle");
        }
        return currentTranscript;
      });
    };

    recognitionRef.current = rec;

    try {
      rec.start();
    } catch {
      setError(t.micError);
      setRecording(false);
      setPhase("idle");
    }
  }, [language, t]);

  const handleStop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  const handleCancelRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setRecording(false);
    setPhase("idle");
    setTranscript("");
    setInterim("");
  }, []);

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleRetry = () => {
    setTranscript("");
    setInterim("");
    setDraft(null);
    setError(null);
    setDbError(null);
    setPhase("idle");
    // Recheck permission on retry
    getPermissionStatus("microphone").then((status) => {
      setMicStatus(status);
    });
  };

  const validateDraft = () => {
    if (!draft) return false;
    const amt = parseFloat(draft.amount);
    if (isNaN(amt) || amt <= 0) return false;
    if (!draft.description || !draft.description.trim()) return false;
    if (!draft.transaction_date) return false;
    if (!draft.type || (draft.type !== "income" && draft.type !== "expense")) return false;
    return true;
  };

  const handleConfirm = async () => {
    if (!validateDraft()) {
      setError(t.couldNotParse);
      return;
    }

    setPhase("saving");
    setDbError(null);

    const result = await onSave({
      type: draft.type,
      amount: parseFloat(draft.amount),
      description: draft.description.trim(),
      category: draft.category,
      transaction_date: draft.transaction_date,
      payment_method: draft.payment_method || null,
      notes: draft.notes || null,
    });

    if (result?.error) {
      setDbError(result.error.message || t.saveFailed);
      setPhase("reviewing");
      return;
    }

    setPhase("saved");
    if (onDataChange) onDataChange();

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClose = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    onClose();
  };

  const displayTranscript = transcript || interim;
  const availableCategories = categoryKeys.filter((k) =>
    draft?.type === "income" ? k === "income" : k !== "income"
  );

  // Determine error display: if help dialog is shown, suppress inline error
  const showInlineError = error && !showHelp;

  return (
    <BottomSheet open={open} onClose={handleClose} title={t.title}>
      <div className="space-y-4">
        {/* Language selector */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-ivory-200 mb-2">
            <Globe size={15} className="text-charcoal-400" />
            {t.languageLabel}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                disabled={recording}
                className={cn(
                  "py-2.5 rounded-xl text-sm font-medium transition-all border",
                  language === lang.code
                    ? "bg-forest-500/15 border-forest-400/40 text-forest-300"
                    : "bg-charcoal-800/60 border-[var(--border)] text-charcoal-400 hover:text-ivory-200",
                  recording && "opacity-50 cursor-not-allowed"
                )}
              >
                {lang.nativeLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Unsupported browser notice */}
        {!supported && (
          <div className="flex items-start gap-2 text-sm text-accent-400 bg-accent-500/10 border border-accent-500/20 rounded-xl px-3 py-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{t.notSupported}</span>
          </div>
        )}

        {/* Inline error messages (suppressed when help dialog is showing) */}
        {showInlineError && (
          <div className="flex items-start gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2.5 animate-fade">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Microphone denied recovery UI */}
        {showHelp && micStatus === "denied" && phase === "idle" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-3">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-error mb-0.5">{t.micRecoveryTitle}</p>
                <p className="text-charcoal-300 text-xs leading-relaxed">{t.micRecoveryDesc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setShowHelp(false)}>
                {t.cancel}
              </Button>
              <Button variant="outline" fullWidth onClick={() => setShowHelp(true)}>
                {t.openHelp}
              </Button>
              <Button fullWidth onClick={handleStart}>
                {t.tryAgain}
              </Button>
            </div>
          </div>
        )}

        {/* Recording phase */}
        {phase === "idle" && supported && !showHelp && (
          <div className="flex flex-col items-center py-4">
            <button
              onClick={handleStart}
              className="relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95"
              style={{ backgroundColor: "rgba(79, 143, 108, 0.15)" }}
            >
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#4f8f6c" }}
              >
                <Mic size={28} className="text-ivory-50" />
              </div>
            </button>
            <p className="mt-5 text-sm font-medium text-ivory-100">{t.tapToStart}</p>
            <p className="mt-1.5 text-xs text-charcoal-400 text-center max-w-xs">{t.instructions}</p>
          </div>
        )}

        {/* Recording in progress */}
        {phase === "recording" && (
          <div className="flex flex-col items-center py-4">
            <button
              onClick={handleStop}
              className="relative h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95"
              style={{ backgroundColor: "rgba(192, 72, 61, 0.15)" }}
            >
              <span className="absolute inset-0 rounded-full bg-error/20 animate-ping" />
              <span
                className="absolute inset-2 rounded-full bg-error/15 animate-ping"
                style={{ animationDelay: "0.3s" }}
              />
              <div
                className="relative h-16 w-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#c0483d" }}
              >
                <Square size={24} className="text-ivory-50" />
              </div>
            </button>
            <p className="mt-5 text-sm font-medium text-error">{t.listening}</p>
            <p className="mt-1.5 text-xs text-charcoal-400 text-center max-w-xs">{t.recordingInstructions}</p>

            {/* Live transcript */}
            {displayTranscript && (
              <div className="w-full mt-4 rounded-xl bg-charcoal-800/60 border border-[var(--border)] px-4 py-3">
                <p className="text-sm text-ivory-100 leading-relaxed">
                  {transcript}
                  <span className="text-charcoal-400">{interim}</span>
                </p>
              </div>
            )}

            <button
              onClick={handleCancelRecording}
              className="mt-4 flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-ivory-200 transition-colors"
            >
              <X size={14} />
              {t.cancelRecording}
            </button>
          </div>
        )}

        {/* Review phase */}
        {phase === "reviewing" && draft && (
          <>
            {/* Transcript display */}
            {transcript && (
              <div className="rounded-xl bg-charcoal-800/60 border border-[var(--border)] px-4 py-3">
                <p className="text-xs text-charcoal-400 mb-1">{t.transcript}</p>
                <p className="text-sm text-ivory-100 leading-relaxed">{transcript}</p>
              </div>
            )}

            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-charcoal-800/60 rounded-xl border border-[var(--border)]">
              <button
                onClick={() => updateDraft("type", "expense")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  draft.type === "expense" ? "bg-error/15 text-error" : "text-charcoal-400"
                )}
              >
                <ArrowDownLeft size={16} />
                {t.expense}
              </button>
              <button
                onClick={() => {
                  updateDraft("type", "income");
                  updateDraft("category", "income");
                }}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  draft.type === "income" ? "bg-forest-500/15 text-forest-300" : "text-charcoal-400"
                )}
              >
                <ArrowUpRight size={16} />
                {t.income}
              </button>
            </div>

            {/* Description */}
            <Input
              label={t.description}
              value={draft.description}
              onChange={(e) => updateDraft("description", e.target.value)}
              leftIcon={<Tag size={18} />}
            />

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t.amount}
                type="number"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => updateDraft("amount", e.target.value)}
                leftIcon={<span className="text-charcoal-400 text-base font-medium">₹</span>}
              />
              <Input
                label={t.date}
                type="date"
                value={draft.transaction_date}
                onChange={(e) => updateDraft("transaction_date", e.target.value)}
                leftIcon={<Calendar size={18} />}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-ivory-200 mb-2">{t.category}</label>
              <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                {availableCategories.map((key) => {
                  const cat = getCategory(key);
                  const Icon = cat.icon;
                  const isSelected = draft.category === key;
                  return (
                    <button
                      key={key}
                      onClick={() => updateDraft("category", key)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all border",
                        isSelected ? "border-2" : "bg-charcoal-800/60 border-[var(--border)] text-charcoal-400 hover:text-ivory-200"
                      )}
                      style={isSelected ? { backgroundColor: cat.bg, borderColor: cat.color, color: cat.color } : {}}
                    >
                      <Icon size={13} />
                      <span className="truncate">{cat.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-sm font-medium text-ivory-200 mb-2">{t.paymentMethod}</label>
              <div className="relative">
                <CreditCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
                <select
                  value={draft.payment_method || ""}
                  onChange={(e) => updateDraft("payment_method", e.target.value || null)}
                  className="w-full h-12 rounded-xl bg-charcoal-800 border border-[var(--border-strong)] text-ivory-50 text-sm pl-11 pr-4 focus:outline-none focus:border-forest-400/60 focus:ring-2 focus:ring-forest-400/20 transition-all appearance-none"
                >
                  <option value="">{t.selectMethod}</option>
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <Input
              label={t.notes}
              value={draft.notes || ""}
              onChange={(e) => updateDraft("notes", e.target.value)}
              leftIcon={<FileText size={18} />}
            />

            {/* DB error */}
            {dbError && (
              <div className="flex items-start gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2.5 animate-fade">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{dbError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" fullWidth onClick={handleRetry} disabled={phase === "saving"}>
                {t.retry}
              </Button>
              <Button fullWidth onClick={handleConfirm} disabled={!validateDraft()}>
                {t.confirm}
              </Button>
            </div>
          </>
        )}

        {/* Saved confirmation */}
        {phase === "saved" && (
          <div className="flex flex-col items-center py-8 animate-fade">
            <div className="h-14 w-14 rounded-2xl bg-forest-500/15 flex items-center justify-center mb-3">
              <Check size={28} className="text-forest-300" />
            </div>
            <p className="text-sm font-medium text-forest-300">{t.saved}</p>
          </div>
        )}

        {/* Manual entry fallback */}
        {phase === "idle" && !showHelp && (
          <button
            onClick={() => {
              handleClose();
              if (onManualEntry) onManualEntry();
            }}
            className="w-full flex items-center justify-center gap-2 text-sm text-charcoal-400 hover:text-ivory-200 transition-colors pt-2"
          >
            <Keyboard size={15} />
            {t.manualEntry}
          </button>
        )}
      </div>

      {/* Permission help dialog */}
      <PermissionHelpDialog
        open={showHelp}
        onClose={() => setShowHelp(false)}
        permissionType="microphone"
        onRetry={handleStart}
        lang={language}
      />
    </BottomSheet>
  );
}
