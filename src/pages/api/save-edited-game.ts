// /pages/api/save-edited-game.ts
import { supabase } from "@/lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";
import { recalculateElo2 } from "./recalculateElo2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const {
      gameId,
      squadAId,
      squadBId,
      squadAScore,
      squadBScore,
      squadAPlayers,
      squadBPlayers,
      teamId,
      userId,
      weight,
    } = req.body;

    if (
      !gameId ||
      !squadAId ||
      !squadBId ||
      teamId === undefined ||
      squadAScore === undefined ||
      squadBScore === undefined ||
      !Array.isArray(squadAPlayers) ||
      !Array.isArray(squadBPlayers) ||
      !weight
    ) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
      // 1. Fetch the current game and game_players data before the edit
      const { data: previousGame, error: fetchGameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (fetchGameError) throw fetchGameError;

      const { data: previousGamePlayers, error: fetchGamePlayersError } =
        await supabase.from("game_players").select("*").eq("game_id", gameId);

      if (fetchGamePlayersError) throw fetchGamePlayersError;

      // 2. Record the game edit
      const { data: gameEditData, error: insertEditError } = await supabase
        .from("game_edits")
        .insert({
          game_id: gameId,
          previous_game_data: previousGame,
          previous_game_players_data: previousGamePlayers,
          edited_by_user_id: userId, // If you have user sessions
        })
        .select()
        .single();

      if (insertEditError) {
        console.error("Error recording game edit:", insertEditError);
        return res.status(500).json({ error: "Failed to record game edit" });
      }

      // 3. Update the game record with the new score and squad IDs (if they changed)
      const { error: updateGameError } = await supabase
        .from("games")
        .update({
          squad_a_id: squadAId,
          squad_b_id: squadBId,
          squad_a_score: squadAScore,
          squad_b_score: squadBScore,
          game_weight: weight,
        })
        .eq("id", gameId);

      if (updateGameError) {
        console.error("Error updating game:", updateGameError);
        return res.status(500).json({ error: "Failed to update game details" });
      }

      // 4. Update the game_players table
      // Delete existing game players for this game
      const { error: deleteGamePlayersError } = await supabase
        .from("game_players")
        .delete()
        .eq("game_id", gameId);

      if (deleteGamePlayersError) {
        console.error(
          "Error deleting existing game players:",
          deleteGamePlayersError
        );
        return res.status(500).json({ error: "Failed to update game players" });
      }

      // Insert new game players for squad A
      const gamePlayersA = squadAPlayers.map(
        (player: { pt_id: string; player_id: string }) => ({
          game_id: gameId,
          pt_id: player.pt_id,
          squad_id: squadAId,
          is_winner: squadAScore > squadBScore,
        })
      );
      const { error: insertGamePlayersAError } = await supabase
        .from("game_players")
        .insert(gamePlayersA);

      if (insertGamePlayersAError) {
        console.error(
          "Error inserting game players for squad A:",
          insertGamePlayersAError
        );
        return res
          .status(500)
          .json({ error: "Failed to update game players for squad A" });
      }

      // Insert new game players for squad B
      const gamePlayersB = squadBPlayers.map(
        (player: { pt_id: string; player_id: string }) => ({
          game_id: gameId,
          pt_id: player.pt_id,
          squad_id: squadBId,
          is_winner: squadBScore > squadAScore,
        })
      );
      const { error: insertGamePlayersBError } = await supabase
        .from("game_players")
        .insert(gamePlayersB);

      if (insertGamePlayersBError) {
        console.error(
          "Error inserting game players for squad B:",
          insertGamePlayersBError
        );
        return res
          .status(500)
          .json({ error: "Failed to update game players for squad B" });
      }

      // 5. Trigger ELO recalculation for this game and all subsequent games
      await recalculateElo2(gameId, gameEditData.id, teamId);

      res
        .status(200)
        .json({ message: "Game updated and ELO recalculated successfully" });
    } catch (error) {
      console.error("Error saving edited game:", error);
      return res.status(500).json({ error: error || "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
