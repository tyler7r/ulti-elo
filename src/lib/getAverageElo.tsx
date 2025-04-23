import { PlayerTeamType } from "./types";

export const calculateAverageElo = (players: PlayerTeamType[]) => {
  if (!players || players.length === 0) return 0;
  // Use nullish coalescing for potentially undefined ELO values
  return Math.round(
    players.reduce((acc, p) => acc + (p.elo ?? 0), 0) / players.length
  );
};
