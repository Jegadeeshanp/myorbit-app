/**
 * Rule-based transaction parser for MyOrbit.
 * No AI, no external NLP — instant, deterministic, always returns a result.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  type: 'expense' | 'income';
  keywords?: string[];
};

export type ParsedTransaction = {
  amount: number;
  type: 'expense' | 'income';
  category: string;
  categoryId: string | null;
  account: string;
  note: string;
  confidence: 'high' | 'medium' | 'low';
  suggestion?: string;
};

// ── Account keyword map ───────────────────────────────────────────────────────

export const ACCOUNT_MAP: Record<string, string[]> = {
  SBI:            ['sbi', 'state bank', 'yono'],
  HDFC:           ['hdfc', 'hdfc bank', 'regalia', 'millennia'],
  ICICI:          ['icici', 'amazon pay icici'],
  Axis:           ['axis', 'flipkart axis'],
  Kotak:          ['kotak'],
  'Yes Bank':     ['yes bank', 'yesbank'],
  UPI:            ['upi', 'gpay', 'google pay', 'phonepe', 'paytm', 'bhim'],
  Cash:           ['cash', 'wallet', 'hand'],
  Rupay:          ['rupay'],
  'Credit Card':  ['credit card', 'cc', 'visa', 'mastercard'],
};

// ── Built-in category fallback keywords ──────────────────────────────────────

const BUILTIN_KEYWORDS: Record<string, string[]> = {
  Food:           ['food', 'meal', 'lunch', 'dinner', 'breakfast', 'snack', 'eat', 'eating', 'bite'],
  Groceries:      ['grocery', 'groceries', 'vegetable', 'fruit', 'milk', 'supermarket', 'kirana', 'bigbasket', 'blinkit', 'zepto'],
  Restaurants:    ['restaurant', 'cafe', 'coffee', 'zomato', 'swiggy', 'hotel', 'biryani', 'pizza', 'burger'],
  Fuel:           ['fuel', 'petrol', 'diesel', 'gas station', 'pump', 'hp', 'bharat', 'indian oil'],
  Transport:      ['transport', 'bus', 'auto', 'rickshaw', 'cab', 'uber', 'ola', 'metro', 'train', 'rapido'],
  Utilities:      ['electricity', 'water', 'gas', 'bill', 'utility'],
  Internet:       ['internet', 'broadband', 'wifi', 'jio', 'airtel', 'bsnl', 'vi', 'vodafone', 'fiber'],
  Mobile:         ['mobile', 'phone', 'sim', 'recharge', 'prepaid', 'postpaid'],
  Shopping:       ['shopping', 'clothes', 'shirt', 'shoes', 'fashion', 'amazon', 'flipkart', 'myntra', 'dress'],
  Subscriptions:  ['subscription', 'netflix', 'hotstar', 'prime', 'spotify', 'youtube', 'disney', 'zee5'],
  Medical:        ['medical', 'medicine', 'doctor', 'hospital', 'pharmacy', 'health', 'clinic', 'apollo'],
  Insurance:      ['insurance', 'lic', 'premium', 'policy', 'term', 'cover'],
  Travel:         ['travel', 'flight', 'trip', 'irctc', 'makemytrip', 'goibibo', 'booking'],
  Education:      ['education', 'school', 'college', 'course', 'fees', 'book', 'study', 'tuition'],
  Rent:           ['rent', 'house rent', 'pg', 'hostel', 'maintenance', 'society'],
  Salary:         ['salary', 'sal', 'ctc', 'payroll', 'stipend', 'wages'],
  Freelance:      ['freelance', 'client', 'project payment', 'invoice', 'consulting'],
  Investment:     ['investment', 'mutual fund', 'sip', 'nifty', 'stocks', 'shares', 'zerodha', 'groww', 'demat'],
  Loan:           ['loan', 'emi', 'repay', 'interest', 'principal'],
  Cashback:       ['cashback', 'cash back', 'reward', 'refund', 'return', 'reversal'],
  Gifts:          ['gift', 'present', 'surprise', 'donation', 'charity'],
  Miscellaneous:  ['misc', 'miscellaneous', 'general'],
};

// Income category names (used for type inference when no user category matches)
const INCOME_CATEGORY_NAMES = new Set([
  'salary', 'freelance', 'cashback', 'investment', 'dividends',
  'interest', 'rental income', 'bonus', 'refund', 'other income',
]);

// Written-number words → digit (handles Indian spoken inputs)
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
  lakh: 100000, lac: 100000,
};

// ── Step 1: Clean input ───────────────────────────────────────────────────────

export function cleanText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/₹/g, '')
    .replace(/rs\.?/gi, '')
    .replace(/rupees?/gi, '')
    .replace(/inr/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Step 2: Extract amount ────────────────────────────────────────────────────

export function extractAmount(text: string): number {
  // Shorthand: 10k, 2.5l
  const shorthand = text.match(/(\d+(?:\.\d+)?)\s*([kl])\b/);
  if (shorthand) {
    const n = parseFloat(shorthand[1]);
    return shorthand[2] === 'k' ? Math.round(n * 1000) : Math.round(n * 100000);
  }

  // Standard number
  const numMatch = text.match(/\b(\d+(?:\.\d{1,2})?)\b/);
  if (numMatch) return parseFloat(numMatch[1]);

  // Written numbers: "fifty", "two hundred", etc.
  const tokens = text.split(/\s+/);
  let total = 0, current = 0, found = false;
  for (const token of tokens) {
    const val = NUMBER_WORDS[token];
    if (val === undefined) continue;
    found = true;
    if (val === 100)       { current = current === 0 ? 100 : current * 100; }
    else if (val >= 1000)  { current = (current || 1) * val; total += current; current = 0; }
    else                   { current += val; }
  }
  if (found) return total + current;

  return 0;
}

// ── Step 3: Detect category ───────────────────────────────────────────────────

export function detectCategory(
  text: string,
  categories: Category[],
): { name: string; id: string | null; type: 'expense' | 'income' } {
  const lower = text.toLowerCase();

  // Priority 1 — exact category name match
  for (const cat of categories) {
    if (lower.includes(cat.name.toLowerCase())) {
      return { name: cat.name, id: cat.id, type: cat.type };
    }
  }

  // Priority 2 — user-defined keywords
  for (const cat of categories) {
    if (cat.keywords?.some(kw => lower.includes(kw.toLowerCase()))) {
      return { name: cat.name, id: cat.id, type: cat.type };
    }
  }

  // Priority 3 — built-in keyword map
  for (const [catName, keywords] of Object.entries(BUILTIN_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      const userCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (userCat) return { name: userCat.name, id: userCat.id, type: userCat.type };
      const isIncome = INCOME_CATEGORY_NAMES.has(catName.toLowerCase());
      return { name: catName, id: null, type: isIncome ? 'income' : 'expense' };
    }
  }

  return { name: 'Other', id: null, type: 'expense' };
}

// ── Step 4: Detect account ────────────────────────────────────────────────────

export function detectAccount(text: string): string {
  const lower = text.toLowerCase();
  // Sort by longest keyword first to prefer more specific matches
  const entries = Object.entries(ACCOUNT_MAP).sort(
    ([, a], [, b]) => Math.max(...b.map(k => k.length)) - Math.max(...a.map(k => k.length)),
  );
  for (const [account, keywords] of entries) {
    if (keywords.some(kw => lower.includes(kw))) return account;
  }
  return 'Unknown';
}

// ── Step 5: Build note ────────────────────────────────────────────────────────

function buildNote(text: string, category: string): string {
  const allAccountKws = Object.values(ACCOUNT_MAP).flat();
  const allBuiltinKws = Object.values(BUILTIN_KEYWORDS).flat();

  const note = text
    .replace(/\b\d+(?:\.\d{1,2})?\b/g, '')
    .replace(/\b\d+(?:\.\d+)?\s*[kl]\b/g, '')
    .split(/\s+/)
    .filter(t => {
      const tl = t.toLowerCase();
      return (
        t.length > 1 &&
        !allAccountKws.includes(tl) &&
        !allBuiltinKws.includes(tl) &&
        tl !== category.toLowerCase()
      );
    })
    .join(' ')
    .trim();

  return note || category;
}

// ── Step 6: Suggestion ────────────────────────────────────────────────────────

function buildSuggestion(text: string, categoryName: string): string | undefined {
  if (categoryName !== 'Other') return undefined;
  const tokens = text.split(/\s+/).filter(t => t.length > 2 && !/^\d/.test(t));
  if (tokens.length > 0) return `Consider creating a category for "${tokens[0]}"`;
  return undefined;
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseTransaction(
  input: string,
  categories: Category[] = [],
): ParsedTransaction {
  if (!input?.trim()) {
    return { amount: 0, type: 'expense', category: 'Other', categoryId: null, account: 'Unknown', note: '', confidence: 'low' };
  }

  const cleaned  = cleanText(input);
  const amount   = extractAmount(cleaned);
  const { name: category, id: categoryId, type } = detectCategory(cleaned, categories);
  const account  = detectAccount(cleaned);
  const note     = buildNote(cleaned, category);
  const suggestion = buildSuggestion(cleaned, category);

  const score = (amount > 0 ? 1 : 0) + (category !== 'Other' ? 1 : 0) + (account !== 'Unknown' ? 1 : 0);
  const confidence: 'high' | 'medium' | 'low' = score === 3 ? 'high' : score >= 1 ? 'medium' : 'low';

  return { amount, type, category, categoryId, account, note, confidence, suggestion };
}

// ── Test suite ────────────────────────────────────────────────────────────────

export const PARSER_TESTS = [
  {
    input: '50 rupee office food sbi rupay',
    expected: { amount: 50, category: 'Food', account: 'SBI', confidence: 'high' },
  },
  {
    input: '₹1500 zomato biryani hdfc',
    expected: { amount: 1500, category: 'Restaurants', account: 'HDFC', confidence: 'high' },
  },
  {
    input: 'salary credited 45000 gpay',
    expected: { amount: 45000, category: 'Salary', type: 'income', account: 'UPI', confidence: 'high' },
  },
  {
    input: 'netflix subscription 649',
    expected: { amount: 649, category: 'Subscriptions', account: 'Unknown', confidence: 'medium' },
  },
  {
    input: 'random text without anything useful',
    expected: { amount: 0, category: 'Other', account: 'Unknown', confidence: 'low' },
  },
] as const;
