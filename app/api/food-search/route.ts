import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { searchIndianFoods } from '@/lib/indianFoods';

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

async function searchUSDA(query: string): Promise<FoodNutrition[]> {
  const apiKey = process.env.USDA_API_KEY ?? 'DEMO_KEY';
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&dataType=Branded,Foundation,SR+Legacy&api_key=${apiKey}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MyOrbit/1.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`USDA ${res.status}`);
  const data = await res.json();

  return (data.foods ?? [])
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
    .filter((f: FoodNutrition) => f.calories != null)
    .slice(0, 8);
}

export async function GET(req: NextRequest) {
  try {
    await requireUserId();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    // 1. Search local Indian foods database first (instant, no API limit)
    const indianResults = searchIndianFoods(query, 5).map(f => ({
      name: f.name,
      servingSize: f.servingSize,
      servingGrams: f.servingGrams,
      calories:     f.calories ?? null,
      protein:      f.protein ?? null,
      carbs:        f.carbs ?? null,
      fats:         f.fats ?? null,
      saturatedFat: f.saturatedFat ?? null,
      sodium:       f.sodium ?? null,
      potassium:    f.potassium ?? null,
      fiber:        f.fiber ?? null,
    } satisfies FoodNutrition));

    // 2. If we have strong Indian results (2+), return them — skip USDA call
    if (indianResults.length >= 2) {
      return NextResponse.json(indianResults);
    }

    // 3. Otherwise fetch from USDA and merge (Indian results first if any)
    try {
      const usdaResults = await searchUSDA(query);
      const merged = [...indianResults, ...usdaResults].slice(0, 8);
      return NextResponse.json(merged);
    } catch (usdaErr) {
      // If USDA fails but we have some Indian results, still return them
      if (indianResults.length > 0) return NextResponse.json(indianResults);
      throw usdaErr;
    }
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[food-search]', e?.message);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
