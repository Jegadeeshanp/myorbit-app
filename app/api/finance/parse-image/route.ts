import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

const client = new Anthropic();

const PROMPT = `Analyze this financial screenshot and extract all visible data.

Return ONLY a valid JSON object — no markdown, no explanation — with this exact structure:
{
  "detected_type": "asset",
  "category": "<one of: Stocks & Equity | Mutual Funds | ETF | Bonds | Fixed Deposit | Gold | Real Estate | Other>",
  "source": "<broker or app name if visible, e.g. Zerodha, Groww, etc.>",
  "items": [
    {
      "name": "<company / fund name>",
      "units": <number of shares/units, or null>,
      "avgPrice": <average buy price per unit, or null>,
      "currentPrice": <current market price per unit, or null>,
      "currentValue": <total current market value as number>,
      "investedValue": <total amount invested as number>,
      "returns": <absolute P&L as number, positive = profit, negative = loss>,
      "returnsPercent": <percentage return as number>
    }
  ]
}

Rules:
- All monetary amounts must be plain numbers without currency symbols or commas
- Extract every row/holding visible in the image
- If a field is not visible, use null
- For stock portfolios (Zerodha, Groww, etc.) → category = "Stocks & Equity"
- For mutual fund statements → category = "Mutual Funds"
- Returns positive for profit, negative for loss
- Return ONLY the raw JSON object`;

export async function POST(req: NextRequest) {
  try {
    await requireUserId();

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: (mimeType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not extract data from image' }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (e: any) {
    if (e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[parse-image]', e);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
