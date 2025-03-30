import { GameFormSquadType, GamePlayerWithPlayer, Player } from "@/lib/types";

export const getOverlappingPlayers = (
  squadA: GameFormSquadType | null,
  squadB: GameFormSquadType | null
): Player[] => {
  if (!squadA || !squadB) return [];
  const squadBPlayers = squadB.players.map((p) => p.id);

  return squadA.players.filter((player) => squadBPlayers.includes(player.id));
};

export const getEditOverlappingPlayers = (
  squadA: GamePlayerWithPlayer[],
  squadB: GamePlayerWithPlayer[]
) => {
  if (!squadA || !squadB) return [];
  const squadBPlayers = squadB.map((p) => p.id);
  return squadA.filter((player) => squadBPlayers.includes(player.id));
};
