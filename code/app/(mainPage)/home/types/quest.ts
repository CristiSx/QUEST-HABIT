export type Difficulty = "easy" | "medium" | "hard";
export type QuestType = "one-off" | "due-date" | "daily";

export interface Quest {
  id: string;
  title: string;
  difficulty: Difficulty;
  due_date: string | null;
  recurrence: "daily" | null;
  done: boolean;
}

export interface EnrichedQuest extends Quest {
  isOverdue: boolean;
}

export interface Completion {
  id: string;
  quest_id: string;
  day: string;
  base_xp: number;
  created_at: string;
}

export interface MeStats {
  timezone: string;
  xp: number;
  level: number;
  xp_into_level: number;
  xp_to_next_level: number;
  streak: number;
}

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    label: string;
    monster: string;
    xp: number;
    lateXp: number;
    badgeBg: string;
    btnColor: string;
  }
> = {
  easy: {
    label: "EASY",
    monster: "SLIME RANK",
    xp: 10,
    lateXp: 5,
    badgeBg: "bg-emerald-600 text-emerald-100 border-2 border-black",
    btnColor: "bg-emerald-500 text-black",
  },
  medium: {
    label: "MEDIUM",
    monster: "GOBLIN RANK",
    xp: 25,
    lateXp: 12,
    badgeBg: "bg-amber-500 text-black border-2 border-black",
    btnColor: "bg-amber-400 text-black",
  },
  hard: {
    label: "HARD",
    monster: "DRAGON RANK",
    xp: 50,
    lateXp: 25,
    badgeBg: "bg-rose-600 text-white border-2 border-black",
    btnColor: "bg-rose-500 text-white",
  },
};

export const HERO_CLASSES = [
  "NOVICE SQUIRE",
  "DUNGEON SCOUT",
  "KNIGHT ERRANT",
  "ARCANE PALADIN",
  "DRAGON SLAYER",
  "REALM CHAMPION",
  "MYTHIC HERO",
];

export const COMMON_TIMEZONES = [
  "Europe/Bucharest",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "UTC",
];