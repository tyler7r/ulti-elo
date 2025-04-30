import { supabase } from "@/lib/supabase";

export const startNewSeason = async (teamId: string) => {
  try {
    // 1. Check if an active season already exists
    const { count: activeCount } = await supabase
      .from("seasons")
      .select("id", { count: "exact", head: true }) // Just need the count
      .eq("team_id", teamId)
      .eq("active", true);

    if (activeCount && activeCount > 0)
      throw new Error("Cannot start a new season while another is active.");

    // 2. Find the highest existing season number for this team
    const { data: lastSeason, error: lastSeasonError } = await supabase
      .from("seasons")
      .select("season_no")
      .eq("team_id", teamId)
      .order("season_no", { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle in case no seasons exist yet

    if (lastSeasonError)
      throw new Error(
        `Failed to get last season number: ${lastSeasonError.message}`
      );
    const nextSeasonNumber = (lastSeason?.season_no ?? 0) + 1; // Start at 1 if none exist

    // 3. Create the new season record with the calculated number
    const { data: newSeasonData, error: createError } = await supabase
      .from("seasons")
      .insert({
        team_id: teamId,
        season_no: nextSeasonNumber, // <-- Use calculated number
        start_date: new Date().toISOString(),
        end_date: null,
        active: true,
      })
      .select()
      .single();

    if (createError)
      throw new Error(`Failed to create new season: ${createError.message}`);
    if (!newSeasonData)
      throw new Error("Failed to create new season, no data returned.");

    // 4. Reset player_teams stats
    const { error: resetError } = await supabase
      .from("player_teams")
      .update({
        // Reset fields based on user request
        wins: 0,
        losses: 0,
        win_streak: 0,
        loss_streak: 0,
        elo: 1500,
        mu: 15.0,
        sigma: 4.0,
        elo_change: 0,
        longest_win_streak: 0,
        win_percent: 0,
        highest_elo: 1500,
        last_updated: new Date().toISOString(),
      })
      .eq("team_id", teamId);

    if (resetError) {
      console.error(resetError.message);
    }
  } catch (error) {
    console.error(error);
  }
};
