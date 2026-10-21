// Multilingual voice transaction parser.
// Recognizes spoken expense/income statements in Gujarati, Hindi, and English.
// Normalizes Gujarati and Hindi numerals to standard digits.
// Never invents missing details — unclear fields are left null for user review.

// --- Numeral maps ---

const GUJARATI_DIGITS = "૦૧૨૩૪૫૬૭૮૯";
const HINDI_DIGITS = "०१२३४५६७८९";

function normalizeDigits(text) {
  if (!text) return text;
  let result = text;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(GUJARATI_DIGITS[i], String(i));
    result = result.replaceAll(HINDI_DIGITS[i], String(i));
  }
  return result;
}

// Normalize Indian number words to digits (limited but practical for voice)
const NUMBER_WORDS = {
  en: {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30,
    forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80,
    ninety: 90, hundred: 100, thousand: 1000, lakh: 100000, crores: 10000000,
  },
};

function tryWordNumber(text, lang) {
  const words = NUMBER_WORDS[lang];
  if (!words) return null;
  const lower = text.toLowerCase();
  const tokens = lower.match(/\b[\w]+\b/g);
  if (!tokens) return null;

  let total = 0;
  let current = 0;
  let foundAny = false;

  for (const tok of tokens) {
    if (tok in words) {
      foundAny = true;
      const val = words[tok];
      if (val === 100) {
        current = (current || 1) * 100;
      } else if (val === 1000 || val === 100000 || val === 10000000) {
        current = (current || 1) * val;
        total += current;
        current = 0;
      } else {
        current += val;
      }
    } else {
      if (current > 0) {
        total += current;
        current = 0;
      }
    }
  }
  total += current;
  return foundAny && total > 0 ? total : null;
}

// --- Currency & amount extraction ---

const CURRENCY_PATTERNS = [
  /(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i,
  /([\d,]+\.?\d*)\s*(?:Rs\.?|INR|₹|rupees?|રૂપિયા|રૂ|રુપિયા|रुपये|रुपया|रूपये)/i,
];

function parseAmount(text, lang) {
  const normalized = normalizeDigits(text);

  for (const pattern of CURRENCY_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ""));
      if (val > 0) return val;
    }
  }

  // Bare number after keywords like "spent", "paid", "received"
  const bare = normalized.match(/(?:^|\s)(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)(?:\s|$)/);
  if (bare) {
    const val = parseFloat(bare[1].replace(/,/g, ""));
    if (val > 0 && val < 10000000) return val;
  }

  // Word numbers (English only — Gujarati/Hindi word numbers are too complex for deterministic parsing)
  if (lang === "en") {
    const wordNum = tryWordNumber(normalized, "en");
    if (wordNum && wordNum > 0) return wordNum;
  }

  return null;
}

// --- Transaction type ---

const TYPE_KEYWORDS = {
  income: [
    // English
    /\breceived\b/i, /\bsalary\b/i, /\bincome\b/i, /\bearned\b/i, /\bgot\b/i, /\bdeposited\b/i, /\brefund\b/i, /\bcashback\b/i,
    // Gujarati
    /મળ્યા/, /પગાર/, /આવક/, /વળતર/,
    // Hindi
    /मिली/, /मिले/, /सैलरी/, /वेतन/, /आय/, /प्राप्त/, /वापस/,
  ],
  expense: [
    // English
    /\bspent\b/i, /\bpaid\b/i, /\bbought\b/i, /\bpurchase/i, /\bcharged\b/i, /\bcost\b/i, /\bexpense\b/i, /\bgave\b/i,
    // Gujarati
    /ખર્ચ/, /આપ્યા/, /ચૂકવ્યા/, /ખરીદી/, /વસૂલ/,
    // Hindi
    /खर्च/, /दिए/, /दीं?$/, /चुकाए/, /चुकाया/, /खरीद/, /व्यय/,
  ],
};

function parseType(text) {
  const normalized = normalizeDigits(text);
  for (const pattern of TYPE_KEYWORDS.income) {
    if (pattern.test(normalized)) return "income";
  }
  for (const pattern of TYPE_KEYWORDS.expense) {
    if (pattern.test(normalized)) return "expense";
  }
  return null;
}

// --- Payment method ---

