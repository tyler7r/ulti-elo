import { supabase } from "@/lib/supabase"; // Adjust path
import { SessionAttendeeWithStats } from "@/lib/types"; // Use updated type
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
import { useRouter } from "next/router"; // Use next/router for Pages Router
import { useCallback, useEffect, useMemo, useState } from "react";

// --- Type Definitions ---
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

// Combined type for display after fetching and calculating
interface CalculatedReviewStats extends SessionAttendeeWithStats {
  session_elo_before: number | null; // ELO before first session game
  session_elo_after: number | null; // ELO after last session game
  current_rank: number | null; // Current rank on the team
  eloChange: number;
  winsChange: number;
  lossesChange: number;
  rankChange: number | null;
  sessionWinPercent: number | null;
  // Include player name directly for easier access
  player_name: string;
}

// Type for the structure returned by the game_players query
type GamePlayerData = {
  pt_id: string;
  elo_before: number;
  elo_after: number;
  wins_before: number;
  wins_after: number;
  losses_before: number;
  losses_after: number;
  games: { match_date: string } | null;
};

type SessionStatsProps = {
  attendeesWithStats: SessionAttendeeWithStats[]; // Contains pt_id and stats_before_rank
  teamId: string;
  sessionId: string;
  isActive: boolean;
};

