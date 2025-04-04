import { supabase } from "@/lib/supabase";
import { GameFormSquadType } from "@/lib/types";
import { updateElo } from "./updateElo";

type submitGameProps = {
  teamId: string;
  sqA: GameFormSquadType;
  sqB: GameFormSquadType;
  gameWeight: string;
};

export async function submitGame({
  teamId,
  sqA,
  sqB,
  gameWeight,
}: submitGameProps) {
  try {
    const { data: game, error } = await supabase
      .from("games")
      .insert([
        {
          team_id: teamId,
          squad_a_score: sqA.score,
          squad_b_score: sqB.score,
          squad_a_id: sqA.id,
          squad_b_id: sqB.id,
          game_weight: gameWeight,
        },
      ])
      .select("id")
      .single();

    if (error) throw error;

    const gameId = game.id;

    // Insert players into game_players
    const allGamePlayers = [
      ...sqA.players.map((player) => ({
        squad_id: sqA.id,
        game_id: gameId,
        pt_id: player.pt_id,
        is_winner: sqA.score > sqB.score,
      })),
      ...sqB.players.map((player) => ({
        squad_id: sqB.id,
        game_id: gameId,
        pt_id: player.pt_id,
        is_winner: sqB.score > sqA.score,
      })),
    ];

    await supabase.from("game_players").insert(allGamePlayers);

    // Update Elo ratings
    await updateElo(gameId, sqA, sqB, teamId);

    return gameId;
  } catch (error) {
    console.error("Error submitting game:", error);
    return false;
  }
}
