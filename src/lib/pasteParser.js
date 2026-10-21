// Deterministic parser for bank SMS, UPI notifications, card messages, and pasted expense text.
// Extracts transaction details without inventing missing fields.
// Each parsed result carries a `confidence` field and per-field flags for user review.

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const PAYMENT_METHODS = [
  { pattern: /\bupi\b/i, method: "UPI" },
  { pattern: /\bdebit\s*card\b|\bcard\s*debit\b/i, method: "Card" },
  { pattern: /\bcredit\s*card\b/i, method: "Card" },
  { pattern: /\bcard\b/i, method: "Card" },
  { pattern: /\bnet\s*banking\b|\bneft\b|\brtgs\b|\bimps\b/i, method: "Bank Transfer" },
  { pattern: /\bcash\b/i, method: "Cash" },
  { pattern: /\bwallet\b|\bpaytm\b|\bamazon\s*pay\b|\bphonepe\b|\bgoogle\s*pay\b|\bgpay\b/i, method: "UPI" },
];

const MERCHANT_KEYWORDS = [
  { pattern: /\bpetrol\b|\bdiesel\b|\bfuel\b|\bhp\s*petrol\b|\bindian\s*oil\b|\bbharat\s*petroleum\b|\breliance\s*fuel\b/i, category: "transport" },
  { pattern: /\bswiggy\b|\bzomato\b|\bdominos\b|\bpizza\b|\bkfc\b|\bmc\s*donald|mcdonald|restaurant|dineout|eatclub|foodpanda\b/i, category: "food" },
  { pattern: /\bgrocery\b|\bbigbasket\b|\bdmart\b|\breliance\s*fresh\b|\bmore\s*supermarket\b|\bgrofers\b|\blinkmypdf\b/i, category: "shopping" },
  { pattern: /amazon|flipkart|myntra|ajio|snapdeal|shop|store|mart|bazaar/i, category: "shopping" },
  { pattern: /\bnetflix\b|\bprime\s*video\b|\bhotstar\b|\bspotify\b|\byoutube\s*premium\b|\bmovie\b|\bpvr\b|\binox\b/i, category: "entertainment" },
  { pattern: /\bcoffee\b|\bcafe\b|\bstarbucks\b|\bte[a]\b|\bbeverage\b/i, category: "coffee" },
  { pattern: /\bhospital\b|\bpharmacy\b|\bmedical\b|\bclinic\b|\bapollo\b|\bmedplus\b|\bdoctor\b|\bdiagnostic\b/i, category: "health" },
  { pattern: /\belectricity\b|\bwater\s*bill\b|\bgas\b|\bbroadband\b|\bmobile\s*bill\b|\brecharge\b|\brent\b|\bdth\b|\binternet\b/i, category: "home" },
  { pattern: /\bsubscription\b|\bnetflix\b|\bspotify\b|\bprime\b/i, category: "subscriptions" },
  { pattern: /\bsalary\b|\bcredit\b|\binterest\b|\brefund\b|\bcashback\b|\breward\b|\bdividend\b/i, category: "income" },
  { pattern: /\beducation\b|\bcourse\b|\btuition\b|\bexam\b|\bcollege\b|\bschool\b|\bcoursera\b|\budemy\b/i, category: "education" },
  { pattern: /\bflight\b|\bhotel\b|\birctc\b|\brailway\b|\btrain\b|\btravel\b|\bbooking\b|\bmake.*trip\b|\bgoibibo\b/i, category: "travel" },
  { pattern: /\bgift\b|\bdonation\b|\bcharity\b/i, category: "gifts" },
];

// Direction keywords — only when explicitly stated
const INCOME_KEYWORDS = /\bcredited\b|\bcredit\b|\breceived\b|\bsalary\b|\brefund\b|\bcashback\b|\breward\b|\binterest\s*credited\b|\bdeposited\b|\btransferred\s*to\s*your\b/i;
const EXPENSE_KEYWORDS = /\bdebited\b|\bdebit\b|\bspent\b|\bpaid\b|\bpurchase\b|\bbill\b|\bcharged\b|\bwithdrawn\b|\btransfer.*to\b|\bsent.*to\b/i;

