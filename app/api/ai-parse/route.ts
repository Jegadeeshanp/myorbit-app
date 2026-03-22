import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = [
  'Rent','Groceries','Restaurants','Fuel','Transport','Utilities','Internet','Mobile',
  'Shopping','Subscriptions','Medical','Insurance','Travel','Education','Gifts',
  'Miscellaneous','Investment','Loan','Food','Salary','Bonus','Freelance',
  'Business','Dividends','Interest','Rental Income','Cashback','Refund','Other Income',
];

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    // Fetch the user's accounts so the model can match against real names
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true, name: true, type: true },
    });

    const accountList = accounts.map(a => `${a.id}|${a.name} (${a.type})`).join('\n');

    const prompt = `You are a transaction parser for a personal finance app (India).
Parse the following natural-language input into a JSON transaction object.

USER ACCOUNTS:
${accountList || 'No accounts yet'}

VALID CATEGORIES: ${CATEGORIES.join(', ')}

INPUT: "${text}"

Rules:
- amount: positive integer (rupees). Extract from "50 rupees", "₹200", "200 rs", "two hundred" etc.
- type: "expense" if spending/paying/buying, "income" if receiving salary/refund/cashback
- category: pick the most relevant from the VALID CATEGORIES list
- description: short human-readable label (e.g. "Office food", "Petrol", "Netflix")
- accountId: match user input to one of the USER ACCOUNTS by id. If no clear match, return null.
- accountName: the matched account name for display, or null
- date: today's date in YYYY-MM-DD format

Respond ONLY with valid JSON, no explanation:
{
  "amount": number,
  "type": "expense" | "income",
  "category": string,
  "description": string,
  "accountId": string | null,
  "accountName": string | null,
  "date": string,
  "confidence": "high" | "medium" | "low"
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as any).text?.trim() ?? '';
    // Extract JSON even if wrapped in markdown code block
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'Could not parse response' }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ ...parsed, accounts });
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('ai-parse error:', e);
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 });
  }
}
