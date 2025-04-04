import { SquadType } from "@/lib/types";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/router";
import { GamePlayersType } from "./GamePlayersContainer";

type GamePlayersProps = {
  squad: SquadType;
  players: GamePlayersType[];
  isSquadA: boolean;
  singleGame?: boolean;
};

const GamePlayers = ({
  squad,
  isSquadA,
  singleGame,
  players,
}: GamePlayersProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const headerBackgroundColor = isDarkMode ? "grey.700" : "grey.300";
  const rowBackgroundColor = isDarkMode ? "grey.900" : "grey.100";
  const rowHoverBackgroundColor = isDarkMode ? "grey.800" : "grey.200";
  const router = useRouter();

  if (players.length === 0) {
    return (
      <Typography variant="body2" fontWeight={"bold"}>
        No players found for {squad.name}
      </Typography>
    );
  }

  const handlePlayerClick = (playerId: string) => {
    void router.push(`/player/${playerId}`);
  };

  return (
    <div className="mt-4 w-full">
      <Typography
        color={isSquadA ? "primary" : "secondary"}
        variant={singleGame ? "h5" : "h6"}
        fontWeight={"bold"}
      >
        {singleGame ? `${squad.name} Players` : squad.name}
      </Typography>

      <div className="overflow-x-auto rounded-sm">
        <Paper elevation={8}>
          <TableContainer
            component={Paper}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              cursor: "default",
            }}
          >
            <Table aria-label="elo change table">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: headerBackgroundColor,
                  }}
                >
                  <TableCell
                    sx={{ fontWeight: "bold", padding: 1 }}
                    align="left"
                  >
                    Player
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", padding: 1 }}
                    align="center"
                  >
                    Before
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", padding: 1 }}
                    align="center"
                  >
                    Impact
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: "bold", padding: 1 }}
                    align="center"
                  >
                    ELO
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {players.map((player) => {
                  const eloChange = player.elo_after - player.elo_before;
                  const eloChangeColor =
                    eloChange > 0
                      ? theme.palette.success.main
                      : theme.palette.error.main;

                  return (
                    <TableRow
                      key={player.pt_id}
                      sx={{
                        backgroundColor: rowBackgroundColor,
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": { backgroundColor: rowHoverBackgroundColor },
                      }}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                        align="left"
                        sx={{ cursor: "pointer", padding: 1 }}
                        onClick={() => handlePlayerClick(player.player_id)}
                      >
                        {player.name}
                      </TableCell>
                      <TableCell align="center" sx={{ padding: 1 }}>
                        {player.elo_before}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: "bold",
                          color: eloChangeColor,
                          padding: 1,
                        }}
                      >
                        {eloChange > 0 ? `+${eloChange}` : eloChange}
                      </TableCell>
                      <TableCell align="center" sx={{ padding: 1 }}>
                        {player.elo_after}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
    </div>
  );
};

export default GamePlayers;