function parseAmount(text) {
  // Match patterns: Rs. 250.00, ₹1,250, INR 500, Rs 1200
  const match = text.match(/(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i);
  if (match) {
    const val = parseFloat(match[1].replace(/,/g, ""));
    if (val > 0) return val;
  }
  // Fallback: bare number with decimal — but only if it looks like a currency amount
  const bare = text.match(/(?<![\d.])\b(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)\b(?!\d)/);
  if (bare) {
    const val = parseFloat(bare[1].replace(/,/g, ""));
    if (val > 0 && val < 10000000) return val;
  }
  return null;
}

function parseDate(text) {
  const now = new Date();
  const currentYear = now.getFullYear();

  // "on 20 Oct 2026" or "on 20 Oct" or "20-Oct-2026"
  // Build a regex that only matches real month names to avoid false positives like "00 debited"
  const monthNames = Object.keys(MONTH_MAP).join("|");
  const dmy = text.match(new RegExp("\\b(\\d{1,2})[\\s-/](" + monthNames + ")[\\s-/](\\d{2,4})?\\b", "i"));
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const monthName = dmy[2].toLowerCase().slice(0, 4);
    const month = MONTH_MAP[monthName];
    const year = dmy[3] ? parseInt(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3], 10) : currentYear;
    if (month !== undefined && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      if (d <= now && d.getFullYear() === year) return toISODate(d);
    }
  }

  // "on 20/10/2026" or "20-10-2026" (DD/MM/YYYY Indian format)
  const numeric = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (numeric) {
    const day = parseInt(numeric[1], 10);
    const month = parseInt(numeric[2], 10) - 1;
    const year = parseInt(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const d = new Date(year, month, day);
      if (d <= now) return toISODate(d);
    }
  }

  // "today"
  if (/\btoday\b/i.test(text)) return toISODate(now);

  // "yesterday"
  if (/\byesterday\b/i.test(text)) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return toISODate(y);
  }

  return null;
}

function toISODate(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().split("T")[0];
}

function parsePaymentMethod(text) {
  for (const { pattern, method } of PAYMENT_METHODS) {
    if (pattern.test(text)) return method;
  }
  return null;
}

function parseCategory(text) {
  for (const { pattern, category } of MERCHANT_KEYWORDS) {
    if (pattern.test(text)) return category;
  }
  return "other";
}

function parseType(text) {
  if (INCOME_KEYWORDS.test(text)) return "income";
  if (EXPENSE_KEYWORDS.test(text)) return "expense";
  return null;
}

function parseDescription(text) {
  // Remove amounts, dates, and common SMS boilerplate to isolate merchant name
  const monthNames = Object.keys(MONTH_MAP).join("|");
  let cleaned = text
    .replace(/(?:Rs\.?|INR|₹)\s*[\d,]+\.?\d*/gi, "")
    .replace(new RegExp("\\b\\d{1,2}[\\s/-](" + monthNames + ")[\\s/-]\\d{2,4}\\b", "gi"), "")
    .replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, "")
    .replace(/\b(?:your|the|a|an|account|has\s*been|was|is|are|of|to|from|on|via|using|for|with|at|by|in|that|this)\b/gi, " ")
    .replace(/\b(?:UPI\s*payment|payment|transaction|debit|credit|debited|credited|spent|paid|purchase|charged|withdrawn|successful|received|sent|transfer(?:red)?|amount|Rs\.?|INR|₹|salary|refund|cashback|reward|interest|deposit)\b/gi, " ")
    .replace(/\btoday\b|\byesterday\b/gi, "")
    .replace(/\b(?:UPI|IMPS|NEFT|RTGS|card|debit\s*card|credit\s*card|cash|wallet|net\s*banking|online)\b/gi, " ")
    .replace(/[^\w\s&.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length > 2) {
    // Capitalize first letter of each word for readability
    const capitalized = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
    // Clean up trailing/leading punctuation and whitespace
    return capitalized.replace(/^[.\s-]+|[.\s-]+$/g, "").substring(0, 60).trim();
  }

  return null;
}

function parseReference(text) {
  // UPI ref number, transaction ID, RRN
  const ref = text.match(/\b(?:ref(?:erence)?|txn|transaction|rrn|cheque)\s*(?:no\.?|id|number|#)?\s*[:\-]?\s*([A-Z0-9]{6,20})\b/i);
  if (ref) return ref[1];
  // Bare alphanumeric ID of 8+ chars
  const bareRef = text.match(/\b([A-Z0-9]{10,20})\b/);
  if (bareRef) return bareRef[1];
  return null;
}

// Split pasted text into individual message blocks
function splitMessages(text) {
  if (!text || !text.trim()) return [];
  // Split on blank lines, or lines that look like new SMS boundaries
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length > 1) return blocks;

  // Single block — try splitting on common message delimiters
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return [text.trim()];

  // If multiple lines look like separate SMS messages (each mentions an amount), split them
  const amountLines = lines.filter((l) => /(?:Rs\.?|INR|₹)\s*[\d,]+\.?\d*|\b\d+[.,]\d{2}\b/.test(l));
  if (amountLines.length > 1) {
    // Group consecutive lines into messages
    const messages = [];
    let current = [];
    for (const line of lines) {
      current.push(line);
      if (/(?:Rs\.?|INR|₹)\s*[\d,]+\.?\d*|\b\d+[.,]\d{2}\b/.test(line) && current.length > 0) {
        messages.push(current.join(" "));
        current = [];
      }
    }
    if (current.length > 0) messages.push(current.join(" "));
    return messages.filter(Boolean);
  }

  return [text.trim()];
}

// Parse a single message block into a transaction draft
function parseSingleMessage(text) {
  const amount = parseAmount(text);
  const date = parseDate(text);
  const paymentMethod = parsePaymentMethod(text);
  const category = parseCategory(text);
  const type = parseType(text);
  const description = parseDescription(text);
  const reference = parseReference(text);

  const fields = {};
  if (!description) fields.description = "Review needed";
  if (!date) fields.date = "Review needed";
  if (!type) fields.type = "Review needed";
  if (!paymentMethod) fields.paymentMethod = "Review needed";

  const confidence = [amount, description, date, type].filter(Boolean).length / 4;

  return {
    id: crypto.randomUUID(),
    amount,
    description: description || "",
    transaction_date: date || toISODate(new Date()),
    category,
    type: type || "expense",
    payment_method: paymentMethod || null,
    reference,
    notes: reference ? `Ref: ${reference}` : null,
    confidence,
    fields,
    selected: true,
  };
}

// Main entry point — parse pasted text into an array of transaction drafts
export function parsePastedTransactions(text) {
  const messages = splitMessages(text);
  const results = messages.map(parseSingleMessage);

  // Filter out entries with no extractable amount at all
  const valid = results.filter((r) => r.amount !== null && r.amount > 0);

  return valid;
}

// Detect duplicates among parsed transactions and against existing transactions
export function detectDuplicates(parsed, existing = []) {
  const marks = parsed.map(() => ({
    internal: false,
    existing: false,
    internalMatchId: null,
    existingMatchId: null,
  }));

  // Check internal duplicates (within the parsed batch)
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      if (isLikelyDuplicate(parsed[i], parsed[j])) {
        marks[i].internal = true;
        marks[i].internalMatchId = parsed[j].id;
        marks[j].internal = true;
        marks[j].internalMatchId = parsed[i].id;
      }
    }
  }

  // Check against existing transactions in DB
  for (let i = 0; i < parsed.length; i++) {
    for (const ex of existing) {
      if (isLikelyDuplicate(parsed[i], ex)) {
        marks[i].existing = true;
        marks[i].existingMatchId = ex.id;
        break;
      }
    }
  }

  return marks;
}

function isLikelyDuplicate(a, b) {
  const amountA = Number(a.amount);
  const amountB = Number(b.amount);
  if (isNaN(amountA) || isNaN(amountB) || amountA !== amountB) return false;

  const dateA = a.transaction_date || a.transaction_date;
  const dateB = b.transaction_date || b.transaction_date;
  const sameDate = dateA === dateB;

  const descA = (a.description || "").toLowerCase().trim();
  const descB = (b.description || "").toLowerCase().trim();
  const sameDesc = descA && descB && (descA === descB || descA.includes(descB) || descB.includes(descA));

  const refA = a.reference || a.notes || "";
  const refB = b.reference || b.notes || "";
  const sameRef = refA && refB && refA === refB;

  // Exact match: same amount + same date + same description or reference
  if (sameDate && (sameDesc || sameRef)) return true;

  // Possible match: same amount + same date (description unknown or different)
  if (sameDate) return true;

  return false;
}

// Validate a single parsed transaction draft before saving
export function validateDraft(draft) {
  const errors = {};
  if (!draft.description || !draft.description.trim()) {
    errors.description = "Description required";
  }
  const amt = Number(draft.amount);
  if (isNaN(amt) || amt <= 0) {
    errors.amount = "Valid positive amount required";
  }
  if (!draft.transaction_date) {
    errors.transaction_date = "Date required";
  }
  if (!draft.type || (draft.type !== "income" && draft.type !== "expense")) {
    errors.type = "Type required";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
