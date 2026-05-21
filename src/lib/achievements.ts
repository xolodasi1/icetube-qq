// Achievements and gamification engine for ICETUBE 2.0
// Tracks user levels, achievements, custom badges, and responsive UI borders.

export interface LevelInfo {
  level: number;
  title: string;
  badge: string;
  color: string;
  nextLevelXp: number;
  currentLevelMinXp: number;
  progressPercent: number;
  borderClass: string;
  glowClass: string;
}

export const LEVELS = [
  { xpNeeded: 0, title: "Полярник", badge: "🧭", color: "text-[#a5f3fc]", borderClass: "border-cyan-400/40", glowClass: "shadow-[0_0_10px_rgba(165,243,252,0.2)]" },
  { xpNeeded: 150, title: "Полярный Следопыт", badge: "🏔️", color: "text-[#38bdf8]", borderClass: "border-sky-400/50", glowClass: "shadow-[0_0_15px_rgba(56,189,248,0.3)]" },
  { xpNeeded: 400, title: "Охотник за трендами", badge: "❄️", color: "text-[#70d6ff]", borderClass: "border-[#70d6ff]/75", glowClass: "shadow-[0_0_20px_rgba(112,214,255,0.4)]" },
  { xpNeeded: 850, title: "Покоритель Льда", badge: "🦭", color: "text-[#00ff80]", borderClass: "border-[#00ff80]/60", glowClass: "shadow-[0_0_25px_rgba(0,255,128,0.4)]" },
  { xpNeeded: 1500, title: "Ледокол", badge: "🧊", color: "text-[#bc00dd]", borderClass: "border-purple-500/80 animate-pulse", glowClass: "shadow-[0_0_35px_rgba(188,0,221,0.5)] bg-gradient-to-r from-purple-500/20 via-[#70d6ff]/10 to-blue-500/20" }
];

export function getXP(userId: string = "guest"): number {
  try {
    const val = localStorage.getItem(`icetube_xp_${userId}`);
    return val ? parseInt(val, 10) : 0;
  } catch (e) {
    return 0;
  }
}

export function setXP(xp: number, userId: string = "guest"): void {
  try {
    localStorage.setItem(`icetube_xp_${userId}`, xp.toString());
    window.dispatchEvent(new CustomEvent('icetube_xp_changed', { detail: { xp, userId } }));
  } catch (e) {
    console.warn("Storage write failed:", e);
  }
}

export function addXP(points: number, userId: string = "guest"): { currentXP: number, oldLevel: number, newLevel: number, leveledUp: boolean } {
  const oldXP = getXP(userId);
  const newXP = oldXP + points;
  setXP(newXP, userId);

  const oldLevelInfo = getLevelInfo(oldXP);
  const newLevelInfo = getLevelInfo(newXP);

  return {
    currentXP: newXP,
    oldLevel: oldLevelInfo.level,
    newLevel: newLevelInfo.level,
    leveledUp: newLevelInfo.level > oldLevelInfo.level
  };
}

export function getLevelInfo(xp: number): LevelInfo {
  let level = 1;
  let title = LEVELS[0].title;
  let badge = LEVELS[0].badge;
  let color = LEVELS[0].color;
  let borderClass = LEVELS[0].borderClass;
  let glowClass = LEVELS[0].glowClass;
  let nextLevelXp = LEVELS[1].xpNeeded;
  let currentLevelMinXp = 0;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xpNeeded) {
      level = i + 1;
      title = LEVELS[i].title;
      badge = LEVELS[i].badge;
      color = LEVELS[i].color;
      borderClass = LEVELS[i].borderClass;
      glowClass = LEVELS[i].glowClass;
      currentLevelMinXp = LEVELS[i].xpNeeded;
      nextLevelXp = i + 1 < LEVELS.length ? LEVELS[i + 1].xpNeeded : LEVELS[i].xpNeeded + 5000;
    } else {
      break;
    }
  }

  const denominator = nextLevelXp - currentLevelMinXp;
  const progressPercent = denominator > 0 
    ? Math.min(100, Math.max(0, ((xp - currentLevelMinXp) / denominator) * 100))
    : 100;

  return {
    level,
    title,
    badge,
    color,
    nextLevelXp,
    currentLevelMinXp,
    progressPercent,
    borderClass,
    glowClass
  };
}
