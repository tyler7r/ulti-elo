import GameHistory from "@/components/GameHistory/GameHistory";
import PlayerTeamStats from "@/components/PlayerHomePage/PlayerTeamStats"; // Import the new component
import { supabase } from "@/lib/supabase";
import { AlertType, PlayerTeamsType, PlayerType } from "@/lib/types";
// import WhatshotIcon from "@mui/icons-material/Whatshot"; // Import a hot icon
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WhatshotIcon from "@mui/icons-material/Whatshot";
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
import { useCallback, useEffect, useState } from "react"; // Assuming you have your Supabase client set up her

function a11yProps(index: number) {
  return {
    id: `player-tab-${index}`,
    "aria-controls": `player-tabpanel-${index}`,
  };
}

const PlayerHomePage = () => {
  const router = useRouter();
  const playerId = router.query.playerId as string;
  const [activeTab, setActiveTab] = useState(0); // Default to Stats & Teams
  const [playerData, setPlayerData] = useState<PlayerType | null>(null);
  const [playerTeamsData, setPlayerTeamsData] = useState<PlayerTeamsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Calculate headline stats
  const totalWins = playerTeamsData.reduce(
    (sum, teamData) => sum + teamData.player.wins,
    0
  );
  const totalLosses = playerTeamsData.reduce(
    (sum, teamData) => sum + teamData.player.losses,
    0
  );
  const winPercentage =
    totalWins + totalLosses > 0
      ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(2)
      : "N/A";
  // const currentElos = playerTeamsData.map((teamData) => teamData.player.elo);
  const highestElo = playerTeamsData.reduce(
    (max, teamData) => Math.max(max, teamData.player.highest_elo),
    0
  );
  const longestWinStreak = playerTeamsData.reduce(
    (max, teamData) => Math.max(max, teamData.player.longest_win_streak),
    0
  );

  const fetchPlayerData = useCallback(async (id: string) => {
    setLoading(true);
    setAlert({ message: null, severity: "error" });

    try {
      // Fetch player details (including potential avatar URL)
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("id", id)
        .single();

      if (playerError) {
        throw playerError;
      }

      // Fetch player_team IDs and associated team data
      const { data: playerTeams, error: playerTeamsError } = await supabase
        .from("player_teams")
        .select("*, teams!inner(*)")
        .eq("player_id", id)
        .order("last_updated", { ascending: false });

      if (playerTeamsError) {
        throw playerTeamsError;
      }

      const formattedPlayerTeams = playerTeams.map((pt) => ({
        player: {
          elo: pt.elo,
          elo_change: pt.elo_change,
          highest_elo: pt.highest_elo,
          pt_id: pt.pt_id,
          team_id: pt.team_id,
          wins: pt.wins,
          losses: pt.losses,
          win_streak: pt.win_streak,
          loss_streak: pt.loss_streak,
          longest_win_streak: pt.longest_win_streak,
          win_percent: pt.win_percent,
          player_id: pt.player_id,
          mu: pt.mu,
          last_updated: pt.last_updated,
          player: { name: player.name },
          sigma: pt.sigma,
        },
        team: { ...pt.teams },
      }));

      setPlayerData(player);
      setPlayerTeamsData(formattedPlayerTeams);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (playerId) {
      fetchPlayerData(playerId);
    }
  }, [fetchPlayerData, playerId]);

  useEffect(() => {
    if (playerTeamsData.length > 0) {
      setOpenTeamId(playerTeamsData[0].player.pt_id);
    } else {
      setOpenTeamId(null); // Reset if no teams
    }
  }, [playerTeamsData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTeamOpen = (teamId: string | null) => {
    setOpenTeamId(teamId);
  };

  if (loading) {
    return <div className="p-4 text-lg font-bold">Loading player data...</div>;
  }

  if (alert.message) {
    return (
      <Alert severity={alert.severity} sx={{ padding: 4, width: "100%" }}>
        {alert.message}
      </Alert>
    );
  }

  if (!playerData) {
    return <div className="p-4 font-bold">Player not found.</div>;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <div className="flex w-full items-center justify-center mt-4 gap-2 text-center">
        <Typography
          variant={isSmallScreen ? "h3" : "h2"}
          fontWeight={"bold"}
          sx={{ textAlign: "center" }}
        >
          {playerData.name}
        </Typography>
      </div>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="player tabs"
        variant="fullWidth"
        sx={{ mt: 2 }}
      >
        <Tab label="Stats & Teams" {...a11yProps(0)} />
        <Tab label="Game History" {...a11yProps(1)} />
      </Tabs>

      <Box>
        {activeTab === 0 && (
          <div className="rounded p-4 mt-4 flex flex-col">
            <Paper
              sx={{
                borderColor: theme.palette.divider,
                borderRadius: "4px",
                marginBottom: 2,
                width: { xs: "100%", sm: "75%", md: "50%" },
                alignSelf: "center",
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
                  Overall Stats
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
                      {highestElo}
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
                    {totalWins} - {totalLosses}
                  </Typography>
                  <Typography
                    color="textSecondary"
                    variant="body2"
                    fontWeight={"bold"}
                    fontStyle={"italic"}
                  >
                    {winPercentage}%
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
                      {longestWinStreak}
                    </Typography>
                    <WhatshotIcon color="warning" />
                  </Box>
                </Box>
              </Box>
            </Paper>

            <Typography variant="h6" gutterBottom fontWeight={"bold"}>
              Team Stats
            </Typography>
            {playerTeamsData.map((teamData) => (
              <PlayerTeamStats
                key={teamData.team.id}
                teamData={teamData}
                openTeamId={openTeamId}
                onTeamOpen={handleTeamOpen}
              />
            ))}
            {playerTeamsData.length === 0 && (
              <Typography>This player is not currently on any team.</Typography>
            )}
          </div>
        )}

        {activeTab === 1 && (
          <GameHistory
            playerTeamIds={playerTeamsData.map((pt) => pt.player.pt_id)}
            playerId={playerId}
          />
        )}
      </Box>
    </Box>
  );
};

export default PlayerHomePage;
