import React, { useState } from "react";
import { DIFFICULTY_CONFIG, Difficulty, QuestType } from "../types/quest";

interface QuestFormProps {
  onAddQuest: (data: {
    title: string;
    difficulty: Difficulty;
    due_date: string | null;
    recurrence: "daily" | null;
  }) => void;
}

export function QuestForm({ onAddQuest }: QuestFormProps) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questType, setQuestType] = useState<QuestType>("daily");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmed = title.trim();
    if (trimmed.length < 1 || title.length > 100) {
      setFormError("! QUEST TITLE MUST BE 1-100 CHARS !");
      return;
    }

    if (questType === "due-date" && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setFormError("! PICK A VALID DEADLINE (YYYY-MM-DD) !");
      return;
    }

    onAddQuest({
      title: trimmed,
      difficulty,
      due_date: questType === "due-date" ? dueDate : null,
      recurrence: questType === "daily" ? "daily" : null,
    });

    setTitle("");
    if (questType === "due-date") setDueDate("");
  }

  return (
    <form onSubmit={handleSubmit} className="pixel-box p-6">
      <h2 className="font-pixel text-sm text-amber-300 mb-5 flex items-center gap-2 drop-shadow-[2px_2px_0px_#000]">
        <span>📜</span> POST NEW QUEST TO GUILD BOARD
      </h2>

      <div className="flex flex-col gap-5">
        <div>
          <label className="block font-pixel text-[10px] text-slate-300 mb-2">
            QUEST OBJECTIVE (1-100 CHARS):
          </label>
          <input
            type="text"
            placeholder="E.g. Slay the laundry pile..."
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-4 border-black bg-[#0e0a17] px-4 py-2.5 font-vt text-2xl text-white placeholder-slate-600 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-2">
              MONSTER RANK (EXP):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
                const cfg = DIFFICULTY_CONFIG[d];
                const selected = difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`pixel-btn py-2 px-1 text-center ${
                      selected ? cfg.btnColor : "bg-[#120d1d] text-slate-400"
                    }`}
                  >
                    <div className="font-pixel text-[9px]">{cfg.label}</div>
                    <div className="font-vt text-xl leading-none mt-1">
                      +{cfg.xp} EXP
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-2">
              QUEST TYPE:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "daily", label: "DAILY" },
                { id: "due-date", label: "DEADLINE" },
                { id: "one-off", label: "ONE-OFF" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setQuestType(item.id as QuestType)}
                  className={`pixel-btn py-2 px-1 font-pixel text-[9px] ${
                    questType === item.id
                      ? "bg-indigo-500 text-white"
                      : "bg-[#120d1d] text-slate-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {questType === "due-date" && (
          <div className="flex flex-wrap items-center gap-3 bg-[#120d1d] p-3 border-2 border-black">
            <label className="font-pixel text-[10px] text-amber-300">
              DEADLINE DATE:
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="border-2 border-black bg-[#1d162b] px-3 py-1 font-vt text-xl text-white focus:border-amber-400 focus:outline-none"
            />
            <span className="font-vt text-lg text-rose-300">
              * Late clear = 50% EXP (rounded down)
            </span>
          </div>
        )}

        {formError && (
          <div className="border-2 border-black bg-rose-700 px-3 py-2 font-pixel text-[10px] text-white">
            {formError}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="pixel-btn bg-amber-400 px-6 py-3 font-pixel text-xs text-black"
          >
            + POST QUEST
          </button>
        </div>
      </div>
    </form>
  );
}