// Common Indian foods with nutrition per standard serving
// Values sourced from ICMR-NIN Nutritive Value of Indian Foods (2017) & standard references
// Serving sizes are practical portions, not per-100g

export type FoodItem = {
  name: string;
  servingSize: string;
  servingGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  saturatedFat?: number;
  sodium?: number;
  potassium?: number;
  fiber?: number;
};

const INDIAN_FOODS: FoodItem[] = [
  // ── Rice & wheat staples ───────────────────────────────────────────────
  { name: 'Steamed Rice (cooked)', servingSize: '1 cup (200g)', servingGrams: 200, calories: 260, protein: 5.4, carbs: 57, fats: 0.5, fiber: 0.6, sodium: 2 },
  { name: 'Brown Rice (cooked)', servingSize: '1 cup (200g)', servingGrams: 200, calories: 218, protein: 4.5, carbs: 45, fats: 1.6, fiber: 3.5, sodium: 2 },
  { name: 'Chapati / Roti (1 piece)', servingSize: '1 roti (35g)', servingGrams: 35, calories: 104, protein: 3, carbs: 19, fats: 2.5, fiber: 2.3, sodium: 5 },
  { name: 'Tandoori Roti', servingSize: '1 piece (60g)', servingGrams: 60, calories: 165, protein: 5.2, carbs: 32, fats: 2.8, fiber: 3, sodium: 150 },
  { name: 'Paratha (plain)', servingSize: '1 piece (70g)', servingGrams: 70, calories: 213, protein: 4, carbs: 28, fats: 9, saturatedFat: 3, fiber: 2, sodium: 190 },
  { name: 'Aloo Paratha', servingSize: '1 piece (100g)', servingGrams: 100, calories: 280, protein: 5.5, carbs: 40, fats: 10, saturatedFat: 3.5, fiber: 2.5, sodium: 250 },
  { name: 'Puri', servingSize: '1 piece (30g)', servingGrams: 30, calories: 130, protein: 2.5, carbs: 15, fats: 6.5, saturatedFat: 1.5, fiber: 0.8, sodium: 80 },
  { name: 'Naan (plain)', servingSize: '1 piece (90g)', servingGrams: 90, calories: 270, protein: 8, carbs: 45, fats: 6, saturatedFat: 2, fiber: 1.8, sodium: 400 },
  { name: 'Idli (1 piece)', servingSize: '1 idli (40g)', servingGrams: 40, calories: 58, protein: 2, carbs: 12, fats: 0.3, fiber: 0.5, sodium: 120 },
  { name: 'Dosa (plain)', servingSize: '1 dosa (70g)', servingGrams: 70, calories: 112, protein: 3, carbs: 21, fats: 2.5, fiber: 1, sodium: 210 },
  { name: 'Masala Dosa', servingSize: '1 piece (150g)', servingGrams: 150, calories: 230, protein: 5, carbs: 36, fats: 7, saturatedFat: 2, fiber: 2.5, sodium: 400 },
  { name: 'Uttapam', servingSize: '1 piece (100g)', servingGrams: 100, calories: 145, protein: 4, carbs: 26, fats: 3, fiber: 1.5, sodium: 280 },
  { name: 'Upma', servingSize: '1 cup (150g)', servingGrams: 150, calories: 190, protein: 4.5, carbs: 32, fats: 5, saturatedFat: 1, fiber: 2, sodium: 320 },
  { name: 'Poha (flattened rice)', servingSize: '1 cup (120g)', servingGrams: 120, calories: 165, protein: 3, carbs: 34, fats: 2.5, fiber: 1.5, sodium: 200 },
  { name: 'Khichdi', servingSize: '1 cup (200g)', servingGrams: 200, calories: 240, protein: 9, carbs: 44, fats: 3.5, fiber: 3.5, sodium: 350, potassium: 280 },
  { name: 'Biryani (chicken)', servingSize: '1 serving (250g)', servingGrams: 250, calories: 380, protein: 22, carbs: 48, fats: 10, saturatedFat: 3, fiber: 1.5, sodium: 650, potassium: 350 },
  { name: 'Biryani (veg)', servingSize: '1 serving (250g)', servingGrams: 250, calories: 330, protein: 8, carbs: 55, fats: 9, saturatedFat: 2.5, fiber: 3, sodium: 580 },
  { name: 'Pulao (veg)', servingSize: '1 cup (180g)', servingGrams: 180, calories: 260, protein: 5.5, carbs: 46, fats: 6, saturatedFat: 1.5, fiber: 2.5, sodium: 400 },

  // ── Lentils & legumes (dals) ───────────────────────────────────────────
  { name: 'Dal Tadka (toor dal)', servingSize: '1 cup (200g)', servingGrams: 200, calories: 180, protein: 10, carbs: 28, fats: 4, saturatedFat: 1.5, fiber: 6, sodium: 380, potassium: 420 },
  { name: 'Dal Makhani', servingSize: '1 cup (200g)', servingGrams: 200, calories: 270, protein: 12, carbs: 32, fats: 10, saturatedFat: 5, fiber: 7, sodium: 500, potassium: 480 },
  { name: 'Moong Dal (cooked)', servingSize: '1 cup (200g)', servingGrams: 200, calories: 158, protein: 10, carbs: 26, fats: 1.5, fiber: 7.5, sodium: 260, potassium: 370 },
  { name: 'Masoor Dal', servingSize: '1 cup (200g)', servingGrams: 200, calories: 170, protein: 11, carbs: 28, fats: 1.5, fiber: 8, sodium: 300, potassium: 400 },
  { name: 'Chana Dal', servingSize: '1 cup (200g)', servingGrams: 200, calories: 195, protein: 12, carbs: 32, fats: 2.5, fiber: 9, sodium: 280, potassium: 430 },
  { name: 'Rajma (kidney beans)', servingSize: '1 cup (200g)', servingGrams: 200, calories: 225, protein: 14, carbs: 38, fats: 1.5, fiber: 11, sodium: 420, potassium: 700 },
  { name: 'Chole (chickpea curry)', servingSize: '1 cup (200g)', servingGrams: 200, calories: 245, protein: 13, carbs: 38, fats: 6, saturatedFat: 1, fiber: 10, sodium: 500, potassium: 500 },
  { name: 'Sambhar', servingSize: '1 cup (200g)', servingGrams: 200, calories: 105, protein: 5, carbs: 17, fats: 2.5, fiber: 4, sodium: 480, potassium: 320 },

  // ── Vegetables ────────────────────────────────────────────────────────
  { name: 'Aloo Gobi (potato & cauliflower)', servingSize: '1 cup (150g)', servingGrams: 150, calories: 145, protein: 3.5, carbs: 22, fats: 5, saturatedFat: 0.5, fiber: 3.5, sodium: 300 },
  { name: 'Palak Paneer', servingSize: '1 cup (200g)', servingGrams: 200, calories: 280, protein: 14, carbs: 12, fats: 20, saturatedFat: 10, fiber: 3, sodium: 480, potassium: 380 },
  { name: 'Paneer Butter Masala', servingSize: '1 cup (200g)', servingGrams: 200, calories: 380, protein: 14, carbs: 18, fats: 28, saturatedFat: 14, fiber: 2.5, sodium: 620 },
  { name: 'Paneer Bhurji', servingSize: '1 cup (150g)', servingGrams: 150, calories: 310, protein: 15, carbs: 8, fats: 24, saturatedFat: 12, fiber: 1.5, sodium: 420 },
  { name: 'Matar Paneer', servingSize: '1 cup (200g)', servingGrams: 200, calories: 290, protein: 14, carbs: 18, fats: 18, saturatedFat: 9, fiber: 4, sodium: 500 },
  { name: 'Bhindi Masala (okra)', servingSize: '1 cup (150g)', servingGrams: 150, calories: 130, protein: 3, carbs: 15, fats: 7, saturatedFat: 0.8, fiber: 5, sodium: 280 },
  { name: 'Baingan Bharta (roasted eggplant)', servingSize: '1 cup (150g)', servingGrams: 150, calories: 110, protein: 2.5, carbs: 16, fats: 4.5, fiber: 5, sodium: 310 },
  { name: 'Mixed Veg Curry', servingSize: '1 cup (200g)', servingGrams: 200, calories: 160, protein: 4.5, carbs: 22, fats: 6.5, fiber: 5, sodium: 400 },
  { name: 'Jeera Aloo (cumin potato)', servingSize: '1 cup (150g)', servingGrams: 150, calories: 185, protein: 3, carbs: 30, fats: 6, saturatedFat: 0.8, fiber: 3, sodium: 300 },
  { name: 'Dum Aloo', servingSize: '1 cup (200g)', servingGrams: 200, calories: 225, protein: 4, carbs: 34, fats: 8.5, saturatedFat: 1.5, fiber: 3.5, sodium: 480 },

  // ── Non-veg ────────────────────────────────────────────────────────────
  { name: 'Butter Chicken (Murgh Makhani)', servingSize: '1 cup (200g)', servingGrams: 200, calories: 360, protein: 28, carbs: 14, fats: 22, saturatedFat: 10, fiber: 1.5, sodium: 720, potassium: 420 },
  { name: 'Chicken Tikka Masala', servingSize: '1 cup (200g)', servingGrams: 200, calories: 320, protein: 30, carbs: 12, fats: 18, saturatedFat: 7, fiber: 1.5, sodium: 680 },
  { name: 'Chicken Curry', servingSize: '1 cup (200g)', servingGrams: 200, calories: 280, protein: 28, carbs: 8, fats: 16, saturatedFat: 4, fiber: 1, sodium: 620, potassium: 380 },
  { name: 'Chicken Tikka (grilled)', servingSize: '4 pieces (120g)', servingGrams: 120, calories: 190, protein: 26, carbs: 5, fats: 7.5, saturatedFat: 2, fiber: 0.5, sodium: 420 },
  { name: 'Tandoori Chicken (half)', servingSize: '1 serving (180g)', servingGrams: 180, calories: 230, protein: 33, carbs: 5, fats: 9, saturatedFat: 2, sodium: 580 },
  { name: 'Egg Curry', servingSize: '1 cup (200g)', servingGrams: 200, calories: 245, protein: 14, carbs: 10, fats: 17, saturatedFat: 4, fiber: 1.5, sodium: 540 },
  { name: 'Mutton Curry', servingSize: '1 cup (200g)', servingGrams: 200, calories: 310, protein: 26, carbs: 8, fats: 20, saturatedFat: 8, fiber: 1, sodium: 680, potassium: 360 },
  { name: 'Fish Curry', servingSize: '1 cup (200g)', servingGrams: 200, calories: 220, protein: 24, carbs: 8, fats: 10, saturatedFat: 2.5, fiber: 1, sodium: 580, potassium: 450 },
  { name: 'Prawn Masala', servingSize: '1 cup (150g)', servingGrams: 150, calories: 190, protein: 20, carbs: 7, fats: 9, saturatedFat: 1.5, fiber: 1, sodium: 640, potassium: 300 },
  { name: 'Keema (minced meat curry)', servingSize: '1 cup (200g)', servingGrams: 200, calories: 320, protein: 24, carbs: 10, fats: 21, saturatedFat: 8, fiber: 2, sodium: 580 },

  // ── Snacks & street food ───────────────────────────────────────────────
  { name: 'Samosa (1 piece)', servingSize: '1 samosa (60g)', servingGrams: 60, calories: 155, protein: 3, carbs: 18, fats: 8, saturatedFat: 2.5, fiber: 1.5, sodium: 280 },
  { name: 'Pakora (veg)', servingSize: '4 pieces (80g)', servingGrams: 80, calories: 190, protein: 4.5, carbs: 24, fats: 9, saturatedFat: 1.5, fiber: 2, sodium: 320 },
  { name: 'Vada Pav', servingSize: '1 piece (150g)', servingGrams: 150, calories: 310, protein: 7, carbs: 48, fats: 10, saturatedFat: 2, fiber: 3, sodium: 540 },
  { name: 'Pani Puri / Golgappa (6 pcs)', servingSize: '6 pieces (120g)', servingGrams: 120, calories: 180, protein: 4, carbs: 32, fats: 5, fiber: 2.5, sodium: 400 },
  { name: 'Bhel Puri', servingSize: '1 cup (120g)', servingGrams: 120, calories: 165, protein: 4, carbs: 30, fats: 4, fiber: 2, sodium: 480 },
  { name: 'Pav Bhaji', servingSize: '1 serving (250g)', servingGrams: 250, calories: 380, protein: 9, carbs: 60, fats: 12, saturatedFat: 5, fiber: 5, sodium: 720 },
  { name: 'Dhokla (1 piece)', servingSize: '1 piece (40g)', servingGrams: 40, calories: 73, protein: 3, carbs: 12, fats: 1.5, fiber: 0.8, sodium: 200 },
  { name: 'Medu Vada', servingSize: '1 piece (50g)', servingGrams: 50, calories: 120, protein: 4, carbs: 14, fats: 5.5, fiber: 1.5, sodium: 220 },
  { name: 'Kachori', servingSize: '1 piece (60g)', servingGrams: 60, calories: 195, protein: 4, carbs: 22, fats: 10, saturatedFat: 3, fiber: 2, sodium: 310 },
  { name: 'Aloo Chaat', servingSize: '1 cup (150g)', servingGrams: 150, calories: 185, protein: 4, carbs: 32, fats: 5.5, fiber: 3, sodium: 580 },

  // ── Breakfast & sweet ─────────────────────────────────────────────────
  { name: 'Halwa (semolina / sooji)', servingSize: '1/2 cup (100g)', servingGrams: 100, calories: 245, protein: 3.5, carbs: 40, fats: 8, saturatedFat: 4.5, fiber: 0.5, sodium: 80, potassium: 90 },
  { name: 'Kheer (rice pudding)', servingSize: '1/2 cup (150g)', servingGrams: 150, calories: 175, protein: 5, carbs: 30, fats: 4.5, saturatedFat: 2.5, fiber: 0.2, sodium: 80, potassium: 200 },
  { name: 'Gulab Jamun (2 pieces)', servingSize: '2 pieces (80g)', servingGrams: 80, calories: 235, protein: 4, carbs: 42, fats: 6.5, saturatedFat: 3.5, fiber: 0.3, sodium: 120 },
  { name: 'Jalebi (2 pieces)', servingSize: '2 pieces (50g)', servingGrams: 50, calories: 170, protein: 1.5, carbs: 36, fats: 3, saturatedFat: 1.5, sodium: 25 },
  { name: 'Ladoo (besan)', servingSize: '1 piece (40g)', servingGrams: 40, calories: 175, protein: 3.5, carbs: 23, fats: 8, saturatedFat: 4, fiber: 0.8, sodium: 40 },
  { name: 'Burfi / Barfi', servingSize: '1 piece (30g)', servingGrams: 30, calories: 130, protein: 3, carbs: 20, fats: 5, saturatedFat: 3, sodium: 30 },
  { name: 'Rasgulla', servingSize: '2 pieces (100g)', servingGrams: 100, calories: 120, protein: 4, carbs: 23, fats: 1.5, saturatedFat: 0.8, sodium: 60 },
  { name: 'Payasam / Kheer (semiya)', servingSize: '1 cup (150g)', servingGrams: 150, calories: 195, protein: 5.5, carbs: 35, fats: 5, saturatedFat: 3, sodium: 90, potassium: 220 },

  // ── Dairy ─────────────────────────────────────────────────────────────
  { name: 'Paneer (raw)', servingSize: '50g', servingGrams: 50, calories: 132, protein: 7.5, carbs: 1.5, fats: 11, saturatedFat: 6.5, sodium: 25, potassium: 55 },
  { name: 'Curd / Dahi (plain)', servingSize: '1 cup (200g)', servingGrams: 200, calories: 122, protein: 8, carbs: 10, fats: 5, saturatedFat: 3, sodium: 100, potassium: 280 },
  { name: 'Lassi (sweet)', servingSize: '1 glass (250ml)', servingGrams: 250, calories: 195, protein: 7, carbs: 30, fats: 5.5, saturatedFat: 3.5, sodium: 110, potassium: 320 },
  { name: 'Raita (cucumber)', servingSize: '1/2 cup (100g)', servingGrams: 100, calories: 58, protein: 3.5, carbs: 6, fats: 2.5, saturatedFat: 1.5, sodium: 140, potassium: 160 },
  { name: 'Chaas / Buttermilk', servingSize: '1 glass (250ml)', servingGrams: 250, calories: 62, protein: 4, carbs: 7, fats: 2, saturatedFat: 1.2, sodium: 200, potassium: 280 },

  // ── Beverages ─────────────────────────────────────────────────────────
  { name: 'Masala Chai (with milk & sugar)', servingSize: '1 cup (200ml)', servingGrams: 200, calories: 65, protein: 2.5, carbs: 10, fats: 2, saturatedFat: 1.2, sodium: 40, potassium: 120 },
  { name: 'Filter Coffee (with milk & sugar)', servingSize: '1 cup (150ml)', servingGrams: 150, calories: 65, protein: 2, carbs: 9, fats: 2.5, saturatedFat: 1.5, sodium: 35, potassium: 90 },
];

export function searchIndianFoods(query: string, limit = 5): FoodItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored = INDIAN_FOODS.map(f => {
    const name = f.name.toLowerCase();
    if (name === q) return { f, score: 100 };
    if (name.startsWith(q)) return { f, score: 80 };
    const words = q.split(/\s+/);
    const allMatch = words.every(w => name.includes(w));
    if (allMatch) return { f, score: 60 };
    const anyMatch = words.some(w => name.includes(w));
    if (anyMatch) return { f, score: 20 };
    return { f, score: 0 };
  }).filter(x => x.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(x => x.f);
}
