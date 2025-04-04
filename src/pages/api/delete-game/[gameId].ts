// /pages/api/delete-game.ts
import { supabase } from "@/lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";
import { recalculateElo2 } from "../recalculateElo2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    const { gameId } = req.query;

    if (!gameId || typeof gameId !== "string") {
      return res.status(400).json({ error: "Missing or invalid gameId" });
    }

    try {
      // 1. Fetch the game to be deleted to get its match_date and team_id
      const { data: deletedGame, error: fetchDeletedGameError } = await supabase
        .from("games")
        .select("match_date, team_id")
        .eq("id", gameId)
        .single();

      if (fetchDeletedGameError || !deletedGame) {
        console.error("Error fetching game to delete:", fetchDeletedGameError);
        return res
          .status(500)
          .json({ error: "Failed to fetch game details for deletion" });
      }

      // 6. Check if there are subsequent games and trigger recalculation
      const { data: subsequentGame, error: fetchSubsequentGameError } =
        await supabase
          .from("games")
          .select("id")
          .eq("team_id", deletedGame.team_id)
          .gt("match_date", deletedGame.match_date)
          .order("match_date");

      if (
        fetchSubsequentGameError
        // fetchSubsequentGameError.code !== "PGRST116"
      ) {
        console.error(
          "Error fetching subsequent games:",
          fetchSubsequentGameError
        );
        return res
          .status(500)
          .json({ error: "Failed to check for subsequent games" });
      }

      if (subsequentGame && subsequentGame.length > 0) {
        await recalculateElo2(gameId, null, deletedGame.team_id);
      } else {
        //   2. Fetch all game_players associated with the game to be deleted
        const { data: gamePlayers, error: fetchGamePlayersError } =
          await supabase.from("game_players").select("*").eq("game_id", gameId);
        if (fetchGamePlayersError) {
          console.error("Error fetching game players:", fetchGamePlayersError);
          return res
            .status(500)
            .json({ error: "Failed to fetch game players for the game" });
        }
        // 3. Restore the player_teams stats based on the *_before columns
        const updates = gamePlayers.map(async (gp) => {
          const { error: updatePlayerTeamsError } = await supabase
            .from("player_teams")
            .update({
              mu: gp.mu_before,
              sigma: gp.sigma_before,
              elo: gp.elo_before,
              elo_change: gp.elo_change_before,
              highest_elo: gp.highest_elo_before,
              wins: gp.wins_before,
              losses: gp.losses_before,
              win_streak: gp.win_streak_before,
              loss_streak: gp.loss_streak_before,
              win_percent: gp.win_percent_before,
              longest_win_streak: gp.longest_win_streak_before,
            })
            .eq("pt_id", gp.pt_id); // gp.player_id now references player_teams.id
          if (updatePlayerTeamsError) {
            console.error(
              `Error updating player_teams for ID ${gp.pt_id}:`,
              updatePlayerTeamsError
            );
            throw new Error("Failed to restore player stats");
          }
        });
        await Promise.all(updates);
        // 4. Delete the game record from the games table
        const { error: deleteGameError } = await supabase
          .from("games")
          .delete()
          .eq("id", gameId);
        if (deleteGameError) {
          console.error("Error deleting game:", deleteGameError);
          return res.status(500).json({ error: "Failed to delete the game" });
        }
        // 5. Delete the game_players records associated with the game
        const { error: deleteGamePlayers } = await supabase
          .from("game_players")
          .delete()
          .eq("game_id", gameId);
        if (deleteGamePlayers) {
          console.error("Error deleting game players:", deleteGamePlayers);
          return res
            .status(500)
            .json({ error: "Failed to delete game players" });
        }
      }

      return res.status(200).json({
        message:
          "Game deleted and player stats restored successfully. Subsequent games will be recalculated if necessary.",
      });
    } catch (error) {
      console.error("Error deleting game:", error);
      return res.status(500);
    }
  } else {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
