import { AlertType, GamePlayerWithPlayer, Player, Squad } from "@/lib/types";
import {
  Alert,
  Box,
  Button,
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

type EditOverlappingPlayersType = {
  squadA: Squad;
  squadB: Squad;
  setAlert: (alert: AlertType) => void;
  squadAPlayers: GamePlayerWithPlayer[];
  squadBPlayers: GamePlayerWithPlayer[];
  setSquadAPlayers: (squadAPlayers: GamePlayerWithPlayer[]) => void;
  setSquadBPlayers: (squadBPlayers: GamePlayerWithPlayer[]) => void;
  overlappingPlayers: Player[];
};

const EditOverlappingPlayers = ({
  squadA,
  squadB,
  setAlert,
  squadAPlayers,
  squadBPlayers,
  setSquadAPlayers,
  setSquadBPlayers,
  overlappingPlayers,
}: EditOverlappingPlayersType) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const headerBackgroundColor = isDarkMode ? "grey.700" : "grey.300";
  const rowBackgroundColor = isDarkMode ? "grey.900" : "grey.100";

  const handleRemoveOverlap = async (player: Player, squadId: string) => {
    if (squadA && squadA.id === squadId) {
      setSquadAPlayers(squadAPlayers.filter((p) => p.id !== player.id));
      setAlert({
        message: `${player.name} was removed from ${squadA.name}`,
        severity: "success",
      });
    }
    if (squadB && squadB.id === squadId) {
      setSquadBPlayers(squadBPlayers.filter((p) => p.id !== player.id));
      setAlert({
        message: `${player.name} was removed from ${squadA.name}`,
        severity: "success",
      });
    }
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        mt: 2,
        mb: 2,
      }}
    >
      <Alert severity="error">Overlapping Players</Alert>
      <TableContainer
        component={Paper}
        elevation={8}
        sx={{
          overflow: "scroll",
          maxHeight: 300,
          border: `1px solid ${theme.palette.divider}`,
          cursor: "default",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: headerBackgroundColor,
                  fontWeight: "bold",
                  padding: 1,
                }}
              >
                Player
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: headerBackgroundColor,
                  fontWeight: "bold",
                  padding: 1,
                }}
              >
                <div className="flex w-full items-center gap-2">
                  <Box
                    height={20}
                    width={20}
                    sx={{ backgroundColor: theme.palette.primary.main }}
                  />
                  <Typography fontWeight={"bold"} variant="body1">
                    {squadA.name}
                  </Typography>
                </div>
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: headerBackgroundColor,
                  fontWeight: "bold",
                  padding: 1,
                }}
              >
                <div className="flex w-full items-center gap-2">
                  <Box
                    height={20}
                    width={20}
                    sx={{ backgroundColor: theme.palette.secondary.main }}
                  />
                  <Typography fontWeight={"bold"} variant="body1">
                    {squadB.name}
                  </Typography>
                </div>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {overlappingPlayers.map((player) => (
              <TableRow
                key={player.id}
                sx={{
                  backgroundColor: rowBackgroundColor,
                  "&:last-child td, &:last-child th": { border: 0 },
                }}
              >
                <TableCell sx={{ fontWeight: "bold" }}>
                  {player.elo
                    ? `${player.name} (ELO: ${player.elo})`
                    : player.name}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveOverlap(player, squadA.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveOverlap(player, squadB.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EditOverlappingPlayers;
