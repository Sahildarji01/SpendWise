import { Shield, Mic, Camera, Bell, ExternalLink } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { detectBrowser } from "../../lib/permissions";

const ICONS = {
  microphone: Mic,
  camera: Camera,
  notifications: Bell,
};

const HELP_STRINGS = {
  "en-IN": {
    title: "Permission Help",
    micTitle: "Microphone Access",
    cameraTitle: "Camera Access",
    notificationTitle: "Notification Access",
    browsers: {
      chrome_android: [
        "Tap the three-dot menu (⋮) in Chrome's top-right corner.",
        "Tap Settings, then scroll down and tap Site settings.",
        "Tap Microphone (or Camera) and find SpendWise in the list.",
        "Tap it and set permission to Allow.",
        "Return to SpendWise and tap Try Again.",
      ],
      chrome_desktop: [
        "Click the camera/microphone icon in Chrome's address bar (left of the star icon).",
        "Alternatively, click the three-dot menu (⋮) → Settings → Privacy and security → Site settings.",
        "Find Microphone (or Camera) and locate SpendWise.",
        "Set the permission to Allow.",
        "Refresh SpendWise and tap Try Again.",
      ],
      edge_desktop: [
        "Click the lock/camera icon in Edge's address bar.",
        "Alternatively, click the three-dot menu (⋯) → Settings → Cookies and site permissions.",
        "Find Microphone (or Camera) and locate SpendWise.",
        "Set the permission to Allow.",
        "Refresh SpendWise and tap Try Again.",
      ],
      safari_apple: [
        "Open Settings (System Settings on Mac, Settings app on iPhone/iPad).",
        "Scroll down and tap Privacy & Security (or Privacy on iOS).",
        "Tap Microphone (or Camera) and find SpendWise or Safari in the list.",
        "Enable the toggle next to it.",
        "Return to SpendWise and tap Try Again.",
      ],
      general: [
        "Open your browser's Settings or Preferences.",
        "Find the Privacy, Site settings, or Permissions section.",
        "Locate Microphone (or Camera) permissions.",
        "Find SpendWise in the list and set it to Allow.",
        "Return to SpendWise and tap Try Again.",
      ],
      notifications_blocked: [
        "Open your browser's Settings or Preferences.",
        "Find the Privacy, Site settings, or Notifications section.",
        "Locate SpendWise in the list of sites.",
        "Set notification permission to Allow, or remove the block.",
        "Refresh SpendWise and try again.",
      ],
    },
    tryAgain: "Try Again",
    close: "Close",
    openSettings: "Open Browser Settings",
    securityNote: "A website cannot change browser permissions for you. You must allow access manually in your browser or device settings.",
  },
  "gu-IN": {
    title: "પરવાનગી મદદ",
    micTitle: "માઇક્રોફોન ઍક્સેસ",
    cameraTitle: "કૅમેરા ઍક્સેસ",
    notificationTitle: "નોટિફિકેશન ઍક્સેસ",
    browsers: {
      chrome_android: [
        "ક્રોમના ઉપર જમણે ત્રણ-બિંદુ મેનુ (⋮) પર ટેપ કરો.",
        "સેટિંગ્સ પર ટેપ કરો, પછી નીચે સ્ક્રોલ કરીને સાઇટ સેટિંગ્સ પર ટેપ કરો.",
        "માઇક્રોફોન (અથવા કૅમેરા) પર ટેપ કરો અને સૂચિમાં SpendWise શોધો.",
        "તેના પર ટેપ કરો અને પરવાનગીને Allow પર સેટ કરો.",
        "SpendWise પર પાછા આવો અને ફરી પ્રયાસ કરો પર ટેપ કરો.",
      ],
      chrome_desktop: [
        "ક્રોમના એડ્રેસ બારમાં કૅમેરા/માઇક્રોફોન આઇકન પર ક્લિક કરો.",
        "અથવા, ત્રણ-બિંદુ મેનુ (⋮) → સેટિંગ્સ → પ્રાઇવસી અને સુરક્ષા → સાઇટ સેટિંગ્સ પર ક્લિક કરો.",
        "માઇક્રોફોન (અથવા કૅમેરા) શોધો અને SpendWise લોકેટ કરો.",
        "પરવાનગીને Allow પર સેટ કરો.",
        "SpendWise રિફ્રેશ કરો અને ફરી પ્રયાસ કરો પર ટેપ કરો.",
      ],
      edge_desktop: [
        "Edge ના એડ્રેસ બારમાં લોક/કૅમેરા આઇકન પર ક્લિક કરો.",
        "અથવા, ત્રણ-બિંદુ મેનુ (⋯) → સેટિંગ્સ → કુકીઝ અને સાઇટ પરવાનગીઓ પર ક્લિક કરો.",
        "માઇક્રોફોન (અથવા કૅમેરા) શોધો અને SpendWise લોકેટ કરો.",
        "પરવાનગીને Allow પર સેટ કરો.",
        "SpendWise રિફ્રેશ કરો અને ફરી પ્રયાસ કરો પર ટેપ કરો.",
      ],
      safari_apple: [
        "સેટિંગ્સ ખોલો (Mac પર System Settings, iPhone/iPad પર Settings એપ).",
        "નીચે સ્ક્રોલ કરો અને Privacy & Security પર ટેપ કરો.",
        "માઇક્રોફોન (અથવા કૅમેરા) પર ટેપ કરો અને સૂચિમાં SpendWise અથવા Safari શોધો.",
        "તેના આગળનો ટોગલ ચાલુ કરો.",
        "SpendWise પર પાછા આવો અને ફરી પ્રયાસ કરો પર ટેપ કરો.",
      ],
      general: [
        "તમારા બ્રાઉઝરની સેટિંગ્સ અથવા પ્રથામિકતાઓ ખોલો.",
        "Privacy, Site settings, અથવા Permissions વિભાગ શોધો.",
        "માઇક્રોફોન (અથવા કૅમેરા) પરવાનગીઓ શોધો.",
        "સૂચિમાં SpendWise શોધો અને તેને Allow પર સેટ કરો.",
        "SpendWise પર પાછા આવો અને ફરી પ્રયાસ કરો.",
      ],
      notifications_blocked: [
        "તમારા બ્રાઉઝરની સેટિંગ્સ ખોલો.",
        "Privacy, Site settings, અથવા Notifications વિભાગ શોધો.",
        "સૂચિમાં SpendWise શોધો.",
        "નોટિફિકેશન પરવાનગીને Allow પર સેટ કરો અથવા બ્લોક દૂર કરો.",
        "SpendWise રિફ્રેશ કરો અને ફરી પ્રયાસ કરો.",
      ],
    },
    tryAgain: "ફરી પ્રયાસ કરો",
    close: "બંધ કરો",
    openSettings: "બ્રાઉઝર સેટિંગ્સ ખોલો",
    securityNote: "વેબસાઇટ તમારા માટે બ્રાઉઝર પરવાનગીઓ બદલી શકતી નથી. તમારે બ્રાઉઝર અથવા ડિવાઇસ સેટિંગ્સમાં જાતે ઍક્સેસ આપવી પડશે.",
  },
  "hi-IN": {
    title: "अनुमति सहायता",
    micTitle: "माइक्रोफ़ोन एक्सेस",
    cameraTitle: "कैमरा एक्सेस",
    notificationTitle: "नोटिफिकेशन एक्सेस",
    browsers: {
      chrome_android: [
        "क्रोम के ऊपर दाहिने कोने में तीन-बिंदु मेनू (⋮) पर टैप करें।",
        "सेटिंग्स पर टैप करें, फिर नीचे स्क्रॉल करके साइट सेटिंग्स पर टैप करें।",
        "माइक्रोफ़ोन (या कैमरा) पर टैप करें और सूची में SpendWise खोजें।",
        "उस पर टैप करें और अनुमति को Allow पर सेट करें।",
        "SpendWise पर लौटें और पुनः प्रयास करें पर टैप करें।",
      ],
      chrome_desktop: [
        "क्रोम के एड्रेस बार में कैमरा/माइक्रोफ़ोन आइकन पर क्लिक करें।",
        "वैकल्पिक रूप से, तीन-बिंदु मेनू (⋮) → सेटिंग्स → गोपनीयता और सुरक्षा → साइट सेटिंग्स पर क्लिक करें।",
        "माइक्रोफ़ोन (या कैमरा) खोजें और SpendWise ढूंढें।",
        "अनुमति को Allow पर सेट करें।",
        "SpendWise रिफ्रेश करें और पुनः प्रयास करें पर टैप करें।",
      ],
      edge_desktop: [
        "Edge के एड्रेस बार में लॉक/कैमरा आइकन पर क्लिक करें।",
        "वैकल्पिक रूप से, तीन-बिंदु मेनू (⋯) → सेटिंग्स → कुकीज़ और साइट अनुमतियाँ पर क्लिक करें।",
        "माइक्रोफ़ोन (या कैमरा) खोजें और SpendWise ढूंढें।",
        "अनुमति को Allow पर सेट करें।",
        "SpendWise रिफ्रेश करें और पुनः प्रयास करें पर टैप करें।",
      ],
      safari_apple: [
        "सेटिंग्स खोलें (Mac पर System Settings, iPhone/iPad पर Settings ऐप)।",
        "नीचे स्क्रॉल करें और Privacy & Security पर टैप करें।",
        "माइक्रोफ़ोन (या कैमरा) पर टैप करें और सूची में SpendWise या Safari खोजें।",
        "उसके आगे का टॉगल चालू करें।",
        "SpendWise पर लौटें और पुनः प्रयास करें पर टैप करें।",
      ],
      general: [
        "अपने ब्राउज़र की सेटिंग्स या प्राथमिकताएँ खोलें।",
        "Privacy, Site settings, या Permissions अनुभाग खोजें।",
        "माइक्रोफ़ोन (या कैमरा) अनुमतियाँ खोजें।",
        "सूची में SpendWise ढूंढें और इसे Allow पर सेट करें।",
        "SpendWise पर लौटें और पुनः प्रयास करें।",
      ],
      notifications_blocked: [
        "अपने ब्राउज़र की सेटिंग्स खोलें।",
        "Privacy, Site settings, या Notifications अनुभाग खोजें।",
        "सूची में SpendWise ढूंढें।",
        "नोटिफिकेशन अनुमति को Allow पर सेट करें या ब्लॉक हटाएँ।",
        "SpendWise रिफ्रेश करें और पुनः प्रयास करें।",
      ],
    },
    tryAgain: "पुनः प्रयास करें",
    close: "बंद करें",
    openSettings: "ब्राउज़र सेटिंग्स खोलें",
    securityNote: "वेबसाइट आपके लिए ब्राउज़र अनुमतियाँ बदल नहीं सकती। आपको ब्राउज़र या डिवाइस सेटिंग्स में स्वयं एक्सेस देनी होगी।",
  },
};

