import { GameHistoryType } from "@/lib/types";
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

type IndividualPlayerStatsProps = {
  game: GameHistoryType;
  playerId?: string;
};

const IndividualPlayerStats = ({
  game,
  playerId,
}: IndividualPlayerStatsProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const headerBackgroundColor = isDarkMode ? "grey.700" : "grey.300";
  const rowBackgroundColor = isDarkMode ? "grey.900" : "grey.100";

  const playerInSquadA = game.squadA.players.find(
    (player) => player.player_id === playerId
  );
  const playerInSquadB = game.squadB.players.find(
    (player) => player.player_id === playerId
  );

  const player = playerInSquadA || playerInSquadB;
  const isWinner = () => {
    const squadAWon = game.squad_a_score > game.squad_b_score;
    if ((playerInSquadA && squadAWon) || (playerInSquadB && !squadAWon))
      return true;
    else return false;
  };

  const didPlayerWin = isWinner();

  if (!player) {
    return (
      <Typography variant="body2" fontWeight={"bold"}>
        Player stats not found for this game.
      </Typography>
    );
  }

  const eloChange = player.elo_after - player.elo_before;
  const eloChangeColor =
    eloChange > 0 ? theme.palette.success.main : theme.palette.error.main;

  return (
    <div className="mt-2 w-full">
      <Typography variant="subtitle2" fontWeight={"bold"} gutterBottom>
        {player.name}&rsquo;s Stats
      </Typography>
      <div className="overflow-x-auto rounded-sm">
        <Paper elevation={4}>
          <TableContainer
            component={Paper}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              cursor: "default",
            }}
          >
            <Table aria-label="individual player stats table" size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: headerBackgroundColor,
                  }}
                >
                  <TableCell sx={{ fontWeight: "bold" }} align="center">
                    W/L
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">
                    Before
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">
                    Impact
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">
                    ELO
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow
                  key={player.pt_id}
                  sx={{
                    backgroundColor: rowBackgroundColor,
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  <TableCell align="center">
                    {didPlayerWin ? (
                      <Typography color="success.main" fontWeight="bold">
                        W
                      </Typography>
                    ) : (
                      <Typography color="error.main" fontWeight="bold">
                        L
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">{player.elo_before}</TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: eloChangeColor,
                    }}
                  >
                    {eloChange > 0 ? `+${eloChange}` : eloChange}
                  </TableCell>
                  <TableCell align="center">{player.elo_after}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
    </div>
  );
};

export default IndividualPlayerStats;
