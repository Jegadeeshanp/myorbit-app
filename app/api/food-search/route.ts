import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';

export const runtime = 'nodejs';

export type FoodNutrition = {
  name: string;
  servingSize: string;
  servingGrams: number;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  saturatedFat: number | null;
  sodium: number | null;
  potassium: number | null;
  fiber: number | null;
};

function round1(v: number | undefined | null): number | null {
  if (v == null || isNaN(v)) return null;
  return Math.round(v * 10) / 10;
}

// USDA FoodData Central nutrient IDs
const NID = {
  calories:     1008,
  protein:      1003,
  carbs:        1005,
  fats:         1004,
  saturatedFat: 1258,
  sodium:       1093,
  potassium:    1092,
  fiber:        1079,
};

function getNutrient(nutrients: any[], id: number): number | null {
  const n = nutrients.find((n: any) => n.nutrientId === id);
  return n ? n.value ?? null : null;
}

export async function GET(req: NextRequest) {
  try {
    await requireUserId();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    // USDA FoodData Central — DEMO_KEY: 30 req/hr, 50 req/day (sufficient for personal use)
    const apiKey = process.env.USDA_API_KEY ?? 'DEMO_KEY';
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&dataType=Branded,Foundation,SR+Legacy&api_key=${apiKey}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MyOrbit/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`USDA ${res.status}`);
    const data = await res.json();

    const results: FoodNutrition[] = (data.foods ?? [])
      .filter((f: any) => f.description?.trim())
      .map((f: any) => {
        const nutrients = f.foodNutrients ?? [];
        const servingGrams = f.servingSize && f.servingSizeUnit?.toLowerCase() === 'g'
          ? f.servingSize
          : 100;
        const servingLabel = f.householdServingFullText
          ? `${f.householdServingFullText} (${servingGrams}g)`
          : `${servingGrams}g`;

        return {
          name: f.description.trim(),
          servingSize: servingLabel,
          servingGrams,
          calories:     round1(getNutrient(nutrients, NID.calories)),
          protein:      round1(getNutrient(nutrients, NID.protein)),
          carbs:        round1(getNutrient(nutrients, NID.carbs)),
          fats:         round1(getNutrient(nutrients, NID.fats)),
          saturatedFat: round1(getNutrient(nutrients, NID.saturatedFat)),
          sodium:       round1(getNutrient(nutrients, NID.sodium)),
          potassium:    round1(getNutrient(nutrients, NID.potassium)),
          fiber:        round1(getNutrient(nutrients, NID.fiber)),
        };
      })
      .filter((f: FoodNutrition) => f.calories != null);

    return NextResponse.json(results.slice(0, 8));
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[food-search]', e?.message);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
