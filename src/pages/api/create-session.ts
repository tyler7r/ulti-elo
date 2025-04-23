// lib/supabase/sessions.ts
import {
  SessionSquad,
  SquadState,
} from "@/components/TeamHomePage/SessionsTab/Sessions/CreateSession/CreateSquads";
import generateRoundRobinPairs from "@/lib/generateRoundRobinPairs";
import { supabase } from "@/lib/supabase";
import {
  GameScheduleInsertType,
  PlayerTeamType,
  SquadTypeWithSession,
} from "@/lib/types"; // Import SquadState type

interface SquadPlayerInsert {
  pt_id: string;
  squad_id: string;
  // active: boolean; // Default to true or handle as needed
}

type AttendeeStatsSnapshot = {
  pt_id: string;
  rank: number;
};

// Function to save the entire session
export const saveNewSession = async (
  teamId: string,
  sessionTitle: string,
  attendees: PlayerTeamType[],
  rounds: SquadState[] // Use SquadState[] which is (SessionSquad[] | null)[]
): Promise<{ sessionId: string | null; error: Error | string | null }> => {
  if (attendees.length === 0)
    return {
      sessionId: null,
      error: new Error("Cannot create a session with no attendees."),
    };
  try {
    const { data: activeSession, error: activeCheckError } = await supabase
      .from("sessions")
      .select("id", { count: "exact" }) // Check if any exist
      .eq("team_id", teamId)
      .eq("active", true)
      .limit(1);

    if (activeCheckError)
      return {
        sessionId: null,
        error: activeCheckError,
      };
    // Check count explicitly
    if (activeSession && activeSession.length > 0) {
      return {
        sessionId: null,
        error:
          "An active session already exists for this team. Please complete it before starting a new one.",
      };
    }

    // === 1. Create the Session ===
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        title: sessionTitle,
        team_id: teamId,
        session_date: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (sessionError || !sessionData) {
      console.error("Error creating session:", sessionError);
      return {
        sessionId: null,
        error: `Failed to create session. ${sessionError.message}`,
      };
    }
    const sessionId = sessionData.id;

    const attendeePtIds = attendees.map((a) => a.pt_id);

    const { data: attendeeStatsData, error: statsError } = await supabase
      .from("player_teams")
      .select("pt_id, elo, mu, sigma, wins, losses")
      .in("pt_id", attendeePtIds);

    if (statsError)
      return {
        sessionId: sessionId,
        error: statsError,
      };
    if (!attendeeStatsData || attendeeStatsData.length !== attendees.length) {
      return {
        sessionId: sessionId,
        error: "Could not fetch stats for all selected attendees.",
      };
    }

    const { data: allTeamPlayersData, error: rankError } = await supabase
      .from("player_teams")
      .select("pt_id, elo")
      .eq("team_id", teamId)
      .or("wins.gt.0, losses.gt.0")
      .order("elo", { ascending: false });

    if (rankError)
      return {
        sessionId: sessionId,
        error: `Failed to fetch team players for ranking: ${rankError.message}`,
      };

    const rankMap = new Map<string, number>();
    allTeamPlayersData?.forEach((p, index) => {
      rankMap.set(p.pt_id, index + 1);
    });

    const attendeeStatsSnapshots: AttendeeStatsSnapshot[] =
      attendeeStatsData.map((stats) => ({
        pt_id: stats.pt_id,
        rank: rankMap.get(stats.pt_id) ?? 1,
      }));

    // === 2. Add Session Attendees ===
    const attendeeInserts = attendeeStatsSnapshots.map((attendee) => ({
      session_id: sessionId!,
      pt_id: attendee.pt_id,
      rank_before: attendee.rank,
    }));
    const { error: attendeeError } = await supabase
      .from("session_attendees")
      .insert(attendeeInserts);

    if (attendeeError) {
      console.error("Error inserting session attendees:", attendeeError);
      await supabase.from("sessions").delete().match({ id: sessionId }); // Cleanup
      return {
        sessionId: sessionId,
        error: `Error inserting session attendees: ${attendeeError.message}`,
      };
    }

    // === 3. Create Squads and Squad Players (using pre-generated IDs) ===
    const allSquadInserts: SquadTypeWithSession[] = []; // Type based on 'squads' table columns
    const allSquadPlayerInserts: SquadPlayerInsert[] = [];

    const validRounds = rounds
      .map((round, index) => ({ round, roundIndex: index }))
      .filter(
        (item): item is { round: SessionSquad[]; roundIndex: number } =>
          item.round !== null
      );

    validRounds.forEach(({ round, roundIndex }) => {
      round.forEach((squad) => {
        allSquadInserts.push({
          id: squad.id,
          name: squad.name,
          team_id: teamId,
          session_id: sessionId!, // Use non-null assertion or check
          session_round: roundIndex + 1, // <-- ADDED ROUND NUMBER (1-based)
        });
        squad.players.forEach((player) => {
          allSquadPlayerInserts.push({
            pt_id: player.pt_id,
            squad_id: squad.id,
          });
        });
      });
    });

    if (allSquadInserts.length > 0) {
      // Insert Squads first
      const { error: squadError } = await supabase
        .from("squads")
        .insert(allSquadInserts);

      if (squadError) {
        console.error("Error inserting squads:", squadError);
        // Full Cleanup
        await supabase
          .from("session_attendees")
          .delete()
          .match({ session_id: sessionId });
        await supabase.from("sessions").delete().match({ id: sessionId });
        return {
          sessionId: sessionId,
          error: `Failed to insert squads: ${squadError?.message}`,
        };
      }

      // Then insert Squad Players
      if (allSquadPlayerInserts.length > 0) {
        const { error: squadPlayerError } = await supabase
          .from("squad_players")
          .insert(allSquadPlayerInserts);

        if (squadPlayerError) {
          console.error("Error inserting squad players:", squadPlayerError);
          // Full cleanup
          await supabase
            .from("squads")
            .delete()
            .match({ session_id: sessionId }); // Delete squads just inserted
          await supabase
            .from("session_attendees")
            .delete()
            .match({ session_id: sessionId });
          await supabase.from("sessions").delete().match({ id: sessionId });
          return {
            sessionId: sessionId,
            error: `Failed to insert squad players: ${squadPlayerError.message}`,
          };
        }
      }
    }

    // === 4. Generate Initial Game Schedule (using known squad IDs) ===
    const { error: scheduleError } = await generateAndSaveGameSchedule(
      sessionId,
      validRounds
    ); // Pass valid rounds directly
    if (scheduleError) {
      console.warn("Failed to generate initial game schedule:", scheduleError);
      // Decide if this is critical - maybe just log warning?
    }

    // If all steps succeeded
    return { sessionId, error: null };
  } catch (error) {
    console.error("Full session save error:", error);
    return { sessionId: null, error: `Full session save error: ${error}` };
  }
};

