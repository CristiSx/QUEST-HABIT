import React from "react";
import { Completion, Quest } from "../types/quest";

interface AdventureLogProps {
  completions: Completion[];
  quests: Quest[];
  onUndo: (completionId: string) => void;
}

export function AdventureLog({
  completions,
  quests,
  onUndo,
}: AdventureLogProps) {
  return (
    <div className="pixel-box p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-pixel text-sm text-amber-300 drop-shadow-[2px_2px_0px_#000]">
            ADVENTURE LOG
          </h2>
          <p className="font-vt text-xl text-slate-400 mt-1">
            UNDO ANY RECORD TO REWIND EXP & STREAK
          </p>
        </div>
        <span className="border-2 border-black bg-slate-800 px-2.5 py-1 font-pixel text-[10px] text-amber-300">
          {completions.length}
        </span>
      </div>

      {completions.length === 0 ? (
        <div className="border-4 border-dashed border-black bg-[#120d1d] p-8 text-center font-vt text-2xl text-slate-400">
          YOUR LOG IS EMPTY. COMPLETE A QUEST TO BEGIN YOUR LEGEND!
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-2 pixel-scroll">
          {completions.map((comp) => {
            const quest = quests.find((q) => q.id === comp.quest_id);
            return (
              <div
                key={comp.id}
                className="flex items-center justify-between gap-3 border-4 border-black bg-[#120d1d] p-3.5 shadow-[4px_4px_0px_#000]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-[10px] text-emerald-400">
                      +{comp.base_xp} BASE EXP
                    </span>
                    <span className="font-vt text-xl text-amber-200">
                      [{comp.day}]
                    </span>
                  </div>
                  <p className="font-vt text-2xl text-white truncate">
                    {quest ? quest.title : `Quest ${comp.quest_id}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onUndo(comp.id)}
                  className="pixel-btn bg-rose-600 px-3 py-2 font-pixel text-[9px] text-white shrink-0"
                >
                  UNDO ↺
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}