"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  COMMON_TIMEZONES,
  Completion,
  DIFFICULTY_CONFIG,
  Difficulty,
  HERO_CLASSES,
  MeStats,
  Quest,
} from "./types/quest";
import { HeroHud } from "./components/HeroHud";
import { QuestForm } from "./components/QuestForm";
import { QuestBoard } from "./components/QuestBoard";
import { AdventureLog } from "./components/AdventureLog";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function formatDayInTimeZone(date: Date, timeZone: string): string {
  try {
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
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export default function Home() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [me, setMe] = useState<MeStats>({
    timezone: "Europe/Bucharest",
    xp: 0,
    level: 1,
    xp_into_level: 0,
    xp_to_next_level: 100,
    streak: 0,
  });

  const [xpPopups, setXpPopups] = useState<
    { id: number; text: string; subtext?: string }[]
  >([]);
  const [levelUpBanner, setLevelUpBanner] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const popupIdRef = useRef(1);

  const todayStr = useMemo(
    () => formatDayInTimeZone(new Date(), me.timezone),
    [me.timezone]
  );

  const completedToday = useMemo(
    () => completions.some((c) => c.day === todayStr),
    [completions, todayStr]
  );

  const enrichedQuests = useMemo(() => {
    return quests.map((q) => ({
      ...q,
      isOverdue: !q.done && q.due_date !== null && todayStr > q.due_date,
    }));
  }, [quests, todayStr]);

  function triggerXpPopup(text: string, subtext?: string) {
    const id = popupIdRef.current++;
    setXpPopups((prev) => [...prev, { id, text, subtext }]);
    setTimeout(() => {
      setXpPopups((prev) => prev.filter((p) => p.id !== id));
    }, 2400);
  }



  const syncAllFromServer = useCallback(async () => {
    try {
      const [meRes, questsRes, completionsRes] = await Promise.all([
        fetch(`${API_URL}/me`),
        fetch(`${API_URL}/quests`),
        fetch(`${API_URL}/completions`),
      ]);

      if (meRes.ok) {
        const meData: MeStats = await meRes.json();
        setMe(meData);
      }
      if (questsRes.ok) {
        const questsData: Quest[] = await questsRes.json();
        setQuests(questsData);
      }
      if (completionsRes.ok) {
        const completionsData: Completion[] = await completionsRes.json();
        setCompletions(completionsData);
      }
    } catch (err) {
      console.error("Failed to sync with API:", err);
    }
  }, []);

  useEffect(() => {
    syncAllFromServer();
  }, [syncAllFromServer]);

  // POST /quests
  async function handleAddQuest(data: {
    title: string;
    difficulty: Difficulty;
    due_date: string | null;
    recurrence: "daily" | null;
  }) {
    const payload: Record<string, string> = {
      title: data.title,
      difficulty: data.difficulty,
    };
    if (data.due_date) payload.due_date = data.due_date;
    if (data.recurrence) payload.recurrence = data.recurrence;

    const res = await fetch(`${API_URL}/quests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Failed to create quest:", err.error);
      return;
    }

    const newQuest: Quest = await res.json();
    setQuests((prev) => [newQuest, ...prev]);
  }

  async function handleCompleteQuest(questId: string) {
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.done) return;

    const prevMe = me;
    const prevQuests = quests;

    // 1. Optimistic update ca bara de XP să se miște instantaneu
    const cfg = DIFFICULTY_CONFIG[targetQuest.difficulty];
    const isOverdue =
      targetQuest.due_date !== null && todayStr > targetQuest.due_date;
    const optimisticBaseXp = isOverdue ? cfg.lateXp : cfg.xp;
    const optimisticBonus = completedToday
      ? 0
      : Math.min((me.streak + 1) * 2, 14);
    const optimisticTotalXp = me.xp + optimisticBaseXp + optimisticBonus;

    let optLevel = 1;
    let optInto = optimisticTotalXp;
    while (optInto >= optLevel * 100) {
      optInto -= optLevel * 100;
      optLevel += 1;
    }

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, done: true } : q))
    );
    setMe({
      ...me,
      xp: optimisticTotalXp,
      level: optLevel,
      xp_into_level: optInto,
      xp_to_next_level: optLevel * 100 - optInto,
      streak: completedToday ? me.streak : me.streak + 1,
    });

    try {
      const res = await fetch(`${API_URL}/quests/${questId}/complete`, {
        method: "POST",
      });

      if (!res.ok) {
        setQuests(prevQuests);
        setMe(prevMe);
        return;
      }

      const data: { completion: Completion; me: MeStats } = await res.json();

   
      setMe(data.me);

      if (res.status === 201) {
        setCompletions((prev) => [data.completion, ...prev]);
        const xpGained = data.me.xp - prevMe.xp;
        const bonusEarned = xpGained - data.completion.base_xp;

        triggerXpPopup(
          `+${xpGained} EXP!`,
          bonusEarned > 0
            ? `(${data.completion.base_xp} BASE + ${bonusEarned} STREAK BONUS)`
            : isOverdue
            ? "LATE PENALTY (-50% EXP)"
            : "QUEST CLEARED!"
        );

        if (data.me.level > prevMe.level) {
          setLevelUpBanner({ from: prevMe.level, to: data.me.level });
          setTimeout(() => setLevelUpBanner(null), 5000);
        }
      }
    } catch (err) {
      console.error("Failed to complete quest:", err);
      setQuests(prevQuests);
      setMe(prevMe);
    }
  }

  // DELETE /completions/:id
  async function handleUndoCompletion(completionId: string) {
    const res = await fetch(`${API_URL}/completions/${completionId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      await syncAllFromServer();
    }
  }

  // PUT /me
  async function handleTimezoneChange(newTimezone: string) {
    const res = await fetch(`${API_URL}/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: newTimezone }),
    });

    if (res.ok) {
      const updatedMe: MeStats = await res.json();
      setMe(updatedMe);
      // Reîncărcăm și quest-urile fiindcă `done` la quest-urile daily depinde de ziua din noul timezone
      const questsRes = await fetch(`${API_URL}/quests`);
      if (questsRes.ok) {
        setQuests(await questsRes.json());
      }
    }
  }

  // POST /test/reset
  async function handleResetAll() {
    const res = await fetch(`${API_URL}/test/reset`, {
      method: "POST",
    });

    if (res.ok) {
      setLevelUpBanner(null);
      await syncAllFromServer();
    }
  }

  return (
    <div className="min-h-screen bg-[#120d1d] text-[#f4f4f8] relative overflow-x-hidden crt-scanlines pb-16">
      {/* Floating 8-Bit +EXP Popups */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {xpPopups.map((popup) => (
          <div key={popup.id} className="pixel-box-gold px-5 py-3 animate-bounce">
            <div className="font-pixel text-base text-amber-300 drop-shadow-[2px_2px_0px_#000]">
              {popup.text}
            </div>
            {popup.subtext && (
              <div className="font-vt text-lg text-amber-100 mt-1">
                {popup.subtext}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Retro RPG LEVEL UP Modal */}
      {levelUpBanner && (
        <div className="fixed inset-x-0 top-8 z-50 mx-auto max-w-xl px-4">
          <div className="pixel-box-gold p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-amber-400 border-4 border-black text-black font-pixel text-2xl shadow-[4px_4px_0px_#000]">
                  ★
                </div>
                <div>
                  <p className="font-pixel text-xs text-amber-300 tracking-wider">
                    *** FANFARE: LEVEL UP! ***
                  </p>
                  <h3 className="font-pixel text-lg sm:text-xl text-white mt-2 drop-shadow-[2px_2px_0px_#000]">
                    LVL {levelUpBanner.from} ▶ LVL {levelUpBanner.to}
                  </h3>
                  <p className="font-vt text-xl text-amber-100 mt-1">
                    NEW CLASS:{" "}
                    {
                      HERO_CLASSES[
                        Math.min(levelUpBanner.to - 1, HERO_CLASSES.length - 1)
                      ]
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLevelUpBanner(null)}
                className="pixel-btn bg-amber-400 px-3 py-2 font-pixel text-[10px] text-black"
              >
                OK [X]
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* Header & Timezone Controls */}
        <header className="pixel-box mb-8 p-4 sm:p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center bg-indigo-600 border-4 border-black shadow-[4px_4px_0px_#000] font-pixel text-lg text-amber-300">
              ⚔
            </div>
            <div>
              <div className="font-pixel text-[10px] text-emerald-400 tracking-widest">
                 VER 1.0
              </div>
              <h1 className="font-pixel text-xl sm:text-2xl text-white mt-1 drop-shadow-[3px_3px_0px_#000]">
                QUEST HABIT
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-[#120d1d] p-2.5 border-2 border-black">
            <div className="px-2">
              <span className="font-pixel text-[9px] text-slate-400 mr-2">
                TODAY:
              </span>
              <span className="font-vt text-2xl text-amber-300 tracking-wider">
                [{todayStr}]
              </span>
            </div>

            <select
              value={me.timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              aria-label="Select Timezone"
              className="border-2 border-black bg-[#1d162b] px-2 py-1 font-vt text-xl text-emerald-300 focus:outline-none"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleResetAll}
              className="pixel-btn bg-rose-600 px-2.5 py-1.5 font-pixel text-[10px] text-white"
            >
              RESET
            </button>
          </div>
        </header>

        <HeroHud me={me} completedToday={completedToday} />

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <QuestForm onAddQuest={handleAddQuest} />
            <QuestBoard
              quests={enrichedQuests}
              onComplete={handleCompleteQuest}
            />
          </div>

          <div className="lg:col-span-5">
            <AdventureLog
              completions={completions}
              quests={quests}
              onUndo={handleUndoCompletion}
            />
          </div>
        </div>
      </main>
    </div>
  );
}