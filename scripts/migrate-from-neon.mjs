/**
 * One-time migration: Neon → Supabase (merge / ON CONFLICT DO NOTHING)
 * Inserts every row from Neon that doesn't already exist in Supabase.
 * Runs in FK-safe table order so foreign-key constraints are never violated.
 *
 * Usage:
 *   node scripts/migrate-from-neon.mjs
 */

import pg from 'pg';
const { Pool } = pg;

// ── Connection strings ────────────────────────────────────────────────────────
const NEON_URL =
  'postgresql://neondb_owner:npg_ymEjT70hANVF@ep-damp-mountain-a19m5zwg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// Read Supabase direct URL from env, or fall back to the known value
const SUPABASE_URL =
  process.env.DIRECT_URL ||
  'postgresql://postgres.yszvxticxtuqewaljwjh:4GctNqBA5L3XfP64@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres';

// ── Table insertion order (parents before children) ───────────────────────────
const TABLES = [
  // Root
  'User',
  // Direct User children (no other FK deps)
  'Session',
  'UserPreferences',
  'UserCategory',
  'PasswordResetToken',
  'PushToken',
  'PomodoroSession',
  'Countdown',
  'HealthEntry',
  'Workout',
  'FoodEntry',
  'FoodLog',
  // Finance root tables
  'Account',
  'Budget',
  'Asset',
  'Liability',
  // Finance child tables
  'Transaction',           // → Account (nullable)
  'InvestmentTransaction', // → Asset
  'RecurringTransaction',  // → Asset (nullable)
  // Goals
  'Goal',
  'GoalMilestone',         // → Goal
  'GoalProcess',           // → Goal
  // Tasks
  'TaskList',
  'Habit',
  'HabitLog',              // → Habit
  'Task',                  // → TaskList (nullable), Habit (nullable)
  'TaskSubtask',           // → Task
  'TaskInstance',          // → Task
];

const BATCH_SIZE = 200;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildInsert(tableName, cols) {
  const colList = cols.map(c => `"${c}"`).join(', ');
  return (rows) => {
    const valueRows = rows.map((_, ri) =>
      `(${cols.map((_, ci) => `$${ri * cols.length + ci + 1}`).join(', ')})`
    ).join(', ');
    const values = rows.flatMap(row => cols.map(c => row[c]));
    const sql = `INSERT INTO "${tableName}" (${colList}) VALUES ${valueRows} ON CONFLICT DO NOTHING`;
    return { sql, values };
  };
}

async function migrateTable(neon, supabase, tableName) {
  let rows;
  try {
    const res = await neon.query(`SELECT * FROM "${tableName}" ORDER BY "createdAt" ASC`);
    rows = res.rows;
  } catch (err) {
    // Table might not exist in Neon (schema drift)
    if (err.message.includes('does not exist')) {
      console.log(`  ⚠  ${tableName}: table not found in Neon — skipped`);
      return { inserted: 0, skipped: 0 };
    }
    throw err;
  }

  if (rows.length === 0) {
    console.log(`  –  ${tableName}: empty`);
    return { inserted: 0, skipped: 0 };
  }

  const cols = Object.keys(rows[0]);
  const colList = cols.map(c => `"${c}"`).join(', ');
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

  let inserted = 0;
  let skipped  = 0;
  let fkSkipped = 0;

  // Row-by-row so FK violations on orphaned records skip gracefully
  for (const row of rows) {
    const values = cols.map(c => row[c]);
    try {
      const res = await supabase.query(sql, values);
      if ((res.rowCount ?? 0) > 0) inserted++;
      else skipped++; // conflict (already exists)
    } catch (err) {
      if (err.code === '23503') {
        // foreign_key_violation — orphaned record in Neon, skip silently
        fkSkipped++;
      } else {
        throw err;
      }
    }
  }

  const total = rows.length;
  const status = inserted === total ? '✓' : inserted > 0 ? '↗' : '=';
  const fkNote = fkSkipped > 0 ? `, ${fkSkipped} orphaned (FK)` : '';
  console.log(
    `  ${status}  ${tableName}: ${total} in Neon → ${inserted} inserted, ${skipped} already existed${fkNote}`
  );
  return { inserted, skipped: skipped + fkSkipped };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('  MyOrbit — Neon → Supabase data migration (merge)');
  console.log('='.repeat(60));
  console.log('');

  const neon = new Pool({
    connectionString: NEON_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });
  const supabase = new Pool({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });

  // Verify connectivity
  try {
    await neon.query('SELECT 1');
    console.log('✓ Neon connected');
  } catch (e) {
    console.error('✗ Cannot connect to Neon:', e.message);
    process.exit(1);
  }
  try {
    await supabase.query('SELECT 1');
    console.log('✓ Supabase connected');
  } catch (e) {
    console.error('✗ Cannot connect to Supabase:', e.message);
    process.exit(1);
  }
  console.log('');

  // Row counts before migration
  console.log('Pre-migration row counts in Supabase:');
  for (const t of TABLES) {
    try {
      const { rows } = await supabase.query(`SELECT COUNT(*) FROM "${t}"`);
      console.log(`  ${t}: ${rows[0].count}`);
    } catch { /* skip */ }
  }
  console.log('');

  console.log('Migrating tables...');
  let totalInserted = 0;
  let totalSkipped  = 0;

  for (const table of TABLES) {
    try {
      const { inserted, skipped } = await migrateTable(neon, supabase, table);
      totalInserted += inserted;
      totalSkipped  += skipped;
    } catch (err) {
      console.error(`  ✗  ${table}: FAILED — ${err.message}`);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`  Done: ${totalInserted} rows inserted, ${totalSkipped} already existed`);
  console.log('='.repeat(60));

  await neon.end();
  await supabase.end();
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