function getHelpStrings(lang) {
  return HELP_STRINGS[lang] || HELP_STRINGS["en-IN"];
}

function getBrowserKey(browser, permissionType) {
  if (permissionType === "notifications") return "notifications_blocked";
  if (browser.name === "chrome" && browser.platform === "android") return "chrome_android";
  if (browser.name === "chrome") return "chrome_desktop";
  if (browser.name === "edge") return "edge_desktop";
  if (browser.name === "safari" && (browser.platform === "ios" || browser.platform === "mac")) return "safari_apple";
  return "general";
}

export default function PermissionHelpDialog({ open, onClose, permissionType = "microphone", onRetry, lang = "en-IN" }) {
  const browser = detectBrowser();
  const t = getHelpStrings(lang);
  const Icon = ICONS[permissionType] || Shield;
  const title = permissionType === "microphone" ? t.micTitle : permissionType === "camera" ? t.cameraTitle : t.notificationTitle;
  const browserKey = getBrowserKey(browser, permissionType);
  const steps = t.browsers[browserKey] || t.browsers.general;

  return (
    <Modal open={open} onClose={onClose} title={t.title}>
      <div className="space-y-4">
        {/* Icon + title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent-500/15 flex items-center justify-center">
            <Icon size={20} className="text-accent-400" />
          </div>
          <h3 className="text-sm font-semibold text-ivory-50">{title}</h3>
        </div>

        {/* Steps */}
        <ol className="space-y-2.5">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-charcoal-700 text-ivory-200 text-xs font-medium flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-ivory-200 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        {/* Security note */}
        <div className="flex items-start gap-2 text-xs text-charcoal-400 bg-charcoal-800/60 border border-[var(--border)] rounded-xl px-3 py-2.5">
          <Shield size={14} className="shrink-0 mt-0.5 text-charcoal-500" />
          <span>{t.securityNote}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose}>
            {t.close}
          </Button>
          {onRetry && (
            <Button fullWidth onClick={() => { onRetry(); onClose(); }}>
              {t.tryAgain}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
