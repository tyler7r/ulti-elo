// /lib/supabase/seasons.ts (or your utility file)

import { supabase } from "@/lib/supabase"; // Adjust path
import { PlayerTeamSeasonStats } from "@/lib/types"; // Adjust path

export const getPlayerSeasonHistory = async (
  pt_id: string // Use player_teams id
): Promise<{
  history: PlayerTeamSeasonStats[] | null;
  error: string | null;
}> => {
  if (!pt_id) {
    return { history: null, error: "Player Team ID (pt_id) is required." };
  }
  try {
    const { data, error } = await supabase
      .from("player_team_season_stats")
      .select(
        `
                *,
                season:seasons(season_no, start_date, end_date),
                player_teams(*, player: players(name))
            `
      ) // Select all stats and join season_no/dates
      .eq("pt_id", pt_id)
      .order("seasons(start_date)", { ascending: false }); // Show most recent seasons first

    if (error) throw error;

    // Casting needed because generated column isn't inferred correctly by default Supabase types
    return { history: (data as PlayerTeamSeasonStats[]) ?? [], error: null };
  } catch (error) {
    console.error(`Error fetching season history for ${pt_id}:`, error);
    return {
      history: null,
      error: "Failed to fetch season history.",
    };
  }
};
