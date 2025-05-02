import { getActiveSeason } from "@/lib/getActiveSeason";
import { getRank } from "@/lib/getRank"; // Adjust path
import { supabase } from "@/lib/supabase"; // Adjust path
import {
  PlayerAwardType, // Ensure this type matches your DB/usage
  PlayerTeamsType,
  PlayerTeamType,
  SeasonType,
} from "@/lib/types"; // Adjust path
import { EmojiEventsSharp, WhatshotSharp } from "@mui/icons-material"; // Assuming these are still used for the stats table
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  alpha, // Import alpha for color manipulation
  Box,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
// Removed ListItemIcon import as it's replaced by the new awards style
import { format } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
// Assuming this path is correct and the function doesn't require theme
import { getAwardDetails } from "../TeamHomePage/StatsTab/PlayerAwardsDisplay"; // <--- Make sure path is correct
import NoLogoAvatar from "../Utils/NoLogoAvatar";
import EloHistoryChart from "./EloHistoryChart"; // Adjust path
import IndividualTeamStats from "./IndividualTeamStats"; // Adjust path (if still used)

interface PlayerTeamStatsProps {
  currentTeamData: PlayerTeamsType;
  ptId: string;
  teamId: string;
  openTeamId: string | null;
  onTeamOpen: (teamId: string | null) => void;
}

interface EloHistoryEntry {
  date: string;
  elo: number;
  timestamp: number;
}

