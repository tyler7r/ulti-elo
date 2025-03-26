import { GameFormSquadType, PlayerEloType } from "@/lib/types";

export const getOverlappingPlayers = (
  squadA: GameFormSquadType | null,
  squadB: GameFormSquadType | null
): PlayerEloType[] => {
  if (!squadA || !squadB) return [];
  const squadBPlayers = squadB.players.map((p) => p.id);

  return squadA.players.filter((player) => squadBPlayers.includes(player.id));
};
