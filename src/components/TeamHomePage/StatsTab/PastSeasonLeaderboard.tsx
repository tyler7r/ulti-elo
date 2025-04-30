// /components/Leaderboard/PastSeasonLeaderboard.tsx (Adjust path)

import { getRank } from "@/lib/getRank"; // Adjust path
import { PlayerTeamSeasonStats, SeasonType } from "@/lib/types"; // Adjust path
import {
  Box,
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
import { useMemo, useState } from "react";

// Define sortable keys specifically for historical stats
type SortableKey =
  | "name"
  | "final_elo"
  | "season_wins"
  | "season_losses"
  | "season_win_percent"
  | "season_highest_elo"
  | "season_longest_win_streak";
type SortDirection = "asc" | "desc";

interface PastSeasonLeaderboardProps {
  seasonData: SeasonType; // Pass the season info
  leaderboardData: PlayerTeamSeasonStats[]; // Expecting archived stats
}

const PastSeasonLeaderboard = ({
  seasonData,
  leaderboardData,
}: PastSeasonLeaderboardProps) => {
  const [sortBy, setSortBy] = useState<SortableKey>("final_elo"); // Default sort by final ELO
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const router = useRouter();
  const theme = useTheme();

  const handleSort = (column: SortableKey) => {
    const isAsc = sortBy === column && sortDirection === "asc";
    // Default sort directions
    const defaultDirections: Record<SortableKey, SortDirection> = {
      name: "asc",
      final_elo: "desc",
      season_wins: "desc",
      season_losses: "asc",
      season_win_percent: "desc",
      season_highest_elo: "desc",
      season_longest_win_streak: "desc",
    };
    setSortDirection(
      sortBy === column ? (isAsc ? "desc" : "asc") : defaultDirections[column]
    );
    setSortBy(column);
  };

  const sortedData = useMemo(() => {
    return [...leaderboardData].sort((a, b) => {
      let compareA: string | number | null = null;
      let compareB: string | number | null = null;

      switch (sortBy) {
        case "name":
          compareA = a.player_teams.player.name ?? "";
          compareB = b.player_teams.player.name ?? "";
          break;
        case "final_elo":
          compareA = a.final_elo;
          compareB = b.final_elo;
          break;
        case "season_wins":
          compareA = a.season_wins;
          compareB = b.season_wins;
          break;
        case "season_losses":
          compareA = a.season_losses;
          compareB = b.season_losses;
          break;
        case "season_win_percent":
          compareA = a.season_win_percent ?? -1;
          compareB = b.season_win_percent ?? -1;
          break;
        case "season_highest_elo":
          compareA = a.season_highest_elo ?? 0;
          compareB = b.season_highest_elo ?? 0;
          break;
        case "season_longest_win_streak":
          compareA = a.season_longest_win_streak ?? 0;
          compareB = b.season_longest_win_streak ?? 0;
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
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [leaderboardData, sortBy, sortDirection]);

  const handlePlayerClick = (playerId: string | undefined) => {
    if (playerId) router.push(`/player/${playerId}`);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" sx={{ fontWeight: "bold" }}>
        Season {seasonData.season_no} Leaderboard
      </Typography>
      <Paper
        sx={{
          maxWidth: "100%",
          overflowX: "auto",
          width: "100%",
          WebkitOverflowScrolling: "touch",
          mt: 1,
        }}
      >
        <TableContainer
          component={Paper}
          sx={{ maxHeight: 750, width: "100%" }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  align="left"
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    fontWeight: "bold",
                  }}
                >
                  #
                </TableCell>
                <TableCell
                  align="left"
                  sx={{
                    position: "sticky",
                    left: 40,
                    zIndex: 2,
                    fontWeight: "bold",
                  }}
                >
                  <TableSortLabel
                    active={sortBy === "name"}
                    direction={sortBy === "name" ? sortDirection : "asc"}
                    onClick={() => handleSort("name")}
                  >
                    Player
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", zIndex: 1 }}>
                  <TableSortLabel
                    active={sortBy === "final_elo"}
                    direction={sortBy === "final_elo" ? sortDirection : "desc"}
                    onClick={() => handleSort("final_elo")}
                  >
                    Final ELO
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", zIndex: 1 }}>
                  <TableSortLabel
                    active={sortBy === "season_wins"}
                    direction={
                      sortBy === "season_wins" ? sortDirection : "desc"
                    }
                    onClick={() => handleSort("season_wins")}
                  >
                    Wins
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", zIndex: 1 }}>
                  <TableSortLabel
                    active={sortBy === "season_losses"}
                    direction={
                      sortBy === "season_losses" ? sortDirection : "asc"
                    }
                    onClick={() => handleSort("season_losses")}
                  >
                    Losses
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", zIndex: 1 }}>
                  <TableSortLabel
                    active={sortBy === "season_win_percent"}
                    direction={
                      sortBy === "season_win_percent" ? sortDirection : "desc"
                    }
                    onClick={() => handleSort("season_win_percent")}
                  >
                    Win%
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", zIndex: 1 }}>
                  <TableSortLabel
                    active={sortBy === "season_highest_elo"}
                    direction={
                      sortBy === "season_highest_elo" ? sortDirection : "desc"
                    }
                    onClick={() => handleSort("season_highest_elo")}
                  >
                    Peak ELO
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", zIndex: 1 }}>
                  <TableSortLabel
                    active={sortBy === "season_longest_win_streak"}
                    direction={
                      sortBy === "season_longest_win_streak"
                        ? sortDirection
                        : "desc"
                    }
                    onClick={() => handleSort("season_longest_win_streak")}
                  >
                    Best Streak
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((playerStat, index) => {
                const rank = getRank(playerStat.final_elo); // Use final ELO for rank icon
                const playerName = playerStat.player_teams.player.name;

                return (
                  <TableRow key={playerStat.pt_id}>
                    <TableCell
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        background: theme.palette.background.paper,

                        fontWeight: "bold",
                      }}
                    >
                      {index + 1}
                    </TableCell>
                    <TableCell
                      sx={{
                        position: "sticky",
                        left: 40,
                        zIndex: 1,
                        background: theme.palette.background.paper,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        whiteSpace: "nowrap",
                        overflow: "scroll",
                      }}
                      onClick={() => handlePlayerClick(playerStat.player_id)}
                    >
                      <Tooltip title={rank.name} placement="top">
                        <Box component="span">{rank.icon}</Box>
                      </Tooltip>
                      <Typography
                        variant="body2"
                        component="span"
                        noWrap
                        title={playerName}
                      >
                        {playerName}
                      </Typography>
                    </TableCell>
                    <TableCell>{playerStat.final_elo}</TableCell>
                    <TableCell>{playerStat.season_wins}</TableCell>
                    <TableCell>{playerStat.season_losses}</TableCell>
                    <TableCell>
                      {playerStat.season_win_percent?.toFixed(1) ?? "0.0"}%
                    </TableCell>
                    <TableCell>
                      {playerStat.season_highest_elo ?? "-"}
                    </TableCell>
                    <TableCell>
                      {playerStat.season_longest_win_streak ?? "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default PastSeasonLeaderboard;
