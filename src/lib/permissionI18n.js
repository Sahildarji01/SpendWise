// Localized UI strings for the Permissions & Privacy settings section.
// Supports English (en-IN), Gujarati (gu-IN), and Hindi (hi-IN).

const PERMISSION_STRINGS = {
  "en-IN": {
    sectionTitle: "Permissions & Privacy",
    // Permission names
    microphone: "Microphone",
    camera: "Camera",
    photos: "Photos & Files",
    notifications: "Notifications",
    // Descriptions
    micDesc: "Used for Gujarati, Hindi, and English voice expense entry.",
    cameraDesc: "Used to capture receipts and expense documents when scanning is available.",
    photosDesc: "Used to upload receipt images and expense documents.",
    notificationsDesc: "Used for budget alerts and spending reminders.",
    // Status labels
    statusGranted: "Granted",
    statusDenied: "Denied",
    statusPrompt: "Not requested",
    statusUnsupported: "Unsupported",
    statusUnknown: "Unknown",
    // Actions
    request: "Request Access",
    retry: "Retry Access",
    openHelp: "Help",
    // Privacy notes
    micPrivacy: "Audio is only used while you are recording a voice transaction. No audio is stored.",
    cameraPrivacy: "Camera is only used while you are capturing a receipt. No video is stored.",
    photosPrivacy: "Files are only accessed when you choose to upload a receipt. No unrestricted photo-library access is needed.",
    notificationsPrivacy: "Notifications are sent by your browser for budget alerts. You can change this anytime.",
    // Help
    changeInSettings: "To change this permission, open your browser's site settings for SpendWise.",
  },
  "gu-IN": {
    sectionTitle: "પરવાનગીઓ અને પ્રાઇવસી",
    microphone: "માઇક્રોફોન",
    camera: "કૅમેરા",
    photos: "ફોટો અને ફાઇલો",
    notifications: "નોટિફિકેશન",
    micDesc: "ગુજરાતી, હિન્દી અને અંગ્રેજી વોઇસ ખર્ચ એન્ટ્રી માટે વપરાય છે.",
    cameraDesc: "સ્કેનિંગ ઉપલબ્ધ હોય ત્યારે રસીદ અને ખર્ચ દસ્તાવેજ કૅપ્ચર કરવા વપરાય છે.",
    photosDesc: "રસીદ ઇમેજ અને ખર્ચ દસ્તાવેજ અપલોડ કરવા વપરાય છે.",
    notificationsDesc: "બજેટ એલર્ટ અને ખર્ચ રિમાઇન્ડર માટે વપરાય છે.",
    statusGranted: "મંજૂર",
    statusDenied: "નકારાયેલ",
    statusPrompt: "વિનંતી નથી થઈ",
    statusUnsupported: "અસમર્થિત",
    statusUnknown: "અજ્ઞાત",
    request: "ઍક્સેસ વિનંતી",
    retry: "ફરી ઍક્સેસ",
    openHelp: "મદદ",
    micPrivacy: "ઓડિયો ફક્ત વોઇસ ટ્રાન્ઝેક્શન રેકોર્ડ કરતી વખતે વપરાય છે. કોઈ ઓડિયો સ્ટોર થતું નથી.",
    cameraPrivacy: "કૅમેરા ફક્ત રસીદ કૅપ્ચર કરતી વખતે વપરાય છે. કોઈ વિડિયો સ્ટોર થતો નથી.",
    photosPrivacy: "ફાઇલો ફક્ત તમે રસીદ અપલોડ કરવા પસંદ કરો ત્યારે ઍક્સેસ થાય છે. ફોટો લાઇબ્રેરીની અમર્યાદિત ઍક્સેસ જરૂરી નથી.",
    notificationsPrivacy: "નોટિફિકેશન તમારા બ્રાઉઝર દ્વારા બજેટ એલર્ટ માટે મોકલાય છે. તમે આને ગમે ત્યારે બદલી શકો છો.",
    changeInSettings: "આ પરવાનગી બદલવા માટે, તમારા બ્રાઉઝરની SpendWise માટે સાઇટ સેટિંગ્સ ખોલો.",
  },
  "hi-IN": {
    sectionTitle: "अनुमतियाँ और गोपनीयता",
    microphone: "माइक्रोफ़ोन",
    camera: "कैमरा",
    photos: "फ़ोटो और फ़ाइलें",
    notifications: "नोटिफिकेशन",
    micDesc: "गुजराती, हिन्दी और अंग्रेज़ी वॉइस खर्च प्रविष्टि के लिए उपयोग।",
    cameraDesc: "स्कैनिंग उपलब्ध होने पर रसीद और खर्च दस्तावेज़ कैप्चर करने के लिए उपयोग।",
    photosDesc: "रसीद इमेज और खर्च दस्तावेज़ अपलोड करने के लिए उपयोग।",
    notificationsDesc: "बजट अलर्ट और खर्च रिमाइंडर के लिए उपयोग।",
    statusGranted: "अनुमति",
    statusDenied: "अस्वीकृत",
    statusPrompt: "अनुरोध नहीं किया",
    statusUnsupported: "असमर्थित",
    statusUnknown: "अज्ञात",
    request: "एक्सेस अनुरोध",
    retry: "पुनः एक्सेस",
    openHelp: "सहायता",
    micPrivacy: "ऑडियो केवल वॉइस ट्रांजेक्शन रिकॉर्ड करते समय उपयोग होता है। कोई ऑडियो स्टोर नहीं होता।",
    cameraPrivacy: "कैमरा केवल रसीद कैप्चर करते समय उपयोग होता है। कोई वीडियो स्टोर नहीं होता।",
    photosPrivacy: "फ़ाइलें केवल तब एक्सेस होती हैं जब आप रसीद अपलोड चुनें। फ़ोटो लाइब्रेरी की अप्रतिबंधित एक्सेस आवश्यक नहीं।",
    notificationsPrivacy: "नोटिफिकेशन आपके ब्राउज़र द्वारा बजट अलर्ट के लिए भेजे जाते हैं। आप इसे कभी भी बदल सकते हैं।",
    changeInSettings: "इस अनुमति को बदलने के लिए, अपने ब्राउज़र की SpendWise के लिए साइट सेटिंग्स खोलें।",
  },
};

export function getPermissionStrings(langCode) {
  return PERMISSION_STRINGS[langCode] || PERMISSION_STRINGS["en-IN"];
}
