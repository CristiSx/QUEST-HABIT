import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { buildServer } from "./index.ts";
import { initDb, pool } from "./db.ts";

interface RecordingEntry {
  x_now: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  status: number;
  response?: unknown;
}

async function runTests() {
  await initDb();
  const app = buildServer();
  await app.ready();

  // 1. Reset state before replaying reference_recording.jsonl
  await app.inject({ method: "POST", url: "/test/reset" });

  const localPath = path.resolve(process.cwd(), "reference_recording.jsonl");
  const parentPath = path.resolve(
    process.cwd(),
    "..",
    "reference_recording.jsonl"
  );
  const recordingPath = fs.existsSync(localPath) ? localPath : parentPath;

  const lines = fs
    .readFileSync(recordingPath, "utf-8")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  console.log(
    `[Test 1/2] Replaying ${lines.length} requests from reference_recording.jsonl...`
  );

  for (let i = 0; i < lines.length; i++) {
    const entry: RecordingEntry = JSON.parse(lines[i]);
    const res = await app.inject({
      method: entry.method,
      url: entry.path,
      headers: {
        "x-now": entry.x_now,
      },
      payload: entry.body as Record<string, unknown> | undefined,
    });

    assert.equal(
      res.statusCode,
      entry.status,
      `Line ${i + 1} (${entry.method} ${entry.path}): expected status ${
        entry.status
      }, got ${res.statusCode} (${res.body})`
    );

    if (entry.response !== undefined) {
      const actualBody = res.json();
      if (entry.status >= 400) {
        assert.equal(
          typeof actualBody.error,
          "string",
          `Line ${i + 1}: expected error string in response`
        );
      } else {
        assert.deepEqual(
          actualBody,
          entry.response,
          `Line ${i + 1} (${entry.method} ${entry.path}) response mismatch`
        );
      }
    }
  }

  console.log(
    `✔ All ${lines.length} recorded requests matched 100% with reference_recording.jsonl!`
  );

  // 2. Custom edge-case tests (overdue hard quest penalty + reset)
  console.log("[Test 2/2] Running custom edge-case tests...");
  await app.inject({ method: "POST", url: "/test/reset" });

  const createHard = await app.inject({
    method: "POST",
    url: "/quests",
    headers: { "x-now": "2026-10-05T10:00:00+03:00" },
    payload: {
      title: "Overdue boss quest",
      difficulty: "hard",
      due_date: "2026-10-06",
    },
  });
  assert.equal(createHard.statusCode, 201);

  const completeLate = await app.inject({
    method: "POST",
    url: "/quests/q1/complete",
    headers: { "x-now": "2026-10-07T10:00:00+03:00" },
  });
  assert.equal(completeLate.statusCode, 201);
  assert.equal(completeLate.json().completion.base_xp, 25); // 50 / 2 = 25 XP

  // Clean up after tests
  await app.inject({ method: "POST", url: "/test/reset" });
  console.log("✔ Custom edge-case tests passed!");

  await app.close();
  await pool.end();
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