const PAYMENT_METHODS = [
  { pattern: /\bupi\b/i, method: "UPI" },
  { pattern: /\bdebit\s*card\b|\bcard\s*debit\b/i, method: "Card" },
  { pattern: /\bcredit\s*card\b/i, method: "Card" },
  { pattern: /\bcard\b/i, method: "Card" },
  { pattern: /\bnet\s*banking\b|\bneft\b|\brtgs\b|\bimps\b/i, method: "Bank Transfer" },
  { pattern: /\bcash\b/i, method: "Cash" },
  { pattern: /\bwallet\b|\bpaytm\b|\bamazon\s*pay\b|\bphonepe\b|\bgoogle\s*pay\b|\bgpay\b/i, method: "UPI" },
];

function parsePaymentMethod(text) {
  const normalized = normalizeDigits(text);
  for (const { pattern, method } of PAYMENT_METHODS) {
    if (pattern.test(normalized)) return method;
  }
  return null;
}

// --- Category ---

const CATEGORY_KEYWORDS = [
  { pattern: /\bpetrol\b|\bdiesel\b|\bfuel\b|\bgas\b/i, category: "transport" },
  { pattern: /\bpetrol\b/i, category: "transport" }, // English mixed
  { pattern: /પેટ્રોલ|ડીઝલ|ઈંધણ/, category: "transport" },
  { pattern: /पेट्रोल|डीजल|ईंधन/, category: "transport" },
  { pattern: /\blunch\b|\bdinner\b|\bbreakfast\b|\bfood\b|\bmeal\b|\brestaurant\b|\bswiggy\b|\bzomato\b/i, category: "food" },
  { pattern: /જમવા|ભોજન|નાસ્તો|ખાણ|સ્વીગી|ઝોમાટો/, category: "food" },
  { pattern: /खाना|खाने|भोजन|नाश्ता|लंच|डिनर|जमवान/, category: "food" },
  { pattern: /\bcoffee\b|\bcafe\b|\btea\b|\bbeverage\b/i, category: "coffee" },
  { pattern: /ચા|કોફી/, category: "coffee" },
  { pattern: /चाय|कॉफी/, category: "coffee" },
  { pattern: /\bgrocery\b|\bgroceries\b/i, category: "shopping" },
  { pattern: /amazon|flipkart|myntra|ajio|snapdeal|shop|store|mart|bazaar/i, category: "shopping" },
  { pattern: /\bshopping\b|\bbought\b|\bpurchase/i, category: "shopping" },
  { pattern: /ખરીદી|શોપિંગ/, category: "shopping" },
  { pattern: /खरीद|खरीदारी|शॉपिंग/, category: "shopping" },
  { pattern: /\bnetflix\b|\bprime\b|\bhotstar\b|\bspotify\b|\bmovie\b|\bpvr\b|\binox\b/i, category: "entertainment" },
  { pattern: /ફિલ્મ|મૂવી|મનોરંજન/, category: "entertainment" },
  { pattern: /फिल्म|मूवी|मनोरंजन/, category: "entertainment" },
  { pattern: /\bhospital\b|\bpharmacy\b|\bmedical\b|\bclinic\b|\bdoctor\b/i, category: "health" },
  { pattern: /દવા|હોસ્પિટલ|ડોક્ટર/, category: "health" },
  { pattern: /दवा|अस्पताल|डॉक्टर/, category: "health" },
  { pattern: /\belectricity\b|\bwater\s*bill\b|\bgas\b|\bbroadband\b|\bmobile\s*bill\b|\brecharge\b|\brent\b|\bdth\b|\binternet\b/i, category: "home" },
  { pattern: /ભાડું|વીજળી|પાણી|ગેસ/, category: "home" },
  { pattern: /किराया|बिजली|पानी|गैस/, category: "home" },
  { pattern: /\bsalary\b|\bincome\b/i, category: "income" },
  { pattern: /પગાર|આવક/, category: "income" },
  { pattern: /सैलरी|वेतन|आय/, category: "income" },
  { pattern: /\bflight\b|\bhotel\b|\brailway\b|\btrain\b|\btravel\b|\bbooking\b/i, category: "travel" },
  { pattern: /ઉડાણ|હોટલ|ટ્રેન|મુસાફરી/, category: "travel" },
  { pattern: /उड़ान|होटल|ट्रेन|यात्रा/, category: "travel" },
  { pattern: /\beducation\b|\bcourse\b|\btuition\b|\bexam\b|\bcollege\b|\bschool\b/i, category: "education" },
  { pattern: /ભણતર|ફી|શાળા|કોલેજ/, category: "education" },
  { pattern: /शिक्षा|फीस|स्कूल|कॉलेज/, category: "education" },
  { pattern: /\bgift\b|\bdonation\b|\bcharity\b/i, category: "gifts" },
  { pattern: /ભેટ|દાન/, category: "gifts" },
  { pattern: /उपहार|दान/, category: "gifts" },
  { pattern: /\bsubscription\b|\bnetflix\b|\bspotify\b/i, category: "subscriptions" },
];

function parseCategory(text) {
  const normalized = normalizeDigits(text);
  for (const { pattern, category } of CATEGORY_KEYWORDS) {
    if (pattern.test(normalized)) return category;
  }
  return "other";
}

// --- Description ---

const STOP_WORDS = [
  // English
  "i", "today", "yesterday", "on", "for", "to", "from", "via", "using", "with", "at", "by", "in", "of", "the", "a", "an",
  "spent", "paid", "bought", "purchased", "received", "gave", "cost", "charged", "earned", "got",
  "rupees", "rs", "inr", "salary", "income", "refund", "cashback",
  "upi", "card", "debit", "credit", "cash", "wallet", "net", "banking", "online", "neft", "rtgs", "imps",
  "payment", "transaction", "amount", "bill", "deposit",
  // Gujarati (transliteration)
  "આજે", "મેં", "ખર્ચ્યા", "ખર્ચ", "આપ્યા", "ચૂકવ્યા", "ખરીદી", "મળ્યા", "પગાર", "રૂપિયા", "રૂ", "રુપિયા",
  "માટે", "થી", "ના", "ની", "એ", "અને",
  // Hindi
  "आज", "मैंने", "खर्च", "खर्चकिए", "खर्चहुए", "दिए", "चुकाए", "चुकाया", "खरीद", "मिली", "मिले",
  "सैलरी", "रुपये", "रुपया", "रूपये", "के", "लिए", "से", "ने", "को", "पर", "हुए", "किए",
];

function parseDescription(text) {
  const normalized = normalizeDigits(text);
  const stopRegex = new RegExp(
    "\\b(?:" + STOP_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b",
    "gi"
  );

  // Remove amounts, dates, currency symbols
  let cleaned = normalized
    .replace(/(?:Rs\.?|INR|₹)\s*[\d,]+\.?\d*/gi, "")
    .replace(/[\d,]+\.?\d*\s*(?:Rs\.?|INR|₹|rupees?|રૂપિયા|રૂ|રુપિયા|रुपये|रुपया|रूपये)/gi, "")
    .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, "")
    .replace(/[\d,]+\.?\d*/g, " ")
    .replace(stopRegex, " ")
    .replace(/[^\u0900-\u097F\u0A80-\u0AFF\w\s&.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length > 1) {
    // Capitalize Latin words, keep Indic as-is
    return cleaned
      .replace(/\b([a-z])/g, (_, c) => c.toUpperCase())
      .replace(/^[.\s-]+|[.\s-]+$/g, "")
      .substring(0, 60)
      .trim();
  }

  return null;
}

// --- Date ---

function toISODate(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

function parseDate(text) {
  const normalized = normalizeDigits(text);
  const now = new Date();

  if (/\btoday\b/i.test(normalized) || /આજે/.test(normalized) || /आज/.test(normalized)) {
    return toISODate(now);
  }

  if (/\byesterday\b/i.test(normalized) || /ગઈકાલે/.test(normalized) || /कल/.test(normalized)) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return toISODate(y);
  }

  return null;
}

// --- Main parse function ---

export function parseVoiceStatement(text, lang = "en-IN") {
  if (!text || !text.trim()) return null;

  const langCode = lang === "en-IN" ? "en" : lang === "gu-IN" ? "gu" : lang === "hi-IN" ? "hi" : "en";

  const amount = parseAmount(text, langCode);
  const type = parseType(text);
  const date = parseDate(text);
  const paymentMethod = parsePaymentMethod(text);
  const category = parseCategory(text);
  const description = parseDescription(text);

  if (!amount || amount <= 0) return null;

  return {
    id: crypto.randomUUID(),
    amount,
    description: description || "",
    transaction_date: date || toISODate(new Date()),
    category,
    type: type || "expense",
    payment_method: paymentMethod || null,
    notes: null,
  };
}

// Export normalizeDigits for testing
export { normalizeDigits };
