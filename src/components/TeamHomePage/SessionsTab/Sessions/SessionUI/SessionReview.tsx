// /components/Sessions/SessionReviewDisplay.tsx (Adjust path)

import { supabase } from "@/lib/supabase"; // Adjust path
import { PlayerTeamType, SessionAttendeeWithStats } from "@/lib/types"; // Adjust path
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import RemoveIcon from "@mui/icons-material/Remove"; // Icon for no change
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";

// Updated sortable keys
type SortableKey =
  | "name"
  | "eloChange"
  | "winsChange"
  | "lossesChange"
  | "sessionWinPercent"
  | "rankChange"
  | "finalElo"
  | "currentRank";
type SortDirection = "asc" | "desc";

// Updated combined type for display
interface CalculatedReviewStats extends SessionAttendeeWithStats {
  current_elo: number;
  current_wins: number;
  current_losses: number;
  current_rank: number | null;
  eloChange: number;
  winsChange: number; // Session Wins
  lossesChange: number; // Session Losses
  rankChange: number | null;
  sessionWinPercent: number | null; // Win % for games played *during* the session
}

type SessionReviewDisplayProps = {
  attendeesWithStats: SessionAttendeeWithStats[]; // Contains ONLY before stats now
  teamId: string; // Needed to fetch current ranks/stats
  isActive: boolean;
};

