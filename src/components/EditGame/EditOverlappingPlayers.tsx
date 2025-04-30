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
      setSquadAPlayers(squadAPlayers.filter((p) => p.pt_id !== player.pt_id));
      setAlert({
        message: `${player.name} was removed from ${squadA.name}`,
        severity: "success",
      });
    }
    if (squadB && squadB.id === squadId) {
      setSquadBPlayers(squadBPlayers.filter((p) => p.pt_id !== player.pt_id));
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
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: headerBackgroundColor,
                  fontWeight: "bold",
                }}
              >
                Player
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: headerBackgroundColor,
                  fontWeight: "bold",
                }}
                align="center"
              >
                <Box
                  height={20}
                  width={20}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                  }}
                />
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: headerBackgroundColor,
                  fontWeight: "bold",
                }}
                align="center"
              >
                <Box
                  height={20}
                  width={20}
                  sx={{ backgroundColor: theme.palette.secondary.main }}
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {overlappingPlayers.map((player) => (
              <TableRow
                key={player.pt_id}
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
