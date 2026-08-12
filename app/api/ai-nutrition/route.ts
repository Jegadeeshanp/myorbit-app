import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';

export const runtime = 'nodejs';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

export async function POST(req: NextRequest) {
  try {
    await requireUserId();

    const { foodName, servingSize } = await req.json();
    if (!foodName?.trim()) {
      return NextResponse.json({ error: 'Food name required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const servingNote = servingSize ? ` Serving size: ${servingSize}.` : '';
    const userPrompt =
      `Give accurate nutrition facts for: "${foodName.trim()}".${servingNote} ` +
      `If serving is not specified, use a typical Indian home-cooked portion. ` +
      `Return ONLY a JSON object with these exact keys: ` +
      `servingSize (string, e.g. "1 cup (200g)"), calories (kcal), proteinG, carbsG, fatG, ` +
      `saturatedFatG, sodiumMg, potassiumMg, fiberG. All nutrient values are numbers per the serving.`;

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a precise nutritionist database. Return only valid JSON with accurate, realistic nutrition data. No explanation, no markdown — just the JSON object.',
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('[ai-nutrition] Groq error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 502 });
    }

    const raw = JSON.parse(content);

    const num = (v: unknown, decimals = 1) =>
      typeof v === 'number' && isFinite(v)
        ? Math.round(v * 10 ** decimals) / 10 ** decimals
        : null;

    return NextResponse.json({
      servingSize: typeof raw.servingSize === 'string' ? raw.servingSize : null,
      calories:     num(raw.calories, 0),
      proteinG:     num(raw.proteinG),
      carbsG:       num(raw.carbsG),
      fatG:         num(raw.fatG),
      saturatedFatG: num(raw.saturatedFatG),
      sodiumMg:     num(raw.sodiumMg, 0),
      potassiumMg:  num(raw.potassiumMg, 0),
      fiberG:       num(raw.fiberG),
    });
  } catch (e: any) {
    if (e.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[ai-nutrition]', e?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
