import { useState, useEffect, useCallback } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  CircleDollarSign,
  HelpCircle,
  ChevronRight,
  LogOut,
  Eye,
  Fingerprint,
  Mail,
  Globe,
  Moon,
  Mic,
  Camera,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
import TopBar from "../components/layout/TopBar";
import Card from "../components/ui/Card";
import Toggle from "../components/ui/Toggle";
import Button from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import PermissionHelpDialog from "../components/permissions/PermissionHelpDialog";
import { cn } from "../lib/format";
import {
  getPermissionStatus,
  requestMicrophone,
  requestCamera,
  requestNotifications,
  stopMediaTracks,
  onPermissionChange,
} from "../lib/permissions";
import { getPermissionStrings } from "../lib/permissionI18n";

function SettingRow({ icon: Icon, iconColor, iconBg, label, value, right, onClick, last }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick && !right}
      className={cn(
        "w-full flex items-center gap-3 px-1 py-3 transition-colors text-left",
        onClick && "hover:bg-charcoal-700/30 active:bg-charcoal-700/50 rounded-xl px-3 -mx-1",
        !last && "border-b border-[var(--border)]"
      )}
    >
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ivory-50">{label}</p>
        {value && <p className="text-xs text-charcoal-400 truncate">{value}</p>}
      </div>
      {right}
      {onClick && !right && (
        <ChevronRight size={18} className="text-charcoal-500 shrink-0" />
      )}
    </button>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider px-1 mb-2 mt-5">
      {children}
    </p>
  );
}

const PERMISSION_ICONS = {
  microphone: { icon: Mic, color: "#4f8f6c", bg: "rgba(79, 143, 108, 0.12)" },
  camera: { icon: Camera, color: "#3a6b9c", bg: "rgba(58, 107, 156, 0.12)" },
  photos: { icon: ImageIcon, color: "#d9983a", bg: "rgba(217, 152, 58, 0.12)" },
  notifications: { icon: Bell, color: "#a85c8b", bg: "rgba(168, 92, 139, 0.12)" },
};

const STATUS_COLORS = {
  granted: { bg: "rgba(79, 143, 108, 0.15)", color: "#4f8f6c", text: "text-forest-300" },
  denied: { bg: "rgba(192, 72, 61, 0.15)", color: "#c0483d", text: "text-error" },
  prompt: { bg: "rgba(217, 152, 58, 0.12)", color: "#d9983a", text: "text-accent-400" },
  unsupported: { bg: "rgba(124, 122, 116, 0.12)", color: "#7c7a74", text: "text-charcoal-400" },
  unknown: { bg: "rgba(124, 122, 116, 0.12)", color: "#7c7a74", text: "text-charcoal-400" },
};

