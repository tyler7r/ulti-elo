import { supabase } from "@/lib/supabase"; // Adjust path
import {
  PlayerTeamSeasonStats,
  PlayerTeamsType,
  PlayerTeamType,
  PlayerType,
  TeamType,
} from "@/lib/types"; // Adjust path
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import {
  Alert,
  Box,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
// Import child components
import GameHistory from "@/components/GameHistory/GameHistory"; // Adjust path
import PlayerTeamStats from "@/components/PlayerHomePage/PlayerTeamStats"; // Adjust path
import WhatshotIcon from "@mui/icons-material/Whatshot"; // Import a hot icon

// Define type for Awards (can be moved to types file)
// type PlayerAward = {
//   id: string;
//   pt_id: string; // Awards might be linked to player_teams (pt_id) instead of player_id directly
//   player_id: string; // Or directly to player_id
//   season_id: string;
//   award_type: "highest_elo" | "most_wins" | "longest_streak"; // Add more types later
//   award_value?: string | number;
//   awarded_at: string;
//   season?: { season_no: number }; // Optional joined data
// };

function a11yProps(index: number) {
  return {
    id: `player-tab-${index}`,
    "aria-controls": `player-tabpanel-${index}`,
  };
}

const PlayerHomePage = () => {
  const router = useRouter();
  const playerId = router.query.playerId as string;

  const [activeTab, setActiveTab] = useState(0);
  const [playerData, setPlayerData] = useState<PlayerType | null>(null);
  const [currentTeamsData, setCurrentTeamsData] = useState<PlayerTeamsType[]>(
    []
  );
  const [seasonHistoryData, setSeasonHistoryData] = useState<
    PlayerTeamSeasonStats[]
  >([]);
  // const [awards, setAwards] = useState<PlayerAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<string | null>(null);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // --- Data Fetching (Awaiting individually) ---
  const fetchPlayerData = useCallback(async (id: string) => {
    setLoading(true);
    setAlert(null);
    try {
      // Fetch player details first (required for name)
      const playerRes = await supabase
        .from("players")
        .select("*")
        .eq("id", id)
        .single();
      if (playerRes.error) throw playerRes.error;
      if (!playerRes.data) throw new Error("Player not found");
      const fetchedPlayerData = playerRes.data;
      setPlayerData(fetchedPlayerData); // Set player data early

      // Fetch current team associations
      const currentTeamsRes = await supabase
        .from("player_teams")
        .select("*, teams!inner(*)")
        .eq("player_id", id)
        .order("last_updated", { ascending: false });
      if (currentTeamsRes.error) throw currentTeamsRes.error;
      const formattedCurrentTeams = (currentTeamsRes.data ?? []).map((pt) => ({
        player: {
          ...pt,
          player: { name: fetchedPlayerData.name }, // Use fetched name
        } as PlayerTeamType,
        team: { ...pt.teams } as TeamType,
      }));
      setCurrentTeamsData(formattedCurrentTeams);

      // Fetch season history
      const seasonHistoryRes = await supabase
        .from("player_team_season_stats")
        .select("*, season:seasons(season_no)")
        .eq("player_id", id);
      if (seasonHistoryRes.error) throw seasonHistoryRes.error;
      setSeasonHistoryData(
        (seasonHistoryRes.data as PlayerTeamSeasonStats[]) ?? []
      );
    } catch (err) {
      console.error("Error fetching player page data:", err);
      setAlert("Failed to load player data.");
      setPlayerData(null); // Clear data on error
      setCurrentTeamsData([]);
      setSeasonHistoryData([]);
      // setAwards([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed if only run once based on playerId

  useEffect(() => {
    if (playerId) {
      fetchPlayerData(playerId);
    } else {
      setLoading(false);
    }
  }, [playerId, fetchPlayerData]);

  useEffect(() => {
    if (currentTeamsData.length > 0) {
      setOpenTeamId(currentTeamsData[0].player.pt_id);
    } else {
      setOpenTeamId(null); // Reset if no teams
    }
  }, [currentTeamsData]);

  // --- Calculate Overall Stats ---
  const overallStats = useMemo(() => {
    // ... (calculation logic remains the same) ...
    let totalWins = 0;
    let totalLosses = 0;
    let peakElo = 0;
    let longestStreak = 0;
    seasonHistoryData.forEach((seasonStat) => {
      totalWins += seasonStat.season_wins ?? 0;
      totalLosses += seasonStat.season_losses ?? 0;
      peakElo = Math.max(peakElo, seasonStat.season_highest_elo ?? 0);
      longestStreak = Math.max(
        longestStreak,
        seasonStat.season_longest_win_streak ?? 0
      );
    });
    currentTeamsData.forEach((teamData) => {
      totalWins += teamData.player.wins ?? 0;
      totalLosses += teamData.player.losses ?? 0;
      peakElo = Math.max(peakElo, teamData.player.highest_elo ?? 0);
      longestStreak = Math.max(
        longestStreak,
        teamData.player.longest_win_streak ?? 0
      );
    });
    const winPercentage =
      totalWins + totalLosses > 0
        ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(1)
        : "0.0";
    return { totalWins, totalLosses, winPercentage, peakElo, longestStreak };
  }, [currentTeamsData, seasonHistoryData]);

  // // --- Award Calculation ---
  // const awardCounts = useMemo(() => {
  //   // ... (calculation logic remains the same) ...
  //   const counts: { [key in PlayerAward["award_type"]]?: number } = {};
  //   awards.forEach((award) => {
  //     counts[award.award_type] = (counts[award.award_type] ?? 0) + 1;
  //   });
  //   return counts;
  // }, [awards]);

  // --- Handlers ---
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTeamOpen = (teamId: string | null) => {
    setOpenTeamId(teamId);
  };

  if (loading) {
    return <div className="p-4 text-lg font-bold">Loading player data...</div>;
  }

  if (alert) {
    return (
      <Alert severity={"error"} sx={{ padding: 4, width: "100%" }}>
        {alert}
      </Alert>
    );
  }

  if (!playerData) {
    return <div className="p-4 font-bold">Player not found.</div>;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        display={"flex"}
        flexDirection={"column"}
        p={1}
        px={2}
        pt={2}
        justifyContent={"center"}
        gap={1}
      >
        <Typography variant={isSmallScreen ? "h4" : "h3"} fontWeight={"bold"}>
          {playerData.name}
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="player tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Stats & Teams" {...a11yProps(0)} />
        <Tab label="Game History" {...a11yProps(1)} />
      </Tabs>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && (
          <Box display="flex" flexDirection="column" gap={1} p={2}>
            {/* Overall Stats Card */}
            <Paper
              sx={{
                borderColor: theme.palette.divider,
                borderRadius: "4px",
                marginBottom: 2,
                width: { xs: "100%", sm: "75%", md: "50%" },
                // alignSelf: "center",
              }}
              elevation={4}
            >
              <Box
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: "white",
                  padding: theme.spacing(0.5),
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  width: "100%",

                  textAlign: "center", // To only take up necessary width
                }}
              >
                <Typography
                  variant="button"
                  fontSize={"20px"}
                  fontWeight="bold"
                >
                  Career Stats
                </Typography>
              </Box>
              <Box
                display="flex"
                gap={4}
                alignItems="center"
                padding={1}
                sx={{ justifyContent: "space-around" }}
                width={"100%"}
              >
                <Box
                  sx={{
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography color="textSecondary" variant="subtitle2">
                    Peak Elo
                  </Typography>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {overallStats.peakElo}
                    </Typography>
                    <EmojiEventsIcon color="warning" />
                  </Box>
                </Box>
                <Box
                  sx={{
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography color="textSecondary" variant="subtitle2">
                    Total Win/Loss
                  </Typography>
                  <Typography variant={"h4"} fontWeight="bold">
                    {overallStats.totalWins} - {overallStats.totalLosses}
                  </Typography>
                  <Typography
                    color="textSecondary"
                    variant="body2"
                    fontWeight={"bold"}
                    fontStyle={"italic"}
                  >
                    {overallStats.winPercentage}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography color="textSecondary" variant="subtitle2">
                    Best Streak
                  </Typography>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {overallStats.longestStreak}
                    </Typography>
                    <WhatshotIcon color="warning" />
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Team Specific Stats */}
            <Typography variant="h6" fontWeight={"bold"}>
              Team Stats
            </Typography>
            {currentTeamsData.length === 0 ? (
              <Typography sx={{ fontStyle: "italic", textAlign: "center" }}>
                This player is not currently on any team.
              </Typography>
            ) : (
              currentTeamsData.map((teamData) => (
                <PlayerTeamStats
                  key={teamData.player.pt_id}
                  currentTeamData={teamData}
                  ptId={teamData.player.pt_id}
                  teamId={teamData.team.id}
                  openTeamId={openTeamId}
                  onTeamOpen={handleTeamOpen}
                />
              ))
            )}
          </Box>
        )}

        {/* Game History Tab */}
        {activeTab === 1 && (
          <GameHistory
            playerTeamIds={currentTeamsData.map((pt) => pt.player.pt_id)}
            playerId={playerId}
          />
        )}
      </Box>
    </Box>
  );
};

export default PlayerHomePage;
