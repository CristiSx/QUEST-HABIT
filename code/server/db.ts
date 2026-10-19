import pg from "pg";

const { Pool } = pg;

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/quests_db";

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quests (
      seq SERIAL PRIMARY KEY,
      id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      due_date TEXT,
      recurrence TEXT
    );

    CREATE TABLE IF NOT EXISTS completions (
      seq SERIAL PRIMARY KEY,
      id TEXT UNIQUE NOT NULL,
      quest_id TEXT NOT NULL,
      day TEXT NOT NULL,
      base_xp INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await initMeta();
}

export async function initMeta(): Promise<void> {
  await pool.query(`
    INSERT INTO meta (key, value) VALUES
      ('timezone', 'Europe/Bucharest'),
      ('next_quest_id', '1'),
      ('next_completion_id', '1')
    ON CONFLICT (key) DO NOTHING;
  `);
}

export async function getMeta(key: string): Promise<string> {
  const res = await pool.query<{ value: string }>(
    "SELECT value FROM meta WHERE key = $1",
    [key]
  );
  return res.rows[0]?.value ?? "";
}

export async function setMeta(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO meta (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value]
  );
}

export async function nextId(prefix: "q" | "c"): Promise<string> {
  const key = prefix === "q" ? "next_quest_id" : "next_completion_id";
  const current = Number((await getMeta(key)) || "1");
  await setMeta(key, String(current + 1));
  return `${prefix}${current}`;
}

export async function resetDatabase(): Promise<void> {
  await pool.query(
    "TRUNCATE TABLE completions, quests, meta RESTART IDENTITY;"
  );
  await initMeta();
}