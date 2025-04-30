import GameHistory from "@/components/GameHistory/GameHistory";
import GameScheduleManager from "@/components/TeamHomePage/SessionsTab/Sessions/SessionUI/GameScheduleManager";
import SessionAttendeesList from "@/components/TeamHomePage/SessionsTab/Sessions/SessionUI/SessionAttendeesList";
import SessionDetailsDisplay from "@/components/TeamHomePage/SessionsTab/Sessions/SessionUI/SessionDetailsDisplay";
import SessionSquadsDisplay from "@/components/TeamHomePage/SessionsTab/Sessions/SessionUI/SessionSquadsDisplay";
import SessionStats from "@/components/TeamHomePage/SessionsTab/Sessions/SessionUI/SessionStats";
import { useAuth } from "@/contexts/AuthContext";
import { getGameHistory } from "@/lib/getGameHistory";
import { supabase } from "@/lib/supabase";
import {
  GameHistoryType,
  GameScheduleWithPlayerDetails,
  SessionAttendeeWithStats,
  SessionType,
  SquadWithPlayerDetails,
} from "@/lib/types";
import { Alert, Box, CircularProgress, Tab, Tabs } from "@mui/material";
import { useRouter } from "next/router"; // Use next/router for Pages Router
import React, { useCallback, useEffect, useMemo, useState } from "react";

// --- Main Page Component ---
const SessionPage = () => {
  const router = useRouter();
  const sessionId = router.query.sessionId as string;
  const teamId = router.query.teamId as string;
  const { user, userRoles } = useAuth();

  // --- State Definitions ---
  // Use detailed types where the component needs nested data
  const [sessionMeta, setSessionMeta] = useState<SessionType | null>(null);
  const [attendees, setAttendees] = useState<SessionAttendeeWithStats[]>([]); // Use base type, mapping needed
  const [squads, setSquads] = useState<SquadWithPlayerDetails[]>([]); // Detailed type
  const [schedule, setSchedule] = useState<GameScheduleWithPlayerDetails[]>([]); // Detailed type
  const [completedGames, setCompletedGames] = useState<GameHistoryType[]>([]); // Detailed type

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const isActive = useMemo(() => sessionMeta?.active ?? true, [sessionMeta]);

  const isAdmin = useMemo(() => {
    if (!user || !teamId) return false;
    return userRoles.some((role) => role.team_id === teamId);
  }, [userRoles, user, teamId]);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    if (!sessionId || !teamId) {
      setError("Session or Team ID not available.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Define all potential fetch promises
      const sessionPromise = supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      const attendeesPromise = supabase
        .from("session_attendees")
        .select("*, player_teams(*, player:players(name))")
        .eq("session_id", sessionId);
      const squadsPromise = supabase
        .from("squads")
        .select("*, squad_players(*, player_teams(*, player:players(name)))")
        .eq("session_id", sessionId);
      const schedulePromise = supabase
        .from("game_schedule")
        .select(
          "*, squad_a: squads!game_schedule_squad_a_id_fkey(*, squad_players(*, player_teams(*, player:players(name)))), squad_b: squads!game_schedule_squad_b_id_fkey(*, squad_players(*, player_teams(*, player:players(name))))"
        )
        .eq("session_id", sessionId)
        .eq("status", "pending")
        .order("round_no", { ascending: true })
        .order("game_number", { ascending: true });
      const gamesPromise = getGameHistory({ sessionId: sessionId, limit: 100 });
      const [
        sessionResult,
        attendeesResult,
        squadsResult,
        scheduleResult,
        gamesResult,
      ] = await Promise.all([
        sessionPromise,
        attendeesPromise,
        squadsPromise,
        schedulePromise,
        gamesPromise,
      ]);

      // --- Process Results ---

      // Session (Critical)
      if (sessionResult.error)
        throw new Error(
          `Failed to load session: ${sessionResult.error.message}`
        );
      if (!sessionResult.data) throw new Error("Session not found.");
      setSessionMeta(sessionResult.data);

      // Attendees
      if (attendeesResult.error)
        console.error(
          "Error fetching attendees:",
          attendeesResult.error.message
        );
      // Map Supabase result to PlayerTeamType[] expected by state/components
      const mappedAttendees =
        (attendeesResult.data as SessionAttendeeWithStats[]) ?? [];
      setAttendees(mappedAttendees);

      // Squads
      if (squadsResult.error)
        console.error("Error fetching squads:", squadsResult.error.message);
      // Directly set if the fetched structure matches SquadWithPlayerDetails
      setSquads((squadsResult.data as SquadWithPlayerDetails[]) ?? []);

      // Schedule
      if (scheduleResult.error)
        console.error("Error fetching schedule:", scheduleResult.error.message);
      // Directly set if the fetched structure matches GameScheduleWithSquadDetails
      setSchedule(
        (scheduleResult.data as GameScheduleWithPlayerDetails[]) ?? []
      );

      // Completed Games
      if (gamesResult.error)
        console.error(
          "Error fetching completed games:",
          gamesResult.error.message
        );
      // Directly set if the fetched structure matches GameWithSquadDetails
      setCompletedGames((gamesResult.history as GameHistoryType[]) ?? []);
    } catch (err) {
      console.error("Error fetching session data:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId, teamId]); // Dependencies for the fetch function

  // --- Initial Fetch Effect ---
  useEffect(() => {
    // Only fetch if IDs are available
    if (sessionId && teamId) {
      fetchData();
    }
  }, [sessionId, teamId, fetchData]);

  const refreshAllData = useCallback(() => {
    if (sessionId && teamId) {
      fetchData(); // Trigger a full refresh
    }
  }, [sessionId, teamId, fetchData]);

  const refreshScheduleAndGames = useCallback(async () => {
    if (!sessionId || !teamId) return;
    try {
      const [scheduleResult, gamesResult] = await Promise.all([
        supabase
          .from("game_schedule")
          .select(
            "*, squad_a:squads!game_schedule_squad_a_id_fkey(*, squad_players(*, player_teams(*, player: players(name)))), squad_b:squads!game_schedule_squad_b_id_fkey(*, squad_players(*, player_teams(*, player:players(name))))"
          )
          .eq("session_id", sessionId)
          .eq("status", "pending")
          .order("round_no", { ascending: true })
          .order("game_number", { ascending: true }),
        getGameHistory({ sessionId: sessionId, limit: 100 }),
      ]);
      if (scheduleResult.error)
        console.error(
          "Error refreshing schedule:",
          scheduleResult.error.message
        );
      else
        setSchedule(
          (scheduleResult.data as GameScheduleWithPlayerDetails[]) ?? []
        );

      if (gamesResult.error)
        console.error(
          "Error refreshing completed games:",
          gamesResult.error.message
        );
      else setCompletedGames((gamesResult.history as GameHistoryType[]) ?? []);
    } catch (err) {
      console.error("Error during partial refresh:", err);
      setError("Failed to refresh game data."); // Show temporary error
    }
  }, [sessionId, teamId]);

  const refreshAttendeesAndSquads = useCallback(async () => {
    if (!sessionId || !teamId) return;
    try {
      const [attendeesResult, squadsResult] = await Promise.all([
        supabase
          .from("session_attendees")
          .select("*, player_teams(*, player:players(name))")
          .eq("session_id", sessionId),
        supabase
          .from("squads")
          .select("*, squad_players(*, player_teams(*, player:players(name)))")
          .eq("session_id", sessionId),
      ]);

      if (attendeesResult.error)
        console.error(
          "Error refreshing attendees:",
          attendeesResult.error.message
        );
      else {
        // Re-apply the mapping used in fetchData
        const mappedAttendees =
          (attendeesResult.data as SessionAttendeeWithStats[]) ?? [];
        setAttendees(mappedAttendees);
      }

      if (squadsResult.error)
        console.error("Error refreshing squads:", squadsResult.error.message);
      else setSquads((squadsResult.data as SquadWithPlayerDetails[]) ?? []);
    } catch (err) {
      console.error("Error refreshing attendees/squads:", err);
      setError("Failed to refresh attendee/squad data."); // Show temporary error
    }
  }, [sessionId, teamId]);

  // --- UI Logic ---
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const navigateToFirstTab = () => {
    setActiveTab(0);
  };

  const activeSessionTabs = [
    "Game Schedule",
    "Live Stats",
    "Squads",
    "Attendees",
  ];
  const completedSessionTabs = ["Player Stats", "Games", "Squads"];

  const currentTabs = !isActive ? completedSessionTabs : activeSessionTabs;

  // --- Render Logic ---
  if (loading && !sessionMeta) {
    // Show loader only on initial load
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !sessionMeta) {
    // Show fatal error if session meta failed
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!sessionMeta) {
    // Handle case where IDs aren't ready or fetch failed silently
    return (
      <Alert severity="warning" sx={{ m: 3 }}>
        Session data unavailable. Check URL or try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Render DetailsDisplay only if sessionMeta exists */}
      <SessionDetailsDisplay
        session={sessionMeta}
        isAdmin={isAdmin}
        onSessionUpdated={refreshAllData}
        navigateToFirstTab={navigateToFirstTab}
      />

      {/* Non-fatal error display */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Warning: {error}
        </Alert>
      )}

      <Box>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="session tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          {currentTabs.map((label, index) => (
            <Tab
              key={label}
              label={label}
              id={`session-tab-${index}`}
              aria-controls={`session-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Box>

      {/* --- Tab Panels --- */}
      {/* Pass appropriate state and refresh functions to children */}
      {isActive && (
        <>
          {activeTab === 0 && ( // Game Schedule
            <GameScheduleManager
              pendingSchedule={schedule}
              setPendingSchedule={setSchedule}
              completedGameHistory={completedGames}
              sessionId={sessionId}
              teamId={teamId}
              squads={squads}
              onScheduleUpdate={refreshScheduleAndGames}
              isAdmin={isAdmin}
              isActive={isActive}
            />
          )}
          {activeTab === 2 && ( // Squads
            <SessionSquadsDisplay
              squads={squads}
              sessionId={sessionId}
              teamId={teamId}
              attendees={attendees.map((a) => a.player_teams)}
              onSquadsUpdated={refreshAllData}
              isAdmin={isAdmin}
              isActive={isActive}
            />
          )}
          {activeTab === 3 && ( // Attendees
            <SessionAttendeesList
              attendees={attendees.map((a) => a.player_teams)}
              squads={squads}
              sessionId={sessionId}
              teamId={teamId}
              onAttendeesUpdated={refreshAttendeesAndSquads}
              isAdmin={isAdmin}
              isActive={isActive}
            />
          )}
          {activeTab === 1 && ( // Stats (Live)
            <SessionStats
              attendeesWithStats={attendees}
              teamId={teamId}
              isActive={isActive}
              sessionId={sessionId}
            />
          )}
        </>
      )}

      {/* Completed Session Content */}
      {!isActive && (
        <>
          {activeTab === 0 && ( // Stats (Final)
            <SessionStats
              attendeesWithStats={attendees}
              teamId={teamId}
              isActive={isActive}
              sessionId={sessionId}
            />
          )}
          {activeTab === 1 && ( // Games
            <GameHistory sessionId={sessionId} />
          )}
          {activeTab === 2 && ( // Squads (Read-Only)
            <SessionSquadsDisplay
              squads={squads}
              sessionId={sessionId}
              teamId={teamId}
              attendees={attendees.map((a) => a.player_teams)}
              onSquadsUpdated={refreshAllData}
              isAdmin={isAdmin}
              isActive={isActive} // isCompleted will disable edits
            />
          )}
        </>
      )}
    </Box>
  );
};

export default SessionPage;
