import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';

export const runtime = 'nodejs';

const PROMPT = `Analyze this financial screenshot and extract all visible holding/position data.

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

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key not configured (add GOOGLE_AI_API_KEY to environment variables)' }, { status: 500 });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
              { text: PROMPT },
            ],
          }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0 },
        }),
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      throw new Error(geminiData.error?.message ?? `Gemini API error ${geminiRes.status}`);
    }

    const text: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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
    const detail = e?.message ?? String(e);
    console.error('[parse-image]', detail);
    return NextResponse.json({ error: detail }, { status: 500 });
  }
}
