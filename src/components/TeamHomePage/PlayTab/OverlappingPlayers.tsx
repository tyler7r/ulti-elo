import { supabase } from "@/lib/supabase";
import { AlertType, GameFormSquadType, Player } from "@/lib/types";
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
} from "@mui/material";

type OverlappingPlayersType = {
  squadA: GameFormSquadType;
  squadB: GameFormSquadType;
  setSquadA: (squadA: GameFormSquadType | null) => void;
  setSquadB: (squadB: GameFormSquadType | null) => void;
  setAlert: (alert: AlertType) => void;
  updateSquads: () => void;
  overlappingPlayers: Player[];
};

const OverlappingPlayers = ({
  squadA,
  squadB,
  setSquadA,
  setSquadB,
  setAlert,
  updateSquads,
  overlappingPlayers,
}: OverlappingPlayersType) => {
  const handleRemoveOverlap = async (player: Player, squadId: string) => {
    if (squadA && squadA.id === squadId) {
      setSquadA({
        ...squadA,
        players: squadA.players.filter((p) => p.pt_id !== player.pt_id),
      });
    }
    if (squadB && squadB.id === squadId) {
      setSquadB({
        ...squadB,
        players: squadB.players.filter((p) => p.pt_id !== player.pt_id),
      });
    }

    try {
      const { error } = await supabase
        .from("squad_players")
        .update({ active: false })
        .eq("pt_id", player.pt_id)
        .eq("squad_id", squadId);
      if (error) {
        setAlert({ message: error.message, severity: "error" });
      } else {
        setAlert({
          message: `${player.name} was removed from ${
            squadId === squadA?.id ? squadA.name : squadB?.name
          }!`,
          severity: "success",
        });
        updateSquads();
      }
    } catch (error) {
      console.error(error);
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
      <Alert severity="error">Overlapping Players:</Alert>
      <TableContainer
        component={Paper}
        sx={{ overflow: "scroll", maxHeight: 300 }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Player</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>{squadA.name}</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>{squadB.name}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {overlappingPlayers.map((player) => (
              <TableRow key={player.pt_id}>
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

export default OverlappingPlayers;
