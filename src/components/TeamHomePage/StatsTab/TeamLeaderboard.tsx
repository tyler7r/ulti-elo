// /components/TeamHomePage/TeamLeaderboardTab.tsx (Adjust path as needed)

import { supabase } from "@/lib/supabase"; // Adjust path
import {
  PlayerAwardTypeWithJoin,
  PlayerTeamSeasonStats,
  SeasonType,
} from "@/lib/types"; // Adjust path
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
// Import the necessary display components
import Leaderboard from "@/components/Leaderboard"; // Adjust path
import { useRouter } from "next/router";
import PastSeasonLeaderboard from "./PastSeasonLeaderboard";
import SeasonAwardsDisplay from "./PlayerAwardsDisplay";

interface TeamLeaderboardTabProps {
  teamId: string;
}

const TeamLeaderboardTab = ({ teamId }: TeamLeaderboardTabProps) => {
  // State for season selection and data
  const [allSeasons, setAllSeasons] = useState<SeasonType[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("current"); // Default to current
  const [selectedSeasonInfo, setSelectedSeasonInfo] =
    useState<SeasonType | null>(null); // Store full object of selected past season

  const [pastLeaderboardData, setPastLeaderboardData] = useState<
    PlayerTeamSeasonStats[]
  >([]);
  const [selectedSeasonAwards, setSelectedSeasonAwards] = useState<
    PlayerAwardTypeWithJoin[]
  >([]);

  // Loading and error states
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingData, setLoadingData] = useState(false); // Loading for leaderboard/awards
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const tId = router.query.teamId;

  // --- Fetch All Seasons for the Dropdown ---
  const fetchSeasons = useCallback(async () => {
    if (!teamId) return;
    setLoadingSeasons(true);
    try {
      const { data, error: seasonError } = await supabase
        .from("seasons")
        .select("*")
        .eq("team_id", teamId)
        .order("season_no", { ascending: false }); // Newest first

      if (seasonError) throw seasonError;
      setAllSeasons((data as SeasonType[]) ?? []);
    } catch (err) {
      console.error("Error fetching seasons:", err);
      setError("Could not load season list.");
    } finally {
      setLoadingSeasons(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  useEffect(() => {
    setSelectedSeasonId("current");
  }, [tId]);

  // --- Fetch Leaderboard/Awards Data based on Selection ---
  const fetchDataForSelectedSeason = useCallback(async () => {
    if (!teamId) return;

    setLoadingData(true);
    setError(null);
    setPastLeaderboardData([]);
    setSelectedSeasonAwards([]);
    setSelectedSeasonInfo(null); // Clear selected past season inf

    try {
      if (selectedSeasonId !== "current") {
        // Fetch past season data (stats archive and awards)
        const selectedSeason = allSeasons.find(
          (s) => s.id === selectedSeasonId
        );
        setSelectedSeasonInfo(selectedSeason ?? null); // Store selected season details

        if (!selectedSeason) {
          throw new Error("Selected past season not found in list.");
        }

        const [pastStatsRes, awardsRes] = await Promise.all([
          supabase
            .from("player_team_season_stats")
            .select("*, player_teams(*, player:players!inner(name))") // Join player name
            .eq("season_id", selectedSeasonId)
            .eq("team_id", teamId)
            .order("final_elo", { ascending: false }),
          supabase
            .from("player_awards")
            .select(
              "*, season:seasons!inner(season_no), player:players!inner(name, id)"
            ) // Join player name
            .eq("season_id", selectedSeasonId)
            .eq("team_id", teamId)
            // Optionally order awards (e.g., by type)
            .order("award_type", { ascending: true }),
        ]);

        if (pastStatsRes.error) throw pastStatsRes.error;
        setPastLeaderboardData(
          (pastStatsRes.data as PlayerTeamSeasonStats[]) ?? []
        );

        if (awardsRes.error) throw awardsRes.error;
        setSelectedSeasonAwards(
          (awardsRes.data as PlayerAwardTypeWithJoin[]) ?? []
        );
      }
    } catch (err) {
      console.error(`Error fetching data for season ${selectedSeasonId}:`, err);
      setError(`Failed to load data for the selected season.`);
    } finally {
      setLoadingData(false);
    }
  }, [selectedSeasonId, teamId, allSeasons]); // Rerun when selection or season list changes

  useEffect(() => {
    // Fetch data only after seasons have been loaded
    if (!loadingSeasons) {
      fetchDataForSelectedSeason();
    }
  }, [selectedSeasonId, loadingSeasons, fetchDataForSelectedSeason]);

  // --- Handlers ---
  const handleSeasonSelectChange = (event: SelectChangeEvent<string>) => {
    setSelectedSeasonId(event.target.value);
  };

  // --- Render ---
  const activeSeason = useMemo(
    () => allSeasons.find((s) => s.active),
    [allSeasons]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        p: 2,
        mt: 1,
      }}
    >
      {/* Season Selector */}
      <Box sx={{ display: "flex", mb: 2 }}>
        <FormControl
          size="small"
          fullWidth
          disabled={loadingSeasons || loadingData}
          variant="outlined"
        >
          <InputLabel id="leaderboard-season-select-label" color="primary">
            Select Season
          </InputLabel>
          <Select
            labelId="leaderboard-season-select-label"
            value={selectedSeasonId}
            label="Select Season"
            onChange={handleSeasonSelectChange}
          >
            {/* Always include Current Season */}
            <MenuItem value="current">
              Current Season ({activeSeason?.season_no ?? "N/A"})
            </MenuItem>
            {/* List past seasons */}
            {loadingSeasons ? (
              <MenuItem value="" disabled>
                <em>Loading...</em>
              </MenuItem>
            ) : (
              allSeasons
                .filter((s) => !s.active)
                .map((season) => (
                  <MenuItem key={season.id} value={season.id}>
                    Season {season.season_no}
                  </MenuItem>
                ))
            )}
          </Select>
        </FormControl>
      </Box>

      {/* Loading / Error Display */}
      {loadingData && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {error && !loadingData && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Conditional Content */}
      {!loadingData && !error && (
        <>
          {selectedSeasonId === "current" ? (
            <Leaderboard
              teamId={teamId}
              key={`leaderboard-current`} // Add key to force re-render on change
            />
          ) : (
            <Box
              sx={{
                overflowX: "auto",
                px: 1,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {selectedSeasonInfo && (
                <SeasonAwardsDisplay
                  awards={selectedSeasonAwards}
                  seasonNumber={selectedSeasonInfo.season_no}
                />
              )}
              {selectedSeasonInfo && (
                <PastSeasonLeaderboard
                  seasonData={selectedSeasonInfo}
                  leaderboardData={pastLeaderboardData}
                  key={`leaderboard-past-${selectedSeasonId}`} // Add key
                />
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TeamLeaderboardTab;