// Updated schedule generation using pre-existing squad IDs from input
export const generateAndSaveGameSchedule = async (
  sessionId: string,
  // Takes rounds where each round is SessionSquad[] with its original index
  validRoundsData: { round: SessionSquad[]; roundIndex: number }[],
  startingGameNumber: number = 1
) => {
  try {
    const scheduleInserts: GameScheduleInsertType[] = []; // Use type from lib/types
    let currentGameNumber = startingGameNumber; // Session-wide game number

    for (const { round, roundIndex } of validRoundsData) {
      const roundNo = roundIndex + 1; // 1-based round number
      const squadIdsInRound = round.map((s) => s.id);

      if (squadIdsInRound.length < 2) continue; // Need at least 2 squads

      // Generate game pairings for this round
      // Using simple unique pairs generation for now
      const roundPairings = generateRoundRobinPairs(squadIdsInRound);

      // Flatten the pairings and assign game numbers and round_no
      roundPairings.forEach((matchSet) => {
        // Usually only one 'matchSet' with current simple generation
        matchSet.forEach((pair) => {
          scheduleInserts.push({
            squad_a_id: pair.squad_a_id,
            squad_b_id: pair.squad_b_id,
            status: "pending",
            session_id: sessionId,
            game_number: currentGameNumber++,
            round_no: roundNo,
            squad_a_score: 0,
            squad_b_score: 0,
          });
        });
      });
    }

    if (scheduleInserts.length > 0) {
      // Sort inserts by game_number just in case generation order wasn't perfect
      scheduleInserts.sort((a, b) => a.game_number - b.game_number);

      const { error: insertError } = await supabase
        .from("game_schedule")
        .insert(scheduleInserts);

      if (insertError) {
        console.error("Error inserting game schedule:", insertError);
        return { error: insertError };
      }
    }
    return { error: null };
  } catch (error) {
    console.error("Error in schedule generation/saving:", error);
    return { error };
  }
};
