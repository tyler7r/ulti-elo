// /lib/supabase/seasons.ts (or your utility file)

import { supabase } from "@/lib/supabase"; // Adjust path as needed
import {
  PlayerAwardType,
  PlayerTeamSeasonStats,
  SeasonType,
} from "@/lib/types"; // Adjust path

// --- Helper Type for Game Player Stats ---
// Defines the structure expected from the game_players query for season calculations
type GamePlayerStats = {
  pt_id: string;
  wins_before: number;
  wins_after: number;
  losses_before: number;
  losses_after: number;
  // We get highest ELO and longest streak from the final player_teams state now
  games: { match_date: string } | null; // Joined game data
};

// --- Function to End the Current Active Season AND Start the Next One ---
export const endAndStartNextSeason = async (
  teamId: string
): Promise<{
  endedSeason: SeasonType | null;
  newSeason: SeasonType | null;
  error: string | null;
}> => {
  let nextSeasonNumber: number | null = null;
  let endedSeasonDataForReturn: SeasonType | null = null; // Store ended season data for return

  try {
    // === Step 1: Find and Validate Active Season ===
    const { data: activeSeasonData, error: findError } = await supabase
      .from("seasons")
      .select("*")
      .eq("team_id", teamId)
      .eq("active", true) // Find the currently active season
      .limit(1)
      .single(); // Expect exactly one active season per team

    // Handle case where no active season is found (should not happen with new team logic)
    if (findError && findError.code === "PGRST116") {
      console.error(
        `Critical Error: No active season found for team ${teamId} to end.`
      );
      return {
        endedSeason: null,
        newSeason: null,
        error: "Critical Error: No active season found.",
      };
    }
    // Handle other potential errors finding the season
    if (findError) {
      throw new Error(`Error finding active season: ${findError.message}`);
    }

    // Store active season details
    const activeSeason: SeasonType = activeSeasonData;
    nextSeasonNumber = activeSeason.season_no + 1; // Calculate the next season number

    // === Step 2: Archive Player Stats for the Ending Season ===

    // Find all sessions belonging to the ending season
    const { data: sessionIdsData, error: sessionIdsError } = await supabase
      .from("sessions")
      .select("id")
      .eq("season_id", activeSeason.id);
    if (sessionIdsError)
      throw new Error(
        `Failed to fetch sessions for season: ${sessionIdsError.message}`
      );
    const sessionIds = sessionIdsData?.map((s) => s.id) ?? [];

    // Find all unique players who participated in any session of this season
    let participatingPtIds: string[] = [];
    if (sessionIds.length > 0) {
      const { data: attendeesData, error: attendeesError } = await supabase
        .from("session_attendees")
        .select("pt_id")
        .in("session_id", sessionIds);
      if (attendeesError)
        throw new Error(
          `Failed to fetch attendees for season: ${attendeesError.message}`
        );
      participatingPtIds = [
        ...new Set(attendeesData?.map((a) => a.pt_id) ?? []),
      ]; // Get unique pt_ids
    } else {
      // Fallback: If no sessions, archive stats for all current team members
      // This covers cases where a season might end before any sessions were played
      const { data: teamPlayers, error: teamPlayersError } = await supabase
        .from("player_teams")
        .select("pt_id")
        .eq("team_id", teamId);
      if (teamPlayersError)
        throw new Error(
          `Failed to fetch team players for empty season archive: ${teamPlayersError.message}`
        );
      participatingPtIds = teamPlayers?.map((p) => p.pt_id) ?? [];
    }

    let archiveInserts: Omit<
      PlayerTeamSeasonStats,
      "id" | "archived_at" | "season_win_percent" | "final_rank"
    >[] = []; // Define type accurately

    // Proceed only if there are players to archive
    if (participatingPtIds.length > 0) {
      // Fetch Final Stats (current state of player_teams for these players)
      const { data: finalStatsData, error: statsError } = await supabase
        .from("player_teams")
        .select(
          "pt_id, player_id, elo, mu, sigma, wins, losses, highest_elo, longest_win_streak"
        )
        .in("pt_id", participatingPtIds);
      if (statsError)
        throw new Error(`Failed to fetch final stats: ${statsError.message}`);
      // Create a map for easy lookup
      const finalStatsMap = new Map(finalStatsData?.map((s) => [s.pt_id, s]));

      // Calculate Season-Specific Wins/Losses by comparing first/last game_players records
      const seasonPerformanceMap = new Map<
        string,
        { wins: number; losses: number; games: number }
      >();
      const gameIdsInSeason =
        (
          await supabase.from("games").select("id").in("session_id", sessionIds)
        ).data?.map((g) => g.id) || [];

      if (gameIdsInSeason.length > 0) {
        // Fetch relevant game_players data for the season
        const { data: gamePlayersData, error: gpError } = await supabase
          .from("game_players")
          .select(
            "pt_id, wins_before, wins_after, losses_before, losses_after, games!inner(match_date)"
          )
          .in("pt_id", participatingPtIds)
          .in("game_id", gameIdsInSeason);
        if (gpError)
          throw new Error(
            `Failed to fetch game player data for season stats: ${gpError.message}`
          );

        // Process each participating player
        participatingPtIds.forEach((ptId) => {
          const playerGames = ((gamePlayersData as GamePlayerStats[]) ?? [])
            .filter((gp) => gp.pt_id === ptId && gp.games?.match_date) // Ensure game date exists
            .sort(
              (a, b) =>
                new Date(a.games!.match_date).getTime() -
                new Date(b.games!.match_date).getTime()
            ); // Sort chronologically

          let seasonWins = 0;
          let seasonLosses = 0;
          if (playerGames.length > 0) {
            // Calculate diff between last game's after and first game's before
            const firstGame = playerGames[0];
            const lastGame = playerGames[playerGames.length - 1];
            seasonWins =
              (lastGame.wins_after ?? 0) - (firstGame.wins_before ?? 0);
            seasonLosses =
              (lastGame.losses_after ?? 0) - (firstGame.losses_before ?? 0);
          }
          seasonPerformanceMap.set(ptId, {
            wins: seasonWins,
            losses: seasonLosses,
            games: seasonWins + seasonLosses,
          });
        });
      } else {
        // If no games played in season, wins/losses are 0
        participatingPtIds.forEach((ptId) => {
          seasonPerformanceMap.set(ptId, { wins: 0, losses: 0, games: 0 });
        });
      }

      // Prepare Archive Data objects
      archiveInserts = participatingPtIds
        .map((ptId) => {
          const finalStats = finalStatsMap.get(ptId);
          const performance = seasonPerformanceMap.get(ptId);
          if (!finalStats) {
            console.warn(
              `Could not find final stats for pt_id ${ptId} during archive.`
            );
            return null; // Skip player if stats missing
          }

          return {
            pt_id: ptId,
            season_id: activeSeason.id,
            team_id: teamId,
            player_id: finalStats.player_id, // Ensure player_id was selected
            final_elo: finalStats.elo ?? 1500,
            final_mu: finalStats.mu ?? 15.0,
            final_sigma: finalStats.sigma ?? 4.0,
            season_highest_elo: finalStats.highest_elo ?? null, // Use player's highest_elo at season end
            season_longest_win_streak: finalStats.longest_win_streak ?? null, // Use player's longest_streak at season end
            season_wins: performance?.wins ?? 0,
            season_losses: performance?.losses ?? 0,
            season_games_played: performance?.games ?? 0,
          };
        })
        .filter(
          (
            item
          ): item is Omit<
            PlayerTeamSeasonStats,
            "id" | "archived_at" | "season_win_percent" | "final_rank"
          > => item !== null
        ); // Filter out nulls and assert type

      // Insert Archive Data into player_team_season_stats
      if (archiveInserts.length > 0) {
        const { error: archiveError } = await supabase
          .from("player_team_season_stats")
          .insert(archiveInserts); // Supabase handles array insert
        if (archiveError)
          throw new Error(
            `Failed to archive season stats: ${archiveError.message}`
          );
      }
    }

    // === Step 3: Determine and Insert Awards (using archived data) ===
    const awardsToInsert: Omit<PlayerAwardType, "id" | "awarded_at">[] = [];
    if (archiveInserts.length > 0) {
      // Sort by final ELO descending (handle potential nulls just in case)
      const sortedByElo = [...archiveInserts].sort(
        (a, b) => (b.final_elo ?? 0) - (a.final_elo ?? 0)
      );
      // Sort by season wins descending
      const sortedByWins = [...archiveInserts].sort(
        (a, b) => (b.season_wins ?? 0) - (a.season_wins ?? 0)
      );
      // Sort by longest win streak descending
      const sortedByStreak = [...archiveInserts].sort(
        (a, b) =>
          (b.season_longest_win_streak ?? 0) -
          (a.season_longest_win_streak ?? 0)
      );

      const distinctElos = [
        ...new Set(sortedByElo.map((p) => p.final_elo)),
      ].sort((a, b) => b - a); // Get unique ELOs sorted desc

      // Award Top 3 ELO (handle ties by awarding all tied)
      if (distinctElos.length > 0) {
        // 1st Place
        const firstPlaceElo = distinctElos[0];
        const firstPlaceWinners = sortedByElo.filter(
          (p) => p.final_elo === firstPlaceElo
        );
        firstPlaceWinners.forEach((p) =>
          awardsToInsert.push({
            pt_id: p.pt_id,
            player_id: p.player_id,
            team_id: teamId,
            season_id: activeSeason.id,
            award_type: "highest_elo_1st",
            award_value: firstPlaceElo,
          })
        );

        // 2nd Place (only if 1st place wasn't a tie involving 2+ people AND there's a second distinct ELO)
        if (firstPlaceWinners.length === 1 && distinctElos.length > 1) {
          const secondPlaceElo = distinctElos[1];
          const secondPlaceWinners = sortedByElo.filter(
            (p) => p.final_elo === secondPlaceElo
          );
          secondPlaceWinners.forEach((p) =>
            awardsToInsert.push({
              pt_id: p.pt_id,
              player_id: p.player_id,
              team_id: teamId,
              season_id: activeSeason.id,
              award_type: "highest_elo_2nd",
              award_value: secondPlaceElo,
            })
          );

          // 3rd Place (only if 1st was single, 2nd place exists, AND there's a third distinct ELO)
          if (distinctElos.length > 2) {
            const thirdPlaceElo = distinctElos[2];
            const thirdPlaceWinners = sortedByElo.filter(
              (p) => p.final_elo === thirdPlaceElo
            );
            thirdPlaceWinners.forEach((p) =>
              awardsToInsert.push({
                pt_id: p.pt_id,
                player_id: p.player_id,
                team_id: teamId,
                season_id: activeSeason.id,
                award_type: "highest_elo_3rd",
                award_value: thirdPlaceElo,
              })
            );
          }
        }
        // 3rd Place (if 1st place had a tie OR if 1st was single but 2nd had a tie, AND 3rd distinct ELO exists)
        else if (distinctElos.length > 1) {
          // Need at least two distinct ELOs to have a 3rd place in this scenario
          const thirdPlaceElo = distinctElos[1]; // The next distinct ELO becomes 3rd
          const thirdPlaceWinners = sortedByElo.filter(
            (p) => p.final_elo === thirdPlaceElo
          );
          // Check if these players didn't already get 1st (handles edge case of only 2 ELO values)
          thirdPlaceWinners
            .filter((p) => p.final_elo !== firstPlaceElo)
            .forEach((p) =>
              awardsToInsert.push({
                pt_id: p.pt_id,
                player_id: p.player_id,
                team_id: teamId,
                season_id: activeSeason.id,
                award_type: "highest_elo_3rd",
                award_value: thirdPlaceElo,
              })
            );
        }
      }

      // Award Most Wins (handle ties)
      const maxWins = sortedByWins[0]?.season_wins ?? 0;
      if (maxWins > 0) {
        sortedByWins
          .filter((p) => p.season_wins === maxWins)
          .forEach((playerStat) => {
            // Check if this player already has this award type for this season to prevent duplicates from logic errors
            if (
              !awardsToInsert.some(
                (a) =>
                  a.pt_id === playerStat.pt_id && a.award_type === "most_wins"
              )
            ) {
              awardsToInsert.push({
                pt_id: playerStat.pt_id,
                player_id: playerStat.player_id,
                team_id: teamId,
                season_id: activeSeason.id,
                award_type: "most_wins",
                award_value: maxWins,
              });
            }
          });
      }

      // Award Longest Win Streak (handle ties)
      const maxStreak = sortedByStreak[0]?.season_longest_win_streak ?? 0;
      if (maxStreak > 0) {
        sortedByStreak
          .filter((p) => p.season_longest_win_streak === maxStreak)
          .forEach((playerStat) => {
            if (
              !awardsToInsert.some(
                (a) =>
                  a.pt_id === playerStat.pt_id &&
                  a.award_type === "longest_win_streak"
              )
            ) {
              awardsToInsert.push({
                pt_id: playerStat.pt_id,
                player_id: playerStat.player_id,
                team_id: teamId,
                season_id: activeSeason.id,
                award_type: "longest_win_streak",
                award_value: maxStreak,
              });
            }
          });
      }

      // Insert Awards
      if (awardsToInsert.length > 0) {
        const { error: awardError } = await supabase
          .from("player_awards")
          .insert(awardsToInsert);
        if (awardError) {
          // Log warning but don't fail the whole process
          console.warn(`Failed to insert season awards: ${awardError.message}`);
          // Optionally, store this warning to return to the UI
        }
      }
    }

    // === Step 4: Update the Ending Season Record ===
    const { data: updatedSeasonData, error: updateError } = await supabase
      .from("seasons")
      .update({ end_date: new Date().toISOString(), active: false }) // Set active to false
      .eq("id", activeSeason.id)
      .select()
      .single();
    if (updateError)
      throw new Error(`Failed to update season status: ${updateError.message}`);
    endedSeasonDataForReturn = updatedSeasonData as SeasonType; // Store for return

    // === Step 5: Reset Player Stats ===
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
        highest_elo: 1500, // Reset highest ELO for the new season
        last_updated: new Date().toISOString(),
      })
      .eq("team_id", teamId);
    // If reset fails, the transaction is inconsistent. Ideally, use DB transactions.
    if (resetError)
      throw new Error(
        `CRITICAL: Failed to reset player stats: ${resetError.message}. Season end partially completed.`
      );

    // === Step 6: Create the New Active Season ===
    const { data: newSeasonData, error: createError } = await supabase
      .from("seasons")
      .insert({
        team_id: teamId,
        season_no: nextSeasonNumber!, // Use calculated number
        start_date: new Date().toISOString(),
        end_date: null,
        active: true, // Set new season as active
      })
      .select()
      .single();
    if (createError)
      throw new Error(
        `Failed to create new season after ending previous: ${createError.message}`
      );
    const newSeason = newSeasonData as SeasonType;
    return { endedSeason: endedSeasonDataForReturn, newSeason, error: null };
  } catch (error) {
    console.error("Error ending/starting season:", error);
    // Consider more sophisticated rollback if possible/needed
    return {
      endedSeason: null,
      newSeason: null,
      error: "An unexpected error occurred.",
    };
  }
};

// Other utilities (getActiveSeasonInfo, getSessions, getPlayerSeasonHistory) remain largely the same,
// just ensure they select/use 'season_no' instead of 'name' where appropriate.
// getPlayerSeasonHistory should join season:seasons(season_no) and select new award fields if needed.