const SessionReviewDisplay = ({
  attendeesWithStats,
  teamId,
  isActive,
}: SessionReviewDisplayProps) => {
  const [sortBy, setSortBy] = useState<SortableKey>("currentRank");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [liveData, setLiveData] = useState<CalculatedReviewStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const router = useRouter();
  const isDarkMode = theme.palette.mode === "dark";

  const headerBackgroundColor = isDarkMode ? "grey.700" : "grey.300";
  const rowBackgroundColor = isDarkMode ? "grey.900" : "grey.100";
  const rowHoverBackgroundColor = isDarkMode ? "grey.800" : "grey.200";

  // --- Fetch Live Data ---
  const fetchLiveStatsAndRank = useCallback(async () => {
    if (!attendeesWithStats || attendeesWithStats.length === 0 || !teamId) {
      setLiveData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const attendeePtIds = attendeesWithStats.map((a) => a.pt_id);

    try {
      // Fetch Current Stats & All Team Players concurrently
      const [statsResult, rankingResult] = await Promise.all([
        supabase
          .from("player_teams")
          .select(
            "pt_id, elo, mu, sigma, wins, losses, player:players!inner(name)"
          )
          .in("pt_id", attendeePtIds),
        supabase
          .from("player_teams")
          .select("pt_id, elo")
          .eq("team_id", teamId)
          .order("elo", { ascending: false }),
      ]);

      const { data: currentStatsData, error: statsError } = statsResult;
      const { data: allTeamPlayersData, error: rankError } = rankingResult;

      if (statsError)
        throw new Error(`Failed to fetch current stats: ${statsError.message}`);
      if (rankError)
        throw new Error(
          `Failed to fetch team players for ranking: ${rankError.message}`
        );

      // Create Maps
      const currentStatsMap = new Map(
        currentStatsData?.map((s) => [s.pt_id, s])
      );
      const currentRankMap = new Map<string, number>();
      allTeamPlayersData?.forEach((p, index) => {
        currentRankMap.set(p.pt_id, index + 1);
      });

      // Calculate final data including changes
      const calculated: CalculatedReviewStats[] = attendeesWithStats.map(
        (att) => {
          const currentStats = currentStatsMap.get(att.pt_id);
          const currentElo = currentStats?.elo ?? att.elo_before ?? 0;
          const currentWins = currentStats?.wins ?? att.wins_before ?? 0;
          const currentLosses = currentStats?.losses ?? att.losses_before ?? 0;
          const currentRank = currentRankMap.get(att.pt_id) ?? null;

          const beforeWins = att.wins_before ?? 0;
          const beforeLosses = att.losses_before ?? 0;
          const beforeElo = att.elo_before ?? 0;

          const rankChange =
            att.rank_before !== null && currentRank !== null
              ? att.rank_before - currentRank
              : null;
          const winsChange = currentWins - beforeWins;
          const lossesChange = currentLosses - beforeLosses;
          const sessionGamesPlayed = winsChange + lossesChange;
          const sessionWinPercent =
            sessionGamesPlayed > 0
              ? (winsChange / sessionGamesPlayed) * 100
              : null;

          const playerName =
            currentStats?.player?.name ??
            att.player_teams?.player?.name ??
            "Unknown";

          return {
            ...att,
            current_elo: currentElo,
            current_wins: currentWins,
            current_losses: currentLosses,
            current_rank: currentRank,
            eloChange: currentElo - beforeElo,
            winsChange: winsChange, // Session Wins
            lossesChange: lossesChange, // Session Losses
            rankChange: rankChange,
            sessionWinPercent: sessionWinPercent,
            player_teams: {
              ...(att.player_teams ?? ({} as PlayerTeamType)),
              player: { name: playerName },
            },
          };
        }
      );
      setLiveData(calculated);
    } catch (err) {
      setError(`Failed to load current player data. ${err}`);
      setLiveData([]);
    } finally {
      setLoading(false);
    }
  }, [attendeesWithStats, teamId]);

  // Fetch data on mount
  useEffect(() => {
    fetchLiveStatsAndRank();
  }, [fetchLiveStatsAndRank]);

  const handlePlayerClick = (playerId: string) => {
    void router.push(`/player/${playerId}`);
  };

  // --- Sorting Logic ---
  const sortedData = useMemo(() => {
    return [...liveData].sort((a, b) => {
      let compareA: string | number | null = null;
      let compareB: string | number | null = null;

      switch (sortBy) {
        case "name":
          compareA = a.player_teams?.player?.name ?? "";
          compareB = b.player_teams?.player?.name ?? "";
          break;
        case "eloChange":
          compareA = a.eloChange;
          compareB = b.eloChange;
          break;
        case "winsChange":
          compareA = a.winsChange;
          compareB = b.winsChange;
          break;
        case "lossesChange":
          compareA = a.lossesChange;
          compareB = b.lossesChange;
          break; // Added
        case "sessionWinPercent":
          compareA = a.sessionWinPercent ?? -1;
          compareB = b.sessionWinPercent ?? -1;
          break; // Added (nulls last)
        case "rankChange":
          compareA = a.rankChange ?? -Infinity;
          compareB = b.rankChange ?? -Infinity;
          break;
        case "finalElo":
          compareA = a.current_elo;
          compareB = b.current_elo;
          break;
        case "currentRank":
          compareA = a.current_rank ?? Infinity;
          compareB = b.current_rank ?? Infinity;
          break; // Added (nulls last)
        default:
          return 0;
      }

      if (compareA === null || compareB === null) return 0;
      let comparison = 0;
      if (typeof compareA === "string" && typeof compareB === "string")
        comparison = compareA.localeCompare(compareB);
      else if (typeof compareA === "number" && typeof compareB === "number")
        comparison = compareA - compareB;
      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [liveData, sortBy, sortDir]);

  const handleSort = (key: SortableKey) => {
    const isAsc = sortBy === key && sortDir === "asc";
    // Default sort directions
    const defaultDirections: Record<SortableKey, SortDirection> = {
      name: "asc",
      currentRank: "asc", // Lower rank is better
      finalElo: "desc",
      eloChange: "desc",
      winsChange: "desc",
      lossesChange: "asc", // Lower losses is better? Or desc for most losses? Let's default asc.
      sessionWinPercent: "desc",
      rankChange: "desc", // Higher positive change is better
    };
    setSortDir(
      sortBy === key ? (isAsc ? "desc" : "asc") : defaultDirections[key]
    );
    setSortBy(key);
  };

  const getSortDirection = (key: SortableKey): SortDirection | false => {
    return sortBy === key ? sortDir : false;
  };

  // --- Rendering Helpers ---
  const renderRankChange = (change: number | null) => {
    if (change === null) return null; // Don't render anything if no change/data
    if (change > 0)
      return (
        // Rank Improved (number went down)
        <Tooltip title={`Improved by ${change} rank(s)`} placement="top">
          <Box
            component="span"
            display="inline-flex"
            alignItems="center"
            sx={{ ml: 0.5, color: "success.main" }}
          >
            <ArrowUpwardIcon sx={{ fontSize: "1rem" }} />
            <Typography variant="caption" component="span" fontWeight="bold">
              {change}
            </Typography>
          </Box>
        </Tooltip>
      );
    if (change < 0)
      return (
        // Rank Worsened (number went up)
        <Tooltip
          title={`Dropped by ${Math.abs(change)} rank(s)`}
          placement="top"
        >
          <Box
            component="span"
            display="inline-flex"
            alignItems="center"
            sx={{ ml: 0.5, color: "error.main" }}
          >
            <ArrowDownwardIcon sx={{ fontSize: "1rem" }} />
            <Typography variant="caption" component="span" fontWeight="bold">
              {Math.abs(change)}
            </Typography>
          </Box>
        </Tooltip>
      );
    // If change is 0
    return (
      <Tooltip title="No rank change" placement="top">
        <Box
          component="span"
          display="inline-flex"
          alignItems="center"
          sx={{ ml: 0.5, color: "text.disabled" }}
        >
          <RemoveIcon sx={{ fontSize: "1rem" }} />
        </Box>
      </Tooltip>
    );
  };

  const renderEloChange = (change: number) => {
    if (change > 0)
      return (
        <Typography variant="body2" color="success.main" fontWeight="bold">
          +{change}
        </Typography>
      );
    if (change < 0)
      return (
        <Typography variant="body2" color="error.main" fontWeight="bold">
          {change}
        </Typography>
      ); // Negative sign included
    return (
      <Typography variant="body2" color="text.secondary">
        0
      </Typography>
    );
  };

  const renderWinPercent = (percent: number | null) => {
    if (percent === null)
      return (
        <Typography variant="caption" color="text.disabled">
          -
        </Typography>
      );
    return <Typography variant="body2">{percent.toFixed(1)}%</Typography>;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box px={2} pb={2}>
      <Typography variant="h5" gutterBottom fontWeight={"bold"}>
        {isActive ? "Live Session Stats" : "Session Stats"}
      </Typography>
      <Paper elevation={2} sx={{ overflowX: "auto" }}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: headerBackgroundColor }}>
                {/* Updated Rank Column Header */}
                <TableCell sortDirection={getSortDirection("currentRank")}>
                  <TableSortLabel
                    active={sortBy === "currentRank"}
                    direction={sortBy === "currentRank" ? sortDir : "asc"}
                    onClick={() => handleSort("currentRank")}
                    sx={{ fontWeight: "bold" }}
                  >
                    Rank
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={getSortDirection("name")}
                  sx={{ fontWeight: "bold" }}
                >
                  <TableSortLabel
                    active={sortBy === "name"}
                    direction={sortBy === "name" ? sortDir : "asc"}
                    onClick={() => handleSort("name")}
                  >
                    Player
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  // align="center"
                  sortDirection={getSortDirection("eloChange")}
                >
                  <TableSortLabel
                    active={sortBy === "eloChange"}
                    direction={sortBy === "eloChange" ? sortDir : "desc"}
                    onClick={() => handleSort("eloChange")}
                    sx={{ fontWeight: "bold" }}
                  >
                    +/-
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  // align="center"
                  sortDirection={getSortDirection("finalElo")}
                >
                  <TableSortLabel
                    active={sortBy === "finalElo"}
                    direction={sortBy === "finalElo" ? sortDir : "desc"}
                    onClick={() => handleSort("finalElo")}
                    sx={{ fontWeight: "bold" }}
                  >
                    ELO
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  // align="center"
                  sortDirection={getSortDirection("winsChange")}
                >
                  <TableSortLabel
                    active={sortBy === "winsChange"}
                    direction={sortBy === "winsChange" ? sortDir : "desc"}
                    onClick={() => handleSort("winsChange")}
                    sx={{ fontWeight: "bold" }}
                  >
                    W
                  </TableSortLabel>
                </TableCell>
                {/* Added Session Losses Header */}
                <TableCell
                  // align="center"
                  sortDirection={getSortDirection("lossesChange")}
                >
                  <TableSortLabel
                    active={sortBy === "lossesChange"}
                    direction={sortBy === "lossesChange" ? sortDir : "asc"}
                    onClick={() => handleSort("lossesChange")}
                    sx={{ fontWeight: "bold" }}
                  >
                    L
                  </TableSortLabel>
                </TableCell>
                {/* Added Session Win % Header */}
                <TableCell
                  // align="center"
                  sortDirection={getSortDirection("sessionWinPercent")}
                >
                  <TableSortLabel
                    active={sortBy === "sessionWinPercent"}
                    direction={
                      sortBy === "sessionWinPercent" ? sortDir : "desc"
                    }
                    onClick={() => handleSort("sessionWinPercent")}
                    sx={{ fontWeight: "bold" }}
                  >
                    Win%
                  </TableSortLabel>
                </TableCell>
                {/* Removed Rank +/-, Before Rank Headers */}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((att) => (
                <TableRow
                  key={att.pt_id}
                  hover
                  sx={{
                    backgroundColor: rowBackgroundColor,
                    "&:last-child td, &:last-child th": { border: 0 },
                    "&:hover": { backgroundColor: rowHoverBackgroundColor },
                  }}
                >
                  {/* Combined Rank Cell */}
                  <TableCell>
                    <Box
                      display="flex"
                      // alignItems="center"
                      justifyContent="flex-start"
                    >
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ mr: 0.5 }}
                      >
                        {att.current_rank ?? "-"}
                      </Typography>
                      {renderRankChange(att.rankChange)}
                    </Box>
                  </TableCell>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{ cursor: "pointer" }}
                    onClick={() =>
                      handlePlayerClick(att.player_teams.player_id)
                    }
                  >
                    {att.player_teams.player.name}
                  </TableCell>
                  <TableCell
                  // align="center"
                  >
                    {renderEloChange(att.eloChange)}
                  </TableCell>
                  <TableCell
                  // align="center"
                  >
                    {att.current_elo}
                  </TableCell>
                  <TableCell
                  // align="center"
                  >
                    {att.winsChange}
                  </TableCell>
                  {/* Added Session Losses Cell */}
                  <TableCell
                  // align="center"
                  >
                    {att.lossesChange}
                  </TableCell>
                  {/* Added Session Win % Cell */}
                  <TableCell
                  // align="center"
                  >
                    {renderWinPercent(att.sessionWinPercent)}
                  </TableCell>
                  {/* Removed Rank +/-, Before Rank Cells */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SessionReviewDisplay;
