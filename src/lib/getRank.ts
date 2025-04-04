export const getRank = (elo: number) => {
  if (elo >= 2200) return { icon: "👑", name: "Apex" };
  if (elo >= 2000) return { icon: "⚡", name: "Legend" };
  if (elo >= 1800) return { icon: "🏆", name: "Master" };
  if (elo >= 1600) return { icon: "💎", name: "Diamond" };
  if (elo >= 1400) return { icon: "🌟", name: "Platinum" };
  if (elo >= 1200) return { icon: "⚔️", name: "Elite" };
  if (elo >= 800) return { icon: "🛡️", name: "Competitor" };
  return { icon: "👶", name: "Recruit" };
};
