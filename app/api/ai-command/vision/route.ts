/**
 * POST /api/ai-command/vision
 *
 * Accepts a base64 image of a financial document (bank statement, investment
 * portfolio, property valuation, net-worth screenshot, etc.) and:
 *   1. Uses Claude vision to extract account names + current values
 *   2. Fuzzy-matches extracted entries against the user's existing assets
 *   3. Updates matched asset `value` fields ONLY — no transactions are created
 *
 * Response:
 *   { success, action: 'UPDATE_ASSET', message, data: { parsed, updated[], unmatched[] } }
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptNumber, decryptNumber } from '@/lib/encryption';

export const runtime = 'nodejs';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedEntry {
  name:        string;
  value:       number;
  currency?:   string;
  accountType?: string;
  date?:       string;
}

interface VisionParsed {
  imageType:    string;   // 'bank_statement' | 'investment_portfolio' | 'property' | 'receipt' | 'unknown'
  institution?: string;
  date?:        string;
  currency:     string;
  entries:      ParsedEntry[];
  rawText?:     string;
}

interface UpdatedAsset {
  id:       string;
  name:     string;
  oldValue: number;
  newValue: number;
}

interface UnmatchedEntry {
  name:   string;
  value:  number;
  reason: string;
}

// ── Fuzzy match ───────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function bestMatch(
  needle: string,
  assets: { id: string; name: string; value: number; category: string }[],
): { asset: { id: string; name: string; value: number; category: string }; score: number } | null {
  const n = normalize(needle);
  let best: { asset: { id: string; name: string; value: number; category: string }; score: number } | null = null;

  for (const a of assets) {
    const h = normalize(a.name);
    // Exact or contains match → perfect score
    if (h === n || h.includes(n) || n.includes(h)) {
      return { asset: a, score: 1 };
    }
    const dist  = levenshtein(n, h);
    const score = 1 - dist / Math.max(n.length, h.length, 1);
    if (!best || score > best.score) best = { asset: a, score };
  }

  return best;
}

// ── Vision prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a financial document parser. Given an image of any financial document, extract structured data.

Return ONLY valid JSON matching this schema (no markdown fences, no explanation):
{
  "imageType": "bank_statement" | "investment_portfolio" | "property_valuation" | "net_worth" | "expense_receipt" | "unknown",
  "institution": "string or null",
  "date": "YYYY-MM-DD or null",
  "currency": "INR" | "USD" | "EUR" | "GBP" | ...,
  "entries": [
    {
      "name": "account or asset name",
      "value": <current balance or value as a number, no commas or symbols>,
      "currency": "optional override",
      "accountType": "savings" | "current" | "fd" | "mutual_fund" | "stock" | "property" | "other",
      "date": "YYYY-MM-DD or null"
    }
  ]
}

Rules:
- For bank statements: each account is one entry with its current balance
- For portfolio/investment screenshots: each holding is one entry with its current value
- For property valuations: the property is one entry
- For net-worth summaries: extract each asset row
- For expense receipts: extract total amount as one entry named after the merchant/description
- Numbers must be plain numbers (e.g., 45230.50, not "₹45,230.50")
- If you cannot determine the value, omit that entry
- If the image is unclear or not financial, set imageType to "unknown" and entries to []`;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();

    const body = await req.json();
    const { imageBase64, mimeType, command } = body as {
      imageBase64: string;
      mimeType:    string;
      command?:    string;
    };

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'imageBase64 and mimeType are required' }, { status: 400 });
    }

    // ── 1. Call Claude vision ─────────────────────────────────────────────────

    const userContent: Anthropic.MessageParam['content'] = [
      {
        type:   'image',
        source: {
          type:       'base64',
          media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data:       imageBase64,
        },
      },
    ];

    if (command?.trim()) {
      userContent.push({ type: 'text', text: command.trim() });
    } else {
      userContent.push({ type: 'text', text: 'Parse this financial document and extract account/asset names and their current values.' });
    }

    const claude = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: userContent }],
    });

    const raw = claude.content.find(c => c.type === 'text')?.text ?? '';

    let parsed: VisionParsed;
    try {
      parsed = JSON.parse(raw) as VisionParsed;
    } catch {
      return NextResponse.json({
        success: false,
        action:  'VISION_ERROR',
        message: 'Could not parse the image — please try a clearer photo of your financial document.',
        data:    { rawText: raw },
      });
    }

    if (parsed.imageType === 'unknown' || parsed.entries.length === 0) {
      return NextResponse.json({
        success: false,
        action:  'VISION_UNKNOWN',
        message: 'I could not identify any financial data in this image. Please attach a bank statement, portfolio screenshot, or similar document.',
        data:    { parsed },
      });
    }

    // Receipts are expenses, not asset updates — redirect the user to the text command
    if (parsed.imageType === 'expense_receipt') {
      const entries = parsed.entries;
      const sym     = parsed.currency === 'INR' ? '₹' : '$';
      const lines   = entries.slice(0, 3).map(e => `${e.name}: ${sym}${e.value.toLocaleString()}`);
      const hint    = entries.length > 0
        ? `Detected: ${lines.join(' · ')}.\n\nTo log this expense, type it in the AI command box — e.g. "${sym}${entries[0]?.value ?? ''} ${entries[0]?.name ?? 'expense'}".`
        : 'This looks like a receipt. To log the expense, type it in the AI command box.';
      return NextResponse.json({
        success: false,
        action:  'VISION_RECEIPT',
        message: hint,
        data:    { parsed },
      });
    }

    // ── 2. Load user's assets ─────────────────────────────────────────────────

    const assetRows = await prisma.asset.findMany({
      where:   { userId },
      select:  { id: true, name: true, value: true, category: true },
      orderBy: { createdAt: 'asc' },
    });

    const assets = await Promise.all(
      assetRows.map(async r => ({
        id:       r.id,
        name:     r.name,
        category: r.category,
        value:    await decryptNumber(r.value),
      })),
    );

    // ── 3. Match + update ─────────────────────────────────────────────────────

    const updated:   UpdatedAsset[]    = [];
    const unmatched: UnmatchedEntry[]  = [];
    const MATCH_THRESHOLD = 0.55;

    for (const entry of parsed.entries) {
      if (!entry.name || entry.value == null || isNaN(entry.value)) continue;

      const match = bestMatch(entry.name, assets);

      if (!match || match.score < MATCH_THRESHOLD) {
        unmatched.push({
          name:   entry.name,
          value:  entry.value,
          reason: match
            ? `Closest match "${match.asset.name}" had low confidence (${Math.round(match.score * 100)}%)`
            : 'No existing asset found',
        });
        continue;
      }

      const oldValue = match.asset.value;
      // Update asset value only — no transaction created
      await prisma.asset.update({
        where: { id: match.asset.id },
        data:  { value: await encryptNumber(entry.value) },
      });

      // Reflect update in local list so duplicate entries in the same image don't re-match
      const localAsset = assets.find(a => a.id === match.asset.id);
      if (localAsset) localAsset.value = entry.value;

      updated.push({
        id:       match.asset.id,
        name:     match.asset.name,
        oldValue: Math.round(oldValue),
        newValue: Math.round(entry.value),
      });
    }

    // ── 4. Build response message ─────────────────────────────────────────────

    let message: string;
    if (updated.length === 0 && unmatched.length > 0) {
      message = `I found ${unmatched.length} item(s) in the image but couldn't match them to your assets. Add the assets first, then re-scan.`;
    } else if (updated.length > 0) {
      const lines = updated.map(u => {
        const diff  = u.newValue - u.oldValue;
        const arrow = diff >= 0 ? '↑' : '↓';
        const sym   = parsed.currency === 'INR' ? '₹' : '$';
        return `${u.name}: ${sym}${u.oldValue.toLocaleString()} → ${sym}${u.newValue.toLocaleString()} (${arrow}${sym}${Math.abs(diff).toLocaleString()})`;
      });
      message = `Updated ${updated.length} asset${updated.length > 1 ? 's' : ''} from the image:\n${lines.join('\n')}`;
      if (unmatched.length > 0) {
        message += `\n\n${unmatched.length} item(s) couldn't be matched — check your asset names.`;
      }
    } else {
      message = 'No updates were made. The image may not contain recognisable financial data.';
    }

    return NextResponse.json({
      success: updated.length > 0,
      action:  'UPDATE_ASSET',
      message,
      data: {
        parsed,
        updated,
        unmatched,
      },
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[vision] error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