const SessionStats = ({
  attendeesWithStats,
  teamId,
  sessionId,
  isActive,
}: SessionStatsProps) => {
  const theme = useTheme();
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortableKey>("currentRank");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [calculatedData, setCalculatedData] = useState<CalculatedReviewStats[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch and Calculate Data ---
  const calculateSessionStats = useCallback(async () => {
    if (!attendeesWithStats || attendeesWithStats.length === 0 || !teamId) {
      setCalculatedData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const attendeePtIds = attendeesWithStats.map((a) => a.pt_id);

    try {
      // 1. Fetch all relevant game_players data for the session attendees
      const { data: gamePlayersData, error: gpError } = await supabase
        .from("game_players")
        .select(
          `
                    pt_id,
                    elo_before, elo_after,
                    wins_before, wins_after,
                    losses_before, losses_after,
                    games!inner(match_date)
                `
        )
        .in("pt_id", attendeePtIds)
        .eq("games.session_id", sessionId) // Filter by session_id via join
        .order("games(match_date)", { ascending: true }); // Order by game date

      if (gpError)
        throw new Error(`Failed to fetch game player data: ${gpError.message}`);

      // 2. Fetch Current Team Ranking (for current rank and rank change)
      const { data: allTeamPlayersData, error: rankError } = await supabase
        .from("player_teams")
        .select("pt_id, elo")
        .eq("team_id", teamId)
        .or(`wins.gt.0, losses.gt.0`) // Filter for players with games? Optional.
        .order("elo", { ascending: false });

      if (rankError)
        throw new Error(`Failed to fetch team ranking: ${rankError.message}`);

      // 3. Process Data
      const currentRankMap = new Map<string, number>();
      allTeamPlayersData?.forEach((p, index) => {
        currentRankMap.set(p.pt_id, index + 1);
      });

      const results: CalculatedReviewStats[] = attendeesWithStats.map((att) => {
        const playerGames = (
          (gamePlayersData as GamePlayerData[]) ?? []
        ).filter((gp) => gp.pt_id === att.pt_id);
        playerGames.sort(
          (a, b) =>
            new Date(a.games!.match_date).getTime() -
            new Date(b.games!.match_date).getTime()
        ); // Ensure sorted

        let session_elo_before: number | null = null;
        let session_elo_after: number | null = null;
        let session_wins_before: number | null = null;
        let session_wins_after: number | null = null;
        let session_losses_before: number | null = null;
        let session_losses_after: number | null = null;

        if (playerGames.length > 0) {
          // Stats before first game of session
          session_elo_before = playerGames[0].elo_before;
          session_wins_before = playerGames[0].wins_before;
          session_losses_before = playerGames[0].losses_before;
          // Stats after last game of session
          session_elo_after = playerGames[playerGames.length - 1].elo_after;
          session_wins_after = playerGames[playerGames.length - 1].wins_after;
          session_losses_after =
            playerGames[playerGames.length - 1].losses_after;
        } else {
          // If player played no games in session, use their current stats as before/after
          session_elo_before = att.player_teams?.elo ?? null;
          session_elo_after = att.player_teams?.elo ?? null;
          session_wins_before = att.player_teams?.wins ?? null;
          session_wins_after = att.player_teams?.wins ?? null;
          session_losses_before = att.player_teams?.losses ?? null;
          session_losses_after = att.player_teams?.losses ?? null;
        }

        const currentRank = currentRankMap.get(att.pt_id) ?? null;
        const rankChange =
          att.rank_before !== null && currentRank !== null
            ? att.rank_before - currentRank
            : null;

        const winsChange =
          (session_wins_after ?? 0) - (session_wins_before ?? 0);
        const lossesChange =
          (session_losses_after ?? 0) - (session_losses_before ?? 0);
        const sessionGamesPlayed = winsChange + lossesChange;
        const sessionWinPercent =
          sessionGamesPlayed > 0
            ? (winsChange / sessionGamesPlayed) * 100
            : null;

        return {
          ...att, // Includes pt_id, session_id, stats_before_rank, player_teams
          session_elo_before: session_elo_before,
          session_elo_after: session_elo_after,
          current_rank: currentRank,
          eloChange: (session_elo_after ?? 0) - (session_elo_before ?? 0),
          winsChange: winsChange,
          lossesChange: lossesChange,
          rankChange: rankChange,
          sessionWinPercent: sessionWinPercent,
          player_name: att.player_teams?.player?.name ?? "Unknown", // Add player name directly
        };
      });

      setCalculatedData(results);
    } catch (err) {
      console.error("Error calculating session stats:", err);
      setError("Failed to calculate session review data.");
      setCalculatedData([]);
    } finally {
      setLoading(false);
    }
  }, [attendeesWithStats, teamId, sessionId]); // Include supabase if not stable globally

  // Fetch data on mount
  useEffect(() => {
    calculateSessionStats();
  }, [calculateSessionStats]);

  // --- Sorting Logic ---
  const sortedData = useMemo(() => {
    return [...calculatedData].sort((a, b) => {
      let compareA: string | number | null = null;
      let compareB: string | number | null = null;

      switch (sortBy) {
        case "name":
          compareA = a.player_name;
          compareB = b.player_name;
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
          break;
        case "sessionWinPercent":
          compareA = a.sessionWinPercent ?? -1;
          compareB = b.sessionWinPercent ?? -1;
          break;
        case "rankChange":
          compareA = a.rankChange ?? -Infinity;
          compareB = b.rankChange ?? -Infinity;
          break;
        case "finalElo":
          compareA = a.session_elo_after ?? 0;
          compareB = b.session_elo_after ?? 0;
          break; // Use session_elo_after
        case "currentRank":
          compareA = a.current_rank ?? Infinity;
          compareB = b.current_rank ?? Infinity;
          break;
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
  }, [calculatedData, sortBy, sortDir]);

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

  const handlePlayerClick = (playerId: string) => {
    void router.push(`/player/${playerId}`);
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
        {isActive ? "Live Stats" : "Session Stats"}
      </Typography>
      <Paper elevation={2} sx={{ overflowX: "auto" }}>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor:
                    theme.palette.mode === "dark" ? "grey.700" : "grey.300",
                }}
              >
                {/* Headers */}
                <TableCell sortDirection={getSortDirection("currentRank")}>
                  <TableSortLabel
                    /* Rank */ onClick={() => handleSort("currentRank")}
                    active={sortBy === "currentRank"}
                    direction={sortBy === "currentRank" ? sortDir : "asc"}
                    sx={{ fontWeight: "bold" }}
                  >
                    Rank
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={getSortDirection("name")}>
                  <TableSortLabel
                    /* Player */ onClick={() => handleSort("name")}
                    active={sortBy === "name"}
                    direction={sortBy === "name" ? sortDir : "asc"}
                    sx={{ fontWeight: "bold" }}
                  >
                    Player
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={getSortDirection("eloChange")}>
                  <TableSortLabel
                    /* ELO +/- */ onClick={() => handleSort("eloChange")}
                    active={sortBy === "eloChange"}
                    direction={sortBy === "eloChange" ? sortDir : "desc"}
                    sx={{ fontWeight: "bold" }}
                  >
                    ELO +/-
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={getSortDirection("finalElo")}>
                  <TableSortLabel
                    /* Current ELO */ onClick={() => handleSort("finalElo")}
                    active={sortBy === "finalElo"}
                    direction={sortBy === "finalElo" ? sortDir : "desc"}
                    sx={{ fontWeight: "bold" }}
                  >
                    Final ELO
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={getSortDirection("winsChange")}>
                  <TableSortLabel
                    /* Session W */ onClick={() => handleSort("winsChange")}
                    active={sortBy === "winsChange"}
                    direction={sortBy === "winsChange" ? sortDir : "desc"}
                    sx={{ fontWeight: "bold" }}
                  >
                    W
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={getSortDirection("lossesChange")}>
                  <TableSortLabel
                    /* Session L */ onClick={() => handleSort("lossesChange")}
                    active={sortBy === "lossesChange"}
                    direction={sortBy === "lossesChange" ? sortDir : "asc"}
                    sx={{ fontWeight: "bold" }}
                  >
                    L
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={getSortDirection("sessionWinPercent")}
                >
                  <TableSortLabel
                    /* Session Win % */ onClick={() =>
                      handleSort("sessionWinPercent")
                    }
                    active={sortBy === "sessionWinPercent"}
                    direction={
                      sortBy === "sessionWinPercent" ? sortDir : "desc"
                    }
                    sx={{ fontWeight: "bold" }}
                  >
                    Win%
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((att) => (
                <TableRow
                  key={att.pt_id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  {/* Combined Rank Cell */}
                  <TableCell>
                    <Box
                      display="flex"
                      alignItems="center"
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
                  {/* Player Name Cell */}
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{ cursor: "pointer" }}
                    onClick={() => handlePlayerClick(att.pt_id)}
                  >
                    {att.player_name}
                  </TableCell>
                  {/* ELO Change */}
                  <TableCell>{renderEloChange(att.eloChange)}</TableCell>
                  {/* Final ELO */}
                  <TableCell>{att.session_elo_after ?? "-"}</TableCell>
                  {/* Session Wins */}
                  <TableCell>{att.winsChange}</TableCell>
                  {/* Session Losses */}
                  <TableCell>{att.lossesChange}</TableCell>
                  {/* Session Win % */}
                  <TableCell>
                    {renderWinPercent(att.sessionWinPercent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SessionStats;