function PermissionCard({ type, status, onRequest, onHelp, t, last }) {
  const { icon: Icon, color, bg } = PERMISSION_ICONS[type];
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  const statusLabel = t[`status${status.charAt(0).toUpperCase() + status.slice(1)}`] || t.statusUnknown;
  const desc = t[`${type === "microphone" ? "mic" : type === "photos" ? "photos" : type}Desc`];
  const privacyNote = t[`${type === "microphone" ? "mic" : type === "photos" ? "photos" : type}Privacy`];
  const canRequest = status === "prompt" || status === "unknown";
  const canRetry = status === "denied";

  return (
    <div className={cn("py-3.5", !last && "border-b border-[var(--border)]")}>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg, color }}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ivory-50">{t[type]}</p>
          <p className="text-xs text-charcoal-400 mt-0.5 leading-relaxed">{desc}</p>
        </div>
        <span
          className="px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
          style={{ backgroundColor: statusColor.bg, color: statusColor.color }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-1.5 mt-2.5 ml-12">
        <Lock size={11} className="shrink-0 mt-0.5 text-charcoal-500" />
        <p className="text-xs text-charcoal-500 leading-relaxed">{privacyNote}</p>
      </div>

      {/* Actions */}
      {(canRequest || canRetry || status === "unsupported") && (
        <div className="flex items-center gap-2 mt-3 ml-12">
          {canRequest && (
            <Button size="sm" variant="secondary" onClick={() => onRequest(type)}>
              {t.request}
            </Button>
          )}
          {canRetry && (
            <>
              <Button size="sm" variant="secondary" onClick={() => onHelp(type)}>
                {t.openHelp}
              </Button>
              <span className="text-xs text-charcoal-500">{t.changeInSettings}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsScreen({ user, preferences, onUpdatePreferences, onSignOut }) {
  const [prefs, setPrefs] = useState(preferences);
  const [permStatuses, setPermStatuses] = useState({
    microphone: "unknown",
    camera: "unknown",
    photos: "unknown",
    notifications: "unknown",
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpType, setHelpType] = useState("microphone");

  const lang = prefs?.voiceLanguage || "en-IN";
  const pt = getPermissionStrings(lang);

  const updatePref = (section, key, value) => {
    const newPrefs = {
      ...prefs,
      [section]: { ...prefs[section], [key]: value },
    };
    setPrefs(newPrefs);
    onUpdatePreferences?.(newPrefs);
  };

  // Check all permission statuses on mount
  useEffect(() => {
    const checkAll = async () => {
      const [mic, cam, photos, notif] = await Promise.all([
        getPermissionStatus("microphone"),
        getPermissionStatus("camera"),
        getPermissionStatus("photos"),
        getPermissionStatus("notifications"),
      ]);
      setPermStatuses({ microphone: mic, camera: cam, photos, notifications: notif });
    };
    checkAll();
  }, []);

  // Listen for permission changes
  useEffect(() => {
    const cleanups = [];
    const setupListener = async (type) => {
      const unsub = await onPermissionChange(type, (newStatus) => {
        setPermStatuses((prev) => ({ ...prev, [type]: newStatus }));
      });
      cleanups.push(unsub);
    };
    setupListener("microphone");
    setupListener("camera");
    return () => cleanups.forEach((fn) => fn());
  }, []);

  // Recheck permissions when the page becomes visible (user may have changed browser settings)
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        Promise.all([
          getPermissionStatus("microphone"),
          getPermissionStatus("camera"),
          getPermissionStatus("notifications"),
        ]).then(([mic, cam, notif]) => {
          setPermStatuses((prev) => ({
            ...prev,
            microphone: mic,
            camera: cam,
            notifications: notif,
          }));
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleRequestPermission = useCallback(async (type) => {
    if (type === "microphone") {
      const result = await requestMicrophone();
      if (result.granted) {
        stopMediaTracks(result.stream);
        setPermStatuses((prev) => ({ ...prev, microphone: "granted" }));
      } else if (result.error === "denied") {
        setPermStatuses((prev) => ({ ...prev, microphone: "denied" }));
        setHelpType("microphone");
        setHelpOpen(true);
      } else if (result.error === "no-device") {
        setPermStatuses((prev) => ({ ...prev, microphone: "unsupported" }));
      }
    } else if (type === "camera") {
      const result = await requestCamera();
      if (result.granted) {
        stopMediaTracks(result.stream);
        setPermStatuses((prev) => ({ ...prev, camera: "granted" }));
      } else if (result.error === "denied") {
        setPermStatuses((prev) => ({ ...prev, camera: "denied" }));
        setHelpType("camera");
        setHelpOpen(true);
      } else if (result.error === "no-device") {
        setPermStatuses((prev) => ({ ...prev, camera: "unsupported" }));
      }
    } else if (type === "notifications") {
      const result = await requestNotifications();
      if (result.granted) {
        setPermStatuses((prev) => ({ ...prev, notifications: "granted" }));
      } else if (result.error === "denied") {
        setPermStatuses((prev) => ({ ...prev, notifications: "denied" }));
        setHelpType("notifications");
        setHelpOpen(true);
      }
    }
  }, []);

  const handleHelp = useCallback((type) => {
    setHelpType(type);
    setHelpOpen(true);
  }, []);

  return (
    <div className="pb-24">
      <TopBar title="Settings" />

      <div className="px-4 pt-4 space-y-1">
        {/* Profile card */}
        <Card className="flex items-center gap-4">
          <Avatar initials={user.avatarInitials} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-ivory-50 truncate">{user.name}</h2>
            <p className="text-sm text-charcoal-400 truncate">{user.email}</p>

          </div>
        </Card>

        {/* Profile section */}
        <SectionTitle>Profile</SectionTitle>
        <Card padded={false} className="px-4 py-1">
          <SettingRow
            icon={User}
            iconColor="#4f8f6c"
            iconBg="rgba(79, 143, 108, 0.12)"
            label="Personal Information"
            value={user.name}
          />
          <SettingRow
            icon={Mail}
            iconColor="#3a6b9c"
            iconBg="rgba(58, 107, 156, 0.12)"
            label="Email"
            value={user.email}
            last
          />
        </Card>

        {/* Preferences section */}
        <SectionTitle>Preferences</SectionTitle>
        <Card padded={false} className="px-4 py-1">
          <SettingRow
            icon={CircleDollarSign}
            iconColor="#d9983a"
            iconBg="rgba(217, 152, 58, 0.12)"
            label="Currency"
            value={user.currency || "INR"}
            right={<ChevronRight size={18} className="text-charcoal-500" />}
            onClick={() => {}}
          />
          <SettingRow
            icon={Globe}
            iconColor="#7ba372"
            iconBg="rgba(123, 163, 114, 0.12)"
            label="Region"
            value="India"
            right={<ChevronRight size={18} className="text-charcoal-500" />}
            onClick={() => {}}
            last
          />
        </Card>

        {/* Appearance */}
        <SectionTitle>Appearance</SectionTitle>
        <Card padded={false} className="px-4 py-1">
          <SettingRow
            icon={Moon}
            iconColor="#5c7ca8"
            iconBg="rgba(92, 124, 168, 0.12)"
            label="Dark Mode"
            right={
              <Toggle
                checked={prefs.appearance === "dark"}
                onChange={(v) => setPrefs({ ...prefs, appearance: v ? "dark" : "light" })}
              />
            }
          />
          <SettingRow
            icon={Palette}
            iconColor="#a85c8b"
            iconBg="rgba(168, 92, 139, 0.12)"
            label="Theme"
            value="Forest Ivory"
            right={<ChevronRight size={18} className="text-charcoal-500" />}
            onClick={() => {}}
            last
          />
        </Card>

        {/* Notifications */}
        <SectionTitle>Notifications</SectionTitle>
        <Card padded={false} className="px-4 py-1">
          <SettingRow
            icon={Bell}
            iconColor="#4f8f6c"
            iconBg="rgba(79, 143, 108, 0.12)"
            label="Budget Alerts"
            value="Get notified at 80% budget"
            right={
              <Toggle
                checked={prefs.notifications.budgetAlerts}
                onChange={(v) => updatePref("notifications", "budgetAlerts", v)}
              />
            }
          />
          <SettingRow
            icon={Bell}
            iconColor="#3a6b9c"
            iconBg="rgba(58, 107, 156, 0.12)"
            label="Transaction Alerts"
            value="New transaction notifications"
            right={
              <Toggle
                checked={prefs.notifications.transactionAlerts}
                onChange={(v) => updatePref("notifications", "transactionAlerts", v)}
              />
            }
          />
          <SettingRow
            icon={Bell}
            iconColor="#d9983a"
            iconBg="rgba(217, 152, 58, 0.12)"
            label="Weekly Summary"
            value="Spending recap every Sunday"
            right={
              <Toggle
                checked={prefs.notifications.weeklySummary}
                onChange={(v) => updatePref("notifications", "weeklySummary", v)}
              />
            }
            last
          />
        </Card>

        {/* Privacy */}
        <SectionTitle>Privacy & Security</SectionTitle>
        <Card padded={false} className="px-4 py-1">
          <SettingRow
            icon={Eye}
            iconColor="#7c7a74"
            iconBg="rgba(124, 122, 116, 0.12)"
            label="Hide Amounts"
            value="Mask all amount values"
            right={
              <Toggle
                checked={prefs.privacy.hideAmounts}
                onChange={(v) => updatePref("privacy", "hideAmounts", v)}
              />
            }
          />
          <SettingRow
            icon={Fingerprint}
            iconColor="#4f8f6c"
            iconBg="rgba(79, 143, 108, 0.12)"
            label="Biometric Lock"
            value="Require Face ID / fingerprint"
            right={
              <Toggle
                checked={prefs.privacy.biometricLock}
                onChange={(v) => updatePref("privacy", "biometricLock", v)}
              />
            }
          />
          <SettingRow
            icon={Shield}
            iconColor="#c0483d"
            iconBg="rgba(192, 72, 61, 0.12)"
            label="Data & Privacy"
            value="Manage your data"
            right={<ChevronRight size={18} className="text-charcoal-500" />}
            onClick={() => {}}
            last
          />
        </Card>

        {/* Permissions & Privacy */}
        <SectionTitle>{pt.sectionTitle}</SectionTitle>
        <Card padded={false} className="px-4">
          <PermissionCard
            type="microphone"
            status={permStatuses.microphone}
            onRequest={handleRequestPermission}
            onHelp={handleHelp}
            t={pt}
          />
          <PermissionCard
            type="camera"
            status={permStatuses.camera}
            onRequest={handleRequestPermission}
            onHelp={handleHelp}
            t={pt}
          />
          <PermissionCard
            type="photos"
            status={permStatuses.photos}
            onRequest={handleRequestPermission}
            onHelp={handleHelp}
            t={pt}
          />
          <PermissionCard
            type="notifications"
            status={permStatuses.notifications}
            onRequest={handleRequestPermission}
            onHelp={handleHelp}
            t={pt}
            last
          />
        </Card>

        {/* Support */}
        <SectionTitle>Support</SectionTitle>
        <Card padded={false} className="px-4 py-1">
          <SettingRow
            icon={HelpCircle}
            iconColor="#5c7ca8"
            iconBg="rgba(92, 124, 168, 0.12)"
            label="Help Center"
            right={<ChevronRight size={18} className="text-charcoal-500" />}
            onClick={() => {}}
          />
          <SettingRow
            icon={HelpCircle}
            iconColor="#7ba372"
            iconBg="rgba(123, 163, 114, 0.12)"
            label="About SpendWise"
            value="Version 1.0.0"
            last
          />
        </Card>

        {/* Sign out */}
        <div className="pt-4">
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-error/10 border border-error/20 text-error font-medium text-sm hover:bg-error/15 transition-colors active:scale-[0.98]"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        <p className="text-center text-xs text-charcoal-500 pt-4 pb-2">
          SpendWise v1.0.0 — Phase 6
        </p>
      </div>

      <PermissionHelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        permissionType={helpType}
        onRetry={() => handleRequestPermission(helpType)}
        lang={lang}
      />
    </div>
  );
}
