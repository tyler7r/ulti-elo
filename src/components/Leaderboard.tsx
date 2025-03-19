import { supabase } from "@/lib/supabase";
import { PlayerType } from "@/lib/types";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

interface LeaderboardProps {
  teamId?: string;
}

// Function to determine player rank based on Elo
const getRank = (elo: number) => {
  if (elo >= 2400) return { icon: "🔥", name: "Legend" };
  if (elo >= 2000) return { icon: "⚡", name: "Master" };
  if (elo >= 1600) return { icon: "🛡️", name: "Diamond" };
  if (elo >= 1200) return { icon: "🏅", name: "Gold" };
  if (elo >= 800) return { icon: "🥈", name: "Silver" };
  return { icon: "🥉", name: "Bronze" };
};

const Leaderboard = ({ teamId }: LeaderboardProps) => {
  const [players, setPlayers] = useState<PlayerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof PlayerType>("elo");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [teamName, setTeamName] = useState<string | null>(null);

  const theme = useTheme();

  useEffect(() => {
    const fetchPlayers = async () => {
      let query = supabase
        .from("player_teams")
        .select(
          `team_id, players!inner(*)
        `
        )
        .order(`players(${sortBy})`, { ascending: sortDirection === "asc" });

      // If teamId is provided, filter by team
      if (teamId) {
        query = query.eq("team_id", teamId);
        const { data: teamNm } = await supabase
          .from("teams")
          .select("name")
          .eq("id", teamId)
          .single();
        if (teamNm) setTeamName(teamNm.name);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching players:", error);
      } else {
        const formattedPlayers = data.map((p) => p.players);
        setPlayers(formattedPlayers || []);
      }
      setLoading(false);
    };

    fetchPlayers();
  }, [sortBy, sortDirection, teamId]);

  const handleSort = (column: keyof PlayerType) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-4">
      {teamName ? (
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", textAlign: "center" }}
        >
          {teamName} Leaderboard
        </Typography>
      ) : (
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          Global Leaderboard
        </Typography>
      )}
      <Typography variant="caption" color="secondary" fontWeight="bold">
        Note: Think of your first 10-15 games as placement games. Your ELO will
        probably be shifting around a lot during these games. As the algorithm
        stabilizes, the change in ELO will not be as dramatic. Scroll Right for
        more Stats.
      </Typography>
      <Paper sx={{ width: "100%", overflow: "hidden", marginTop: 2 }}>
        <TableContainer
          component={Paper}
          className="max-w-full"
          sx={{ maxHeight: 750 }}
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
                    minWidth: 60,
                    fontWeight: "bold",
                  }}
                >
                  Rank
                </TableCell>
                <TableCell
                  align="left"
                  sx={{
                    position: "sticky",
                    left: 60,
                    zIndex: 2,
                    minWidth: "200px",
                    fontWeight: "bold",
                  }}
                >
                  <TableSortLabel
                    active={sortBy === "name"}
                    direction={sortDirection}
                    onClick={() => handleSort("name")}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{
                    zIndex: 1,
                    fontWeight: "bold",
                  }}
                >
                  <TableSortLabel
                    active={sortBy === "elo"}
                    direction={sortDirection}
                    onClick={() => handleSort("elo")}
                  >
                    Elo
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{
                    zIndex: 1,
                    fontWeight: "bold",
                  }}
                >
                  <TableSortLabel
                    active={sortBy === "wins"}
                    direction={sortDirection}
                    onClick={() => handleSort("wins")}
                  >
                    Wins
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{
                    zIndex: 1,
                    fontWeight: "bold",
                  }}
                >
                  <TableSortLabel
                    active={sortBy === "losses"}
                    direction={sortDirection}
                    onClick={() => handleSort("losses")}
                  >
                    Losses
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{
                    zIndex: 1,
                    fontWeight: "bold",
                  }}
                >
                  <TableSortLabel
                    active={sortBy === "win_percent"}
                    direction={sortDirection}
                    onClick={() => handleSort("win_percent")}
                  >
                    Win%
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{
                    zIndex: 1,
                    fontWeight: "bold",
                  }}
                >
                  Streak
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {players.map((player, index) => {
                const rank = getRank(player.elo);

                return (
                  <TableRow key={player.id}>
                    {/* Rank Column */}
                    <TableCell
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        background: theme.palette.background.paper,
                        fontWeight: "bold",
                        height: 60,
                        minWidth: 60,
                      }}
                    >
                      {index + 1}
                    </TableCell>

                    {/* Player Column with Truncated Name */}
                    <TableCell
                      sx={{
                        position: "sticky",
                        height: 60,
                        left: 60,
                        zIndex: 1,
                        background: theme.palette.background.paper,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        minWidth: 200,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <span>{rank.icon}</span>
                      <span>{player.name}</span>
                    </TableCell>

                    {/* Elo Column */}
                    <TableCell>
                      <div className="flex gap-1 items-center">
                        <Typography variant="body2">{player.elo}</Typography>
                        <div className={`flex items-center`}>
                          {player.elo_change > 0 ? (
                            <ArrowDropUpIcon color="success" />
                          ) : player.elo_change < 0 ? (
                            <ArrowDropDownIcon color="error" />
                          ) : (
                            <ArrowRightIcon color="disabled" />
                          )}
                          <Typography
                            variant="body2"
                            color={
                              player.elo_change > 0
                                ? "success"
                                : player.elo_change < 0
                                ? "error"
                                : "textDisabled"
                            }
                          >
                            {player.elo_change}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>

                    {/* Wins */}
                    <TableCell>{player.wins}</TableCell>

                    {/* Losses */}
                    <TableCell>{player.losses}</TableCell>

                    {/* Win Percent */}
                    <TableCell>{player.win_percent}%</TableCell>

                    {/* Streak */}
                    <TableCell>
                      {player.win_streak > 0 ? (
                        <span className="text-green-500">
                          W{player.win_streak}
                        </span>
                      ) : (
                        <span className="text-red-500">
                          L{player.loss_streak}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default Leaderboard;
