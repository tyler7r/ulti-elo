import { supabase } from "@/lib/supabase";
import { updateElo } from "./updateElo";

type submitGameProps = {
  teamId: string;
  squadAID: string;
  squadBID: string;
  squadAIDs: string[];
  squadBIDs: string[];
  scoreA: number;
  scoreB: number;
};

export async function submitGame({
  teamId,
  squadAID,
  squadBID,
  squadAIDs,
  squadBIDs,
  scoreA,
  scoreB,
}: submitGameProps) {
  try {
    const { data: game, error } = await supabase
      .from("games")
      .insert([
        {
          team_id: teamId,
          squad_a_score: scoreA,
          squad_b_score: scoreB,
          squad_a_id: squadAID,
          squad_b_id: squadBID,
        },
      ])
      .select("id")
      .single();

    if (error) throw error;

    const gameId = game.id;

    // Insert players into game_players
    const allPlayers = [
      ...squadAIDs.map((player) => ({
        squad_id: squadAID,
        game_id: gameId,
        player_id: player,
        squad: "A",
        is_winner: scoreA > scoreB,
      })),
      ...squadBIDs.map((player) => ({
        squad_id: squadBID,
        game_id: gameId,
        player_id: player,
        squad: "B",
        is_winner: scoreB > scoreA,
      })),
    ];

    await supabase.from("game_players").insert(allPlayers);

    // Update Elo ratings
    await updateElo(gameId, squadAIDs, squadBIDs, scoreA, scoreB, teamId);

    return gameId;
  } catch (error) {
    console.error("Error submitting game:", error);
    return false;
  }
}
