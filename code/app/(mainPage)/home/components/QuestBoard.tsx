import React, { useState } from "react";
import { DIFFICULTY_CONFIG, EnrichedQuest } from "../types/quest";
import { PixelDifficultyIcon } from "./PixelSprites";

interface QuestBoardProps {
  quests: EnrichedQuest[];
  onComplete: (questId: string) => void;
}

export function QuestBoard({ quests, onComplete }: QuestBoardProps) {
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  const filteredQuests = quests.filter((q) => {
    if (filter === "active") return !q.done;
    if (filter === "done") return q.done;
    return true;
  });

  return (
    <div className="pixel-box p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-pixel text-sm text-white drop-shadow-[2px_2px_0px_#000]">
             GUILD QUEST BOARD
          </h2>
          <span className="border-2 border-black bg-indigo-600 px-2.5 py-0.5 font-pixel text-[10px] text-white">
            {quests.filter((q) => !q.done).length} OPEN
          </span>
        </div>

        <div className="flex gap-1.5">
          {(["all", "active", "done"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`pixel-btn px-3 py-1.5 font-pixel text-[9px] uppercase ${
                filter === tab
                  ? "bg-amber-400 text-black"
                  : "bg-[#120d1d] text-slate-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-2 pixel-scroll">
        {filteredQuests.length === 0 ? (
          <div className="border-4 border-dashed border-black bg-[#120d1d] p-8 text-center font-vt text-2xl text-slate-400">
            NO QUESTS IN THIS LOG. POST ONE ABOVE!
          </div>
        ) : (
          filteredQuests.map((quest) => {
            const cfg = DIFFICULTY_CONFIG[quest.difficulty];
            const effectiveXp = quest.isOverdue ? cfg.lateXp : cfg.xp;

            return (
              <div
                key={quest.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-4 border-black p-4 shadow-[4px_4px_0px_#000] transition ${
                  quest.done
                    ? "bg-[#14101f] opacity-60"
                    : quest.isOverdue
                    ? "bg-[#2b1219]"
                    : "bg-[#120d1d]"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="border-2 border-black bg-[#1d162b] p-1.5">
                    <PixelDifficultyIcon difficulty={quest.difficulty} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 font-pixel text-[9px] ${cfg.badgeBg}`}
                      >
                        {cfg.label}
                      </span>

                      {quest.recurrence === "daily" && (
                        <span className="border-2 border-black bg-sky-600 px-2 py-0.5 font-pixel text-[9px] text-white">
                          ↻ DAILY
                        </span>
                      )}

                      {quest.due_date && (
                        <span
                          className={`border-2 border-black px-2 py-0.5 font-pixel text-[9px] ${
                            quest.isOverdue
                              ? "bg-rose-600 text-white"
                              : "bg-slate-700 text-slate-200"
                          }`}
                        >
                          DUE {quest.due_date}
                        </span>
                      )}

                      {quest.isOverdue && (
                        <span className="border-2 border-black bg-rose-500 px-2 py-0.5 font-pixel text-[9px] text-black animate-pulse">
                            OVERDUE (-50%)
                        </span>
                      )}

                      {quest.done && (
                        <span className="border-2 border-black bg-emerald-400 px-2 py-0.5 font-pixel text-[9px] text-black">
                            CLEARED
                        </span>
                      )}
                    </div>

                    <p
                      className={`font-vt text-2xl leading-tight truncate ${
                        quest.done
                          ? "line-through text-slate-500"
                          : "text-white"
                      }`}
                    >
                      {quest.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-pixel text-xs text-amber-300">
                      +{effectiveXp} EXP
                    </div>
                    {quest.isOverdue && (
                      <div className="font-vt text-lg line-through text-rose-400">
                        +{cfg.xp} EXP
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={quest.done}
                    onClick={() => onComplete(quest.id)}
                    className={`pixel-btn px-4 py-2.5 font-pixel text-[10px] ${
                      quest.done
                        ? "bg-slate-800 text-emerald-400 cursor-not-allowed"
                        : "bg-emerald-400 text-black"
                    }`}
                  >
                    {quest.done ? "DONE ✓" : "SLAIN! ▶"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}