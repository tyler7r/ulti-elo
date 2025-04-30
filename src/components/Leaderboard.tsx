import { getRank } from "@/lib/getRank";
import { supabase } from "@/lib/supabase";
import { NewPlayerType } from "@/lib/types";
import { ArrowForward } from "@mui/icons-material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Modal,
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
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import HotPlayers from "./HotPlayers";

interface LeaderboardProps {
  teamId?: string;
}

const rankInfo = [
  { name: "Recruit", icon: "👶", elo: "Below 800" },
  { name: "Competitor", icon: "🛡️", elo: "800 - 1199" },
  { name: "Elite", icon: "⚔️", elo: "1200 - 1399" },
  { name: "Platinum", icon: "🌟", elo: "1400 - 1599" },
  { name: "Diamond", icon: "💎", elo: "1600 - 1799" },
  { name: "Master", icon: "🏆", elo: "1800 - 1999" },
  { name: "Legend", icon: "⚡", elo: "2000 - 2199" },
  { name: "Apex", icon: "👑", elo: "2200+" },
];

const Leaderboard = ({ teamId }: LeaderboardProps) => {
  const [players, setPlayers] = useState<NewPlayerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof NewPlayerType>("elo");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [teamName, setTeamName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [hotPlayers, setHotPlayers] = useState<NewPlayerType[]>([]);
  const router = useRouter();

  const theme = useTheme();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (teamId) {
        const { data, error } = await supabase
          .from("player_teams")
          .select(
            `*, players!inner(name)
        `
          )
          .eq("team_id", teamId)
          .or(`losses.gt.0, wins.gt.0`)
          .order(sortBy, { ascending: sortDirection === "asc" }); // Then by the selected sort

        const { data: teamNm } = await supabase
          .from("teams")
          .select("name")
          .eq("id", teamId)
          .single();
        if (teamNm) setTeamName(teamNm.name);

        if (error) {
          console.error("Error fetching players", error);
        } else {
          const formattedPlayers = data.map((p) => ({
            name: p.players.name,
            ...p,
          }));
          setPlayers(formattedPlayers || []);
          // Extract hot players (top 3 by win streak)
          const sortedByStreak = [...formattedPlayers].sort(
            (a, b) => b.win_streak - a.win_streak
          );
          setHotPlayers(sortedByStreak.slice(0, 3));
        }
      } else {
        const { data, error } = await supabase
          .from("player_teams")
          .select(
            `*, teams!inner(logo_url, id, name), players!inner(name)
        `
          )
          .or("wins.gt.0, losses.gt.0")
          .order(sortBy, { ascending: sortDirection === "asc" }); // Then by the selected sort

        if (error) {
          console.error("Error fetching players:", error);
        } else {
          const formattedData = data.map((p) => ({
            name: p.players.name,
            ...p,
          }));
          setPlayers(formattedData || []);
          // Extract hot players (top 3 by win streak)
          const sortedByStreak = [...formattedData].sort(
            (a, b) => b.win_streak - a.win_streak
          );
          setHotPlayers(sortedByStreak.slice(0, 3));
        }
      }
      setLoading(false);
    };

    fetchPlayers();
  }, [sortBy, sortDirection, teamId]);

  const handleSort = (column: keyof NewPlayerType) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  const handlePlayerClick = (playerId: string) => {
    void router.push(`/player/${playerId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <Box
      sx={{
        overflowX: "auto",
        px: 1,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        width: "100%",
      }}
    >
      {hotPlayers.length > 0 && <HotPlayers hotPlayers={hotPlayers} />}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          {teamName ? `${teamName} Leaderboard` : "Global Leaderboard"}
        </Typography>
        <IconButton aria-label="rank-info" onClick={handleOpen}>
          <InfoOutlinedIcon />
        </IconButton>
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="rank-info-modal-title"
        aria-describedby="rank-info-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: 600,
            maxHeight: "80vh",
            overflow: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            width: { xs: "90%", md: "500px" }, // Similar width
            p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
            borderRadius: 2,
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{ position: "absolute", top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            id="rank-info-modal-title"
            variant="h5"
            component="h2"
            fontWeight={"bold"}
            color="primary"
          >
            Rank Information
          </Typography>
          <List dense>
            {rankInfo.map((rank) => (
              <ListItem key={rank.name}>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      component="div"
                      fontWeight={"bold"}
                    >
                      {rank.icon} {rank.name}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="span"
                        sx={{ ml: 1 }}
                      >
                        ELO: {rank.elo}
                      </Typography>
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Modal>

      {players.length > 0 ? (
        <Paper
          sx={{
            maxWidth: "100%",
            overflowX: "auto",
            width: "100%",
            WebkitOverflowScrolling: "touch",
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
                      direction={sortDirection}
                      onClick={() => handleSort("name")}
                    >
                      Player
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
                    <TableRow
                      key={player.pt_id + player.team_id}
                      sx={{ cursor: "default" }}
                    >
                      {/* Rank Column */}
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

                      {/* Player Column with Truncated Name */}
                      <TableCell
                        sx={{
                          position: "sticky",
                          left: 40,
                          zIndex: 1,
                          background: theme.palette.background.paper,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          whiteSpace: "nowrap",
                          overflow: "scroll",
                          textOverflow: "ellipsis",
                          cursor: "pointer",
                        }}
                        onClick={() => handlePlayerClick(player.player_id)}
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
                              <ArrowDropUpIcon
                                color="success"
                                fontSize="small"
                              />
                            ) : player.elo_change < 0 ? (
                              <ArrowDropDownIcon
                                color="error"
                                fontSize="small"
                              />
                            ) : (
                              <ArrowRightIcon
                                color="disabled"
                                fontSize="small"
                              />
                            )}
                            <Typography
                              variant="body2"
                              fontWeight={"bold"}
                              color={
                                player.elo_change > 0
                                  ? "success"
                                  : player.elo_change < 0
                                  ? "error"
                                  : "textDisabled"
                              }
                            >
                              {player.elo_change < 0
                                ? player.elo_change * -1
                                : player.elo_change}
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
      ) : (
        <Box
          px={1}
          display={"flex"}
          flexDirection={"column"}
          gap={1}
          justifyContent={"flex-start"}
        >
          <Typography fontWeight={"bold"} color={"textSecondary"}>
            No players have competed in a game during this season!
          </Typography>
          {teamId && (
            <Button
              sx={{ alignSelf: "flex-start" }}
              endIcon={<ArrowForward fontSize="small" />}
              // variant="outlined"
              onClick={() => void router.push(`/team/${teamId}?tab=sessions`)}
            >
              Go to Sessions
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Leaderboard;
