import React from "react";
import { HERO_CLASSES, MeStats } from "../types/quest";
import { PixelFireSprite, PixelHeroSprite } from "./PixelSprites";

export function HeroHud({
  me,
  completedToday,
}: {
  me: MeStats;
  completedToday: boolean;
}) {
  const levelCap = me.level * 100;
  const totalSegments = 20;
  const filledSegments = Math.min(
    totalSegments,
    Math.round((me.xp_into_level / levelCap) * totalSegments)
  );

  const heroClass =
    HERO_CLASSES[Math.min(me.level - 1, HERO_CLASSES.length - 1)];

  const nextStreakIfCompletedToday = completedToday
    ? me.streak
    : me.streak + 1;
  const dailyBonusPreview = Math.min(nextStreakIfCompletedToday * 2, 14);

  return (
    <section className="mb-8 grid gap-6 lg:grid-cols-12">
      {/* Player Stats & EXP Bar */}
      <div className="pixel-box p-6 lg:col-span-8 flex flex-col justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex flex-col items-center">
            <div className="flex h-28 w-28 items-center justify-center bg-[#120d1d] border-4 border-black shadow-[4px_4px_0px_#000]">
              <PixelHeroSprite level={me.level} />
            </div>
            <span className="mt-2 bg-amber-400 border-2 border-black px-2.5 py-0.5 font-pixel text-[10px] text-black">
              LVL {me.level}
            </span>
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
              <div>
                <div className="font-pixel text-xs text-indigo-300">
                  CLASS: {heroClass}
                </div>
                <div className="font-vt text-2xl text-slate-300 mt-1">
                  TOTAL EXP:{" "}
                  <span className="text-amber-300 font-bold">{me.xp} PTS</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-pixel text-xs text-emerald-400">
                  EXP {me.xp_into_level} / {levelCap}
                </span>
                <div className="font-vt text-xl text-slate-400">
                  NEED {me.xp_to_next_level} EXP FOR LVL {me.level + 1}
                </div>
              </div>
            </div>

            <div className="border-4 border-black bg-[#09060f] p-1.5 shadow-[inset_0_2px_0_#000]">
              <div
                className="grid gap-1 h-7"
                style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }}
              >
                {Array.from({ length: totalSegments }).map((_, idx) => {
                  const active =
                    idx < filledSegments || (idx === 0 && me.xp_into_level > 0);
                  return (
                    <div
                      key={idx}
                      className={`h-full transition-colors duration-150 ${
                        active
                          ? "bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 shadow-[inset_0_2px_0_#fef08a]"
                          : "bg-[#1a1426]"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Torch Shrine */}
      <div className="pixel-box-gold p-6 lg:col-span-4 flex flex-col justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#120d1d] border-4 border-black">
            <PixelFireSprite active={me.streak > 0} />
          </div>
          <div>
            <div className="font-pixel text-[10px] text-amber-300">
              COMBO STREAK
            </div>
            <div className="font-pixel text-2xl text-white mt-1 drop-shadow-[2px_2px_0px_#000]">
              {me.streak} {me.streak === 1 ? "DAY" : "DAYS"}
            </div>
            <p className="font-vt text-xl text-amber-200 mt-0.5 leading-tight">
              {completedToday
                ? `✓ +${Math.min(me.streak * 2, 14)} BONUS EXP CLAIMED TODAY`
                : `NEXT CLEAR TODAY: +${dailyBonusPreview} BONUS EXP!`}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
            const active = me.streak >= dayNum;
            return (
              <div
                key={dayNum}
                className={`border-2 border-black py-1 text-center ${
                  active
                    ? "bg-amber-400 text-black font-bold"
                    : "bg-[#120d1d] text-slate-500"
                }`}
              >
                <div className="font-pixel text-[8px]">
                  D{dayNum === 7 ? "7+" : dayNum}
                </div>
                <div className="font-vt text-base leading-none mt-0.5">
                  +{dayNum * 2}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}