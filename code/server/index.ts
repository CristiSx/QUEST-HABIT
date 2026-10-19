import Fastify from "fastify";
import {
  getMeta,
  initDb,
  nextId,
  pool,
  resetDatabase,
  setMeta,
} from "./db.ts";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

const DIFFICULTY_XP: Record<string, number> = {
  easy: 10,
  medium: 25,
  hard: 50,
};

interface QuestRow {
  seq: number;
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  due_date: string | null;
  recurrence: "daily" | null;
}

interface CompletionRow {
  seq: number;
  id: string;
  quest_id: string;
  day: string;
  base_xp: number;
  created_at: string;
}

function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.trim().length === 0) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function isValidDateString(day: unknown): day is string {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function getRequestNow(xNowHeader: string | string[] | undefined): Date {
  if (typeof xNowHeader === "string" && xNowHeader.trim().length > 0) {
    const parsed = new Date(xNowHeader);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

function formatDayInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function formatUtcTimestamp(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function dayToEpochDays(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

async function computeMe(now: Date) {
  const timezone = (await getMeta("timezone")) || "Europe/Bucharest";
  const completionsRes = await pool.query<CompletionRow>(
    "SELECT seq, id, quest_id, day, base_xp, created_at FROM completions ORDER BY seq ASC"
  );
  const completions = completionsRes.rows;

  let baseXpSum = 0;
  const daySet = new Set<string>();
  for (const c of completions) {
    baseXpSum += c.base_xp;
    daySet.add(c.day);
  }

  const activeDays = Array.from(daySet).sort();
  const streakByDay = new Map<string, number>();
  let bonusXpSum = 0;

  for (let i = 0; i < activeDays.length; i++) {
    const day = activeDays[i];
    let currentStreak = 1;
    if (i > 0) {
      const prevDay = activeDays[i - 1];
      if (dayToEpochDays(day) - dayToEpochDays(prevDay) === 1) {
        currentStreak = (streakByDay.get(prevDay) ?? 1) + 1;
      }
    }
    streakByDay.set(day, currentStreak);
    bonusXpSum += Math.min(currentStreak * 2, 14);
  }

  const totalXp = baseXpSum + bonusXpSum;

  let level = 1;
  let xpIntoLevel = totalXp;
  while (xpIntoLevel >= level * 100) {
    xpIntoLevel -= level * 100;
    level += 1;
  }
  const xpToNextLevel = level * 100 - xpIntoLevel;

  const today = formatDayInTimeZone(now, timezone);
  const todayEpoch = dayToEpochDays(today);
  let streak = 0;

  if (streakByDay.has(today)) {
    streak = streakByDay.get(today)!;
  } else {
    for (const [day, s] of streakByDay.entries()) {
      if (todayEpoch - dayToEpochDays(day) === 1) {
        streak = s;
        break;
      }
    }
  }

  return {
    timezone,
    xp: totalXp,
    level,
    xp_into_level: xpIntoLevel,
    xp_to_next_level: xpToNextLevel,
    streak,
  };
}

export function buildServer() {
  const app = Fastify({ logger: true });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    reply.header("Access-Control-Allow-Headers", "Content-Type, X-Now");
    if (request.method === "OPTIONS") {
      return reply.code(204).send();
    }
  });

  // 1. POST /quests
  app.post("/quests", async (request, reply) => {
    const body = (request.body ?? {}) as {
      title?: unknown;
      difficulty?: unknown;
      due_date?: unknown;
      recurrence?: unknown;
    };

    if (
      typeof body.title !== "string" ||
      body.title.trim().length < 1 ||
      body.title.length > 100
    ) {
      return reply.code(400).send({ error: "invalid title" });
    }

    if (
      typeof body.difficulty !== "string" ||
      !(body.difficulty in DIFFICULTY_XP)
    ) {
      return reply.code(400).send({ error: "invalid difficulty" });
    }

    const hasDueDate = body.due_date !== undefined && body.due_date !== null;
    const hasRecurrence =
      body.recurrence !== undefined && body.recurrence !== null;

    if (hasDueDate && hasRecurrence) {
      return reply
        .code(400)
        .send({ error: "a quest cannot have both due_date and recurrence" });
    }

    if (hasDueDate && !isValidDateString(body.due_date)) {
      return reply.code(400).send({ error: "invalid due_date" });
    }

    if (hasRecurrence && body.recurrence !== "daily") {
      return reply.code(400).send({ error: "invalid recurrence" });
    }

    const id = await nextId("q");
    const dueDate = hasDueDate ? (body.due_date as string) : null;
    const recurrence = hasRecurrence ? "daily" : null;

    await pool.query(
      `INSERT INTO quests (id, title, difficulty, due_date, recurrence)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, body.title, body.difficulty, dueDate, recurrence]
    );

    return reply.code(201).send({
      id,
      title: body.title,
      difficulty: body.difficulty,
      due_date: dueDate,
      recurrence,
      done: false,
    });
  });

  // 2. GET /quests
  app.get("/quests", async (request) => {
    const now = getRequestNow(request.headers["x-now"]);
    const timezone = (await getMeta("timezone")) || "Europe/Bucharest";
    const today = formatDayInTimeZone(now, timezone);

    const questsRes = await pool.query<QuestRow>(
      "SELECT seq, id, title, difficulty, due_date, recurrence FROM quests ORDER BY seq DESC"
    );

    const completionsRes = await pool.query<{
      quest_id: string;
      day: string;
    }>("SELECT quest_id, day FROM completions");

    const completions = completionsRes.rows;

    return questsRes.rows.map((q) => {
      const done =
        q.recurrence === "daily"
          ? completions.some((c) => c.quest_id === q.id && c.day === today)
          : completions.some((c) => c.quest_id === q.id);

      return {
        id: q.id,
        title: q.title,
        difficulty: q.difficulty,
        due_date: q.due_date,
        recurrence: q.recurrence,
        done,
      };
    });
  });

  // 3. POST /quests/:id/complete
  app.post<{ Params: { id: string } }>(
    "/quests/:id/complete",
    async (request, reply) => {
      const now = getRequestNow(request.headers["x-now"]);
      const timezone = (await getMeta("timezone")) || "Europe/Bucharest";
      const today = formatDayInTimeZone(now, timezone);
      const questId = request.params.id;

      const questRes = await pool.query<QuestRow>(
        "SELECT seq, id, title, difficulty, due_date, recurrence FROM quests WHERE id = $1",
        [questId]
      );
      const quest = questRes.rows[0];

      if (!quest) {
        return reply.code(404).send({ error: "quest not found" });
      }

      const existingRes =
        quest.recurrence === "daily"
          ? await pool.query<CompletionRow>(
              "SELECT seq, id, quest_id, day, base_xp, created_at FROM completions WHERE quest_id = $1 AND day = $2",
              [quest.id, today]
            )
          : await pool.query<CompletionRow>(
              "SELECT seq, id, quest_id, day, base_xp, created_at FROM completions WHERE quest_id = $1",
              [quest.id]
            );

      const existing = existingRes.rows[0];
      if (existing) {
        return reply.code(200).send({
          completion: {
            id: existing.id,
            quest_id: existing.quest_id,
            day: existing.day,
            base_xp: existing.base_xp,
            created_at: existing.created_at,
          },
          me: await computeMe(now),
        });
      }

      const normalXp = DIFFICULTY_XP[quest.difficulty];
      const isOverdue = quest.due_date !== null && today > quest.due_date;
      const baseXp = isOverdue ? Math.floor(normalXp / 2) : normalXp;
      const id = await nextId("c");
      const createdAt = formatUtcTimestamp(now);

      await pool.query(
        `INSERT INTO completions (id, quest_id, day, base_xp, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, quest.id, today, baseXp, createdAt]
      );

      return reply.code(201).send({
        completion: {
          id,
          quest_id: quest.id,
          day: today,
          base_xp: baseXp,
          created_at: createdAt,
        },
        me: await computeMe(now),
      });
    }
  );

  // 4. GET /completions
  app.get("/completions", async () => {
    const completionsRes = await pool.query<CompletionRow>(
      "SELECT seq, id, quest_id, day, base_xp, created_at FROM completions ORDER BY seq DESC"
    );

    return completionsRes.rows.map((c) => ({
      id: c.id,
      quest_id: c.quest_id,
      day: c.day,
      base_xp: c.base_xp,
      created_at: c.created_at,
    }));
  });

  // 5. DELETE /completions/:id
  app.delete<{ Params: { id: string } }>(
    "/completions/:id",
    async (request, reply) => {
      const completionId = request.params.id;
      const delRes = await pool.query(
        "DELETE FROM completions WHERE id = $1 RETURNING id",
        [completionId]
      );

      if (delRes.rowCount === 0) {
        return reply.code(404).send({ error: "completion not found" });
      }

      return reply.code(204).send();
    }
  );

  // 6. GET /me
  app.get("/me", async (request) => {
    const now = getRequestNow(request.headers["x-now"]);
    return computeMe(now);
  });

  // 7. PUT /me
  app.put("/me", async (request, reply) => {
    const now = getRequestNow(request.headers["x-now"]);
    const body = (request.body ?? {}) as { timezone?: unknown };
    if (!isValidTimeZone(body.timezone)) {
      return reply.code(400).send({ error: "invalid timezone" });
    }
    await setMeta("timezone", body.timezone);
    return computeMe(now);
  });

  // 8. POST /test/reset
  app.post("/test/reset", async (_request, reply) => {
    await resetDatabase();
    return reply.code(204).send();
  });

  return app;
}

if (
  import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` ||
  process.argv[1]?.endsWith("index.ts")
) {
  initDb()
    .then(() => {
      const app = buildServer();
      return app.listen({ port: PORT, host: HOST });
    })
    .then(() => {
      console.log(`Fastify API listening on http://${HOST}:${PORT}`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}