import { PlayerHistoryType, SquadType } from "@/lib/types";
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

type GamePlayersProps = {
  squad: {
    info: SquadType;
    players: PlayerHistoryType[];
  };
  isSquadA: boolean;
  singleGame?: boolean;
};

const GamePlayers = ({ squad, isSquadA, singleGame }: GamePlayersProps) => {
  const { info, players } = squad;

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const headerBackgroundColor = isDarkMode ? "grey.700" : "grey.300";
  const rowBackgroundColor = isDarkMode ? "grey.900" : "grey.100";
  const rowHoverBackgroundColor = isDarkMode ? "grey.800" : "grey.200";

  if (players.length === 0) {
    return <p>No players found for {info.name}</p>;
  }

  return (
    <div className="mt-4 w-full">
      <Typography
        color={isSquadA ? "primary" : "secondary"}
        variant={singleGame ? "h5" : "h6"}
        fontWeight={"bold"}
      >
        {singleGame ? `${info.name} Players` : info.name}
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
                      key={player.id}
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