const PlayerTeamStats = ({
  currentTeamData,
  ptId,
  teamId,
  openTeamId,
  onTeamOpen,
}: PlayerTeamStatsProps) => {
  const isOpen = openTeamId === currentTeamData.player.pt_id;
  const [seasons, setSeasons] = useState<SeasonType[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("current");
  const [displayStats, setDisplayStats] = useState<PlayerTeamType | null>(null);
  const [eloHistory, setEloHistory] = useState<EloHistoryEntry[]>([]);
  const [seasonAwards, setSeasonAwards] = useState<PlayerAwardType[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingEloHistory, setLoadingEloHistory] = useState(false);
  const [loadingAwards, setLoadingAwards] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSeasonIdCache, setActiveSeasonIdCache] = useState<string | null>(
    null
  );

  const currentPlayerData = currentTeamData.player;
  const router = useRouter();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Background colors defined earlier, assuming they are still used elsewhere
  const headerBackgroundColor = isDarkMode ? "grey.700" : "grey.300";
  // const rowBackgroundColor = isDarkMode ? "grey.900" : "grey.100";

  // --- Data Fetching Callbacks (fetchActiveSeasonId, fetchSeasons, fetchDisplayStats, getTargetSeasonId, fetchEloHistoryForSeason, fetchSeasonAwards) ---
  // ... (Keep all existing data fetching logic exactly the same) ...
  // --- Fetch Active Season ID ---
  const fetchActiveSeasonId = useCallback(async () => {
    if (activeSeasonIdCache) return activeSeasonIdCache; // Use cache if available
    try {
      const { season: activeSeason } = await getActiveSeason(teamId);
      const id = activeSeason?.id ?? null;
      setActiveSeasonIdCache(id); // Cache the result
      return id;
    } catch (err) {
      console.error("Error fetching active season ID:", err);
      // Don't set main error state here, handle lack of ID in dependent functions
      return null;
    }
  }, [teamId, activeSeasonIdCache]); // Add cache to dependencies

  // --- Fetch Seasons for Dropdown ---
  const fetchSeasons = useCallback(async () => {
    setLoadingSeasons(true);
    setError(null); // Clear previous errors
    try {
      const { data, error: seasonError } = await supabase
        .from("seasons")
        .select("*")
        .eq("team_id", teamId)
        .order("season_no", { ascending: false });

      if (seasonError) throw seasonError;
      const fetchedSeasons = (data as SeasonType[]) ?? [];
      setSeasons(fetchedSeasons);

      // Find active season from fetched data or fetch separately if needed
      const activeSeason = fetchedSeasons.find((s) => s.active);
      let currentIdToSelect = "current"; // Default to current

      if (activeSeason) {
        setActiveSeasonIdCache(activeSeason.id); // Cache the active ID if found
      }

      // Determine initial selection
      if (activeSeason || activeSeasonIdCache) {
        currentIdToSelect = "current";
      } else if (fetchedSeasons.length > 0) {
        // If no active season known, default to the most recent completed one
        currentIdToSelect = fetchedSeasons[0].id;
      }
      setSelectedSeasonId(currentIdToSelect);
    } catch (err) {
      console.error("Error fetching seasons:", err);
      setError("Could not load season list.");
    } finally {
      setLoadingSeasons(false);
    }
  }, [teamId, activeSeasonIdCache]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]); // Run once on mount (and if teamId changes)

  // --- Fetch Stats based on Selected Season ---
  const fetchDisplayStats = useCallback(async () => {
    if (selectedSeasonId === "current") {
      setDisplayStats(currentPlayerData);
      setLoadingStats(false);
      return;
    }

    setLoadingStats(true);
    // Don't clear global error here, let specific fetches manage
    try {
      const { data: seasonStatData, error: statError } = await supabase
        .from("player_team_season_stats")
        .select("*, player:players(name)")
        .eq("pt_id", ptId)
        .eq("season_id", selectedSeasonId)
        .maybeSingle();

      if (statError) throw statError;

      if (seasonStatData) {
        const stats = seasonStatData;
        setDisplayStats({
          elo: stats.final_elo,
          wins: stats.season_wins,
          losses: stats.season_losses,
          win_percent: stats.season_win_percent
            ? Number(stats.season_win_percent.toFixed(1))
            : 0,
          highest_elo: stats.season_highest_elo ?? stats.final_elo,
          longest_win_streak: stats.season_longest_win_streak ?? 0,
          player: { name: stats.player.name },
          pt_id: stats.pt_id,
          player_id: stats.player_id,
          sigma: stats.final_sigma,
          mu: stats.final_mu,
          win_streak: 0, // Not relevant for archived
          loss_streak: 0, // Not relevant for archived
          elo_change: 0, // Not relevant for archived
          team_id: stats.team_id,
          last_updated: stats.archived_at,
        });
        setError(null); // Clear error if successful
      } else {
        setDisplayStats(null);
        // Set a more specific message or handle in render
        // setError(`No stats found for this player in the selected season.`);
      }
    } catch (err) {
      console.error("Error fetching season stats:", err);
      setError("Could not load stats for the selected season.");
      setDisplayStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [selectedSeasonId, ptId, currentPlayerData]);

  useEffect(() => {
    fetchDisplayStats();
  }, [fetchDisplayStats]);

  // --- Determine Target Season ID for Queries ---
  const getTargetSeasonId = useCallback(async (): Promise<string | null> => {
    if (selectedSeasonId === "current") {
      return fetchActiveSeasonId(); // Fetch or get cached active season ID
    }
    return selectedSeasonId; // Use the specific selected season ID
  }, [selectedSeasonId, fetchActiveSeasonId]);

  // --- Fetch ELO History based on Selected Season ---
  const fetchEloHistoryForSeason = useCallback(async () => {
    if (!isOpen || selectedSeasonId === null) return;

    setLoadingEloHistory(true);
    setError(null); // Clear previous errors related to ELO history
    setEloHistory([]);

    try {
      const targetSeasonId = await getTargetSeasonId();
      if (!targetSeasonId) {
        // setError("Could not determine the season for Elo history."); // Optional: More specific error
        setLoadingEloHistory(false);
        return; // Cannot proceed without a season ID
      }

      // Fetch session IDs for the target season
      const { data: sessionIdsData, error: sessionIdsError } = await supabase
        .from("sessions")
        .select("id")
        .eq("season_id", targetSeasonId);

      if (sessionIdsError) throw sessionIdsError;
      const sessionIds = sessionIdsData?.map((s) => s.id) ?? [];

      if (sessionIds.length === 0) {
        setLoadingEloHistory(false);
        return; // No sessions, so no history
      }

      // Fetch game players for those sessions
      const { data: eloHistoryData, error: eloHistoryError } = await supabase
        .from("game_players")
        .select(`elo_after, games!inner(match_date, session_id)`)
        .eq("pt_id", ptId)
        .in("games.session_id", sessionIds)
        .order("games(match_date)", {
          ascending: true,
        });

      if (eloHistoryError) throw eloHistoryError;

      const dailyEloMap = new Map<string, EloHistoryEntry>();
      (eloHistoryData ?? []).forEach((item) => {
        if (!item.games?.match_date) return;
        const d = new Date(item.games.match_date);
        const formattedDate = format(d, "MM/dd/yy");
        dailyEloMap.set(formattedDate, {
          date: formattedDate,
          elo: item.elo_after,
          timestamp: d.getTime(),
        });
      });

      const processedEloHistory = Array.from(dailyEloMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      setEloHistory(processedEloHistory);
    } catch (error) {
      console.error("Error fetching Elo history:", error);
      setError("Failed to load Elo history for this season.");
      setEloHistory([]); // Clear potentially partial data on error
    } finally {
      setLoadingEloHistory(false);
    }
  }, [isOpen, selectedSeasonId, ptId, getTargetSeasonId]); // Use getTargetSeasonId

  // --- Fetch Player Awards for Selected Season ---
  const fetchSeasonAwards = useCallback(async () => {
    // Only fetch if panel is open AND a past season is selected
    if (
      !isOpen ||
      selectedSeasonId === "current" ||
      selectedSeasonId === null
    ) {
      setSeasonAwards([]); // Clear awards if not applicable
      setLoadingAwards(false);
      return;
    }

    setLoadingAwards(true);
    setSeasonAwards([]); // Clear previous awards

    try {
      // No need for getTargetSeasonId here, we know selectedSeasonId is a valid past ID
      const targetSeasonId = selectedSeasonId;

      const { data: awardsData, error: awardsError } = await supabase
        .from("player_awards") // Adjust table name if different
        .select("*") // Select all award fields
        .eq("pt_id", ptId)
        .eq("season_id", targetSeasonId);

      if (awardsError) throw awardsError;

      setSeasonAwards((awardsData as PlayerAwardType[]) ?? []);
    } catch (error) {
      console.error("Error fetching player awards:", error);
      setError("Failed to load player awards for this season.");
      setSeasonAwards([]);
    } finally {
      setLoadingAwards(false);
    }
    // Update dependencies: only fetch when isOpen or selectedSeasonId changes
  }, [isOpen, selectedSeasonId, ptId]);

  // --- Trigger Fetches when Panel Opens or Season Changes ---
  useEffect(() => {
    if (isOpen) {
      fetchEloHistoryForSeason();
      fetchSeasonAwards(); // Fetch awards when opened or season changes
    } else {
      // Optionally clear state when closing
      setEloHistory([]);
      setSeasonAwards([]);
      setError(null);
    }
  }, [isOpen, fetchEloHistoryForSeason, fetchSeasonAwards]); // Add fetchSeasonAwards dependency

  // --- Handlers ---
  const handleExpandClick = () => {
    onTeamOpen(isOpen ? null : currentTeamData.player.pt_id);
  };

  const handleSeasonChange = (event: SelectChangeEvent) => {
    setSelectedSeasonId(event.target.value as string);
    // Reset dependent states immediately when season changes
    setEloHistory([]);
    setSeasonAwards([]);
    setError(null);
    // New data (stats, elo history, awards) will be fetched by useEffect hooks
    // based on the new selectedSeasonId and the isOpen state.
  };

  // --- Render ---
  const rank = displayStats ? getRank(displayStats.elo) : getRank(0);

  // Recalculate labels based on current state
  const activeSeasonNo = seasons.find(
    (s) => s.id === activeSeasonIdCache
  )?.season_no;
  const selectedSeasonDetails = seasons.find((s) => s.id === selectedSeasonId);
  const selectedSeasonNumber = selectedSeasonDetails?.season_no;

  return (
    <Paper className="mb-4 p-4 rounded" elevation={2}>
      {/* Header */}
      <Box display={"flex"} flexDirection={"column"}>
        {/* ... Header content ... */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box
            display="flex"
            alignItems="center"
            justifyContent={"center"}
            gap={1}
            sx={{ cursor: "pointer" }}
            onClick={() => void router.push(`/team/${currentTeamData.team.id}`)}
          >
            {currentTeamData.team.logo_url ? (
              <Image
                src={currentTeamData.team.logo_url}
                alt={`${currentTeamData.team.name} Logo`}
                width={40}
                height={40}
                className="rounded"
              />
            ) : (
              <NoLogoAvatar name={currentTeamData.team.name} size="small" />
            )}
            <Typography variant="h6" fontWeight="bold">
              {currentTeamData.team.name}
            </Typography>
          </Box>
          <IconButton
            onClick={handleExpandClick}
            aria-expanded={isOpen}
            aria-label="show more"
          >
            {!isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Current/Selected Season Stats (always visible) */}
      {loadingStats ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
          <CircularProgress size={20} />
        </Box>
      ) : displayStats ? (
        <IndividualTeamStats
          playerStats={displayStats}
          currentSeason={selectedSeasonId === "current"}
          selectedSeasonNo={selectedSeasonNumber}
        />
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic", py: 1 }}
        >
          {selectedSeasonId === "current"
            ? "Awaiting stats..."
            : "No stats available for selected season."}
        </Typography>
      )}

      {/* Collapsible Details */}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {" "}
          {/* Increased gap slightly */}
          {/* Season Selector */}
          <FormControl
            size="small"
            sx={{ width: { xs: "100%", sm: 300 }, alignSelf: "center" }}
          >
            <InputLabel id={`season-select-label-${ptId}`}>
              View Season
            </InputLabel>
            <Select
              labelId={`season-select-label-${ptId}`}
              id={`season-select-${ptId}`}
              value={selectedSeasonId}
              label="View Season"
              onChange={handleSeasonChange}
              fullWidth
              disabled={
                loadingSeasons ||
                loadingStats ||
                loadingEloHistory ||
                loadingAwards
              }
            >
              <MenuItem key="current" value="current">
                <Typography variant="body2">
                  Current Season - S{activeSeasonNo ?? "..."}
                </Typography>
              </MenuItem>
              {loadingSeasons ? (
                <MenuItem value="" disabled>
                  <em>Loading Seasons...</em>
                </MenuItem>
              ) : (
                seasons
                  .filter((s) => !s.active)
                  .map((season) => (
                    <MenuItem key={season.id} value={season.id}>
                      <Typography variant="body2">
                        S{season.season_no} (
                        {format(new Date(season.start_date), "P")} -{" "}
                        {season.end_date
                          ? format(new Date(season.end_date), "P")
                          : "Present"}
                        )
                      </Typography>
                    </MenuItem>
                  ))
              )}
            </Select>
          </FormControl>
          {/* Rank, Peak ELO, Best Streak Table */}
          {loadingStats ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
              <CircularProgress size={20} />
            </Box>
          ) : displayStats ? (
            <TableContainer
              component={Paper}
              elevation={2} // Subtle elevation
              sx={{ border: `1px solid ${theme.palette.divider}` }}
            >
              <Table aria-label="player season summary table" size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: headerBackgroundColor }}>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Typography variant="caption" fontWeight="bold">
                        Rank
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Typography variant="caption" fontWeight="bold">
                        Peak ELO
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Typography variant="caption" fontWeight="bold">
                        Best Streak
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Tooltip title={rank.name} placement="top">
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          gap={0.5}
                        >
                          {rank.icon}
                          <Typography variant="body2">{rank.name}</Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={0.5}
                      >
                        <Typography variant="body2">
                          {displayStats.highest_elo ?? "--"}
                        </Typography>
                        <EmojiEventsSharp
                          fontSize="small"
                          sx={{ color: theme.palette.warning.main }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 0.5 }}>
                      {displayStats.longest_win_streak > 0 ? (
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          gap={0.5}
                        >
                          <Typography variant="body2">
                            {displayStats.longest_win_streak}
                          </Typography>
                          <WhatshotSharp
                            fontSize="small"
                            sx={{ color: theme.palette.error.main }}
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          --
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : // </Paper> // Removed outer paper
          null}
          {/* Player Awards Section Revamp */}
          {selectedSeasonId !== "current" && ( // Only render section if NOT current season
            <Box>
              {/* Add some top padding */}
              <Typography variant="h6" fontWeight="bold">
                Season {selectedSeasonDetails?.season_no} Awards
              </Typography>
              {loadingAwards ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : error && error.includes("awards") ? (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{ fontStyle: "italic" }}
                >
                  {error}
                </Typography>
              ) : seasonAwards.length > 0 ? (
                // Use Flexbox for horizontal layout with wrapping
                <Box display="flex" flexWrap="wrap" gap={1.5}>
                  {seasonAwards.map((award) => {
                    // --- Get award details (icon, title, color) ---
                    // Ensure getAwardDetails is correctly imported and works without theme
                    const details = getAwardDetails(award.award_type);
                    // Handle cases where award type might not be in getAwardDetails
                    if (!details) {
                      console.warn(
                        `Details not found for award type: ${award.award_type}`
                      );
                      return (
                        // Render a fallback or null
                        <Paper
                          key={award.id}
                          variant="outlined"
                          sx={{ p: 1, display: "inline-flex" }}
                        >
                          <Typography variant="caption">
                            Unknown Award
                          </Typography>
                        </Paper>
                      );
                    }

                    // --- Resolve theme colors if needed (e.g., for primary.main) ---
                    const cardColor =
                      award.award_type === "longest_win_streak"
                        ? theme.palette.error.main
                        : award.award_type === "most_wins"
                        ? theme.palette.primary.main
                        : details.color;

                    // --- Determine value text ---
                    const isEloAward =
                      award.award_type.startsWith("highest_elo");

                    let valueText: string | null = null;
                    if (award.award_value) {
                      const value = award.award_value;
                      if (isEloAward) {
                        valueText = `${value} ELO`;
                      } else if (award.award_type === "most_wins") {
                        valueText = `${value} Win${value !== 1 ? "s" : ""}`; // Pluralize 'Win'
                      } else if (award.award_type === "longest_win_streak") {
                        valueText = `${value} Win${value !== 1 ? "s" : ""}`;
                      }
                      // Add more conditions here if other award types have values
                    }

                    // --- Render the Award Badge ---
                    return (
                      <Paper
                        key={award.id}
                        variant="outlined"
                        sx={{
                          p: 1,
                          borderRadius: "8px", // Slightly more rounded
                          display: "inline-flex", // Sizes to content
                          alignItems: "center",
                          gap: 1, // Space between icon and text
                          borderColor: alpha(cardColor, 0.6), // Use resolved color for border
                          bgcolor: isEloAward
                            ? alpha(cardColor, 0.1)
                            : undefined,
                          ".MuiSvgIcon-root": { color: cardColor },
                        }}
                      >
                        {/* Icon with Tooltip */}
                        <Tooltip title={details.title} placement="top">
                          {/* We apply color to the icon via sx on Paper */}
                          {details.icon}
                        </Tooltip>
                        {/* Title and Value (if applicable) */}
                        <Box
                          display="flex"
                          flexDirection="column"
                          alignItems="flex-start"
                        >
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            lineHeight={1.3}
                          >
                            {details.title}
                          </Typography>
                          {valueText && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              lineHeight={1.3}
                            >
                              ({valueText})
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              ) : (
                // Message when no awards are found for the season
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  No awards won this season.
                </Typography>
              )}
            </Box>
          )}
          {/* ======================== */}
          {/* End Player Awards Section */}
          {/* ======================== */}
          {/* ELO History Chart */}
          <Divider sx={{ my: 1 }} /> {/* Optional divider */}
          <Box sx={{ px: 1 }}>
            <Typography variant="h6" fontWeight={"bold"} gutterBottom>
              Elo History
            </Typography>
            {loadingEloHistory ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                <CircularProgress size={24} />
              </Box>
            ) : error && error.includes("Elo history") ? (
              <Typography
                variant="body2"
                color="error"
                sx={{ fontStyle: "italic" }}
              >
                {error}
              </Typography>
            ) : eloHistory.length > 0 ? (
              <EloHistoryChart data={eloHistory} />
            ) : (
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ fontStyle: "italic" }}
              >
                No game data found for this season.
              </Typography>
            )}
            {/* Display general errors */}
            {error &&
              !error.includes("awards") &&
              !error.includes("Elo history") &&
              !error.includes("stats") && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{ mt: 1, fontStyle: "italic" }}
                >
                  {error}
                </Typography>
              )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default PlayerTeamStats;
