import React from "react";
import { Difficulty } from "../types/quest";

export function PixelHeroSprite({ level }: { level: number }) {
  const capeColor =
    level >= 4 ? "#f43f5e" : level >= 2 ? "#6366f1" : "#10b981";
  const crownColor = level >= 3 ? "#fbbf24" : "#94a3b8";

  return (
    <svg
      viewBox="0 0 16 16"
      className="h-20 w-20 animate-pixel-float"
      shapeRendering="crispEdges"
    >
      <rect x="5" y="1" width="6" height="2" fill={crownColor} />
      <rect x="4" y="2" width="1" height="1" fill="#fbbf24" />
      <rect x="11" y="2" width="1" height="1" fill="#fbbf24" />
      <rect x="5" y="3" width="6" height="4" fill="#fcd34d" />
      <rect x="6" y="4" width="1" height="2" fill="#09060f" />
      <rect x="9" y="4" width="1" height="2" fill="#09060f" />
      <rect x="3" y="7" width="10" height="6" fill={capeColor} />
      <rect x="5" y="7" width="6" height="5" fill="#cbd5e1" />
      <rect x="7" y="8" width="2" height="3" fill="#fbbf24" />
      <rect x="13" y="3" width="1" height="6" fill="#e2e8f0" />
      <rect x="12" y="7" width="3" height="1" fill="#fbbf24" />
      <rect x="13" y="8" width="1" height="2" fill="#78350f" />
      <rect x="5" y="12" width="2" height="3" fill="#475569" />
      <rect x="9" y="12" width="2" height="3" fill="#475569" />
    </svg>
  );
}

export function PixelFireSprite({ active }: { active: boolean }) {
  const outer = active ? "#f97316" : "#475569";
  const mid = active ? "#fbbf24" : "#64748b";
  const core = active ? "#fef08a" : "#94a3b8";
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-12 w-12 ${active ? "animate-pixel-float" : "opacity-50"}`}
      shapeRendering="crispEdges"
    >
      <rect x="7" y="1" width="2" height="2" fill={outer} />
      <rect x="6" y="3" width="4" height="2" fill={outer} />
      <rect x="4" y="5" width="8" height="3" fill={outer} />
      <rect x="3" y="8" width="10" height="4" fill={outer} />
      <rect x="5" y="12" width="6" height="2" fill={outer} />
      <rect x="6" y="6" width="4" height="5" fill={mid} />
      <rect x="5" y="9" width="6" height="3" fill={mid} />
      <rect x="7" y="9" width="2" height="3" fill={core} />
    </svg>
  );
}

export function PixelDifficultyIcon({ difficulty }: { difficulty: Difficulty }) {
  if (difficulty === "easy") {
    return (
      <svg viewBox="0 0 16 16" className="h-8 w-8 shrink-0" shapeRendering="crispEdges">
        <rect x="6" y="2" width="4" height="2" fill="#a3e635" />
        <rect x="7" y="4" width="2" height="2" fill="#cbd5e1" />
        <rect x="4" y="6" width="8" height="7" fill="#10b981" />
        <rect x="5" y="7" width="2" height="2" fill="#a7f3d0" />
        <rect x="5" y="13" width="6" height="1" fill="#065f46" />
      </svg>
    );
  }
  if (difficulty === "medium") {
    return (
      <svg viewBox="0 0 16 16" className="h-8 w-8 shrink-0" shapeRendering="crispEdges">
        <rect x="11" y="2" width="3" height="3" fill="#fef08a" />
        <rect x="9" y="4" width="3" height="3" fill="#f59e0b" />
        <rect x="7" y="6" width="3" height="3" fill="#f59e0b" />
        <rect x="5" y="8" width="3" height="3" fill="#d97706" />
        <rect x="3" y="9" width="5" height="2" fill="#fbbf24" />
        <rect x="2" y="12" width="3" height="2" fill="#78350f" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="h-8 w-8 shrink-0" shapeRendering="crispEdges">
      <rect x="3" y="2" width="10" height="3" fill="#e11d48" />
      <rect x="2" y="5" width="12" height="5" fill="#be123c" />
      <rect x="4" y="10" width="8" height="3" fill="#9f1239" />
      <rect x="6" y="13" width="4" height="2" fill="#881337" />
      <rect x="6" y="5" width="4" height="5" fill="#fbbf24" />
    </svg>
  );
}