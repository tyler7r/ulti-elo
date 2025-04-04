import NoLogoAvatar from "@/components/Utils/NoLogoAvatar";
import { supabase } from "@/lib/supabase";
import { PlayerType } from "@/lib/types";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type TeamPlayer = {
  player_id: string;
  elo: number;
  player: {
    name: string;
  };
};

type TeamPlayersTabProps = {
  teamId: string;
  teamPlayers: TeamPlayer[];
  onPlayersUpdated: () => void;
  setSnackbarMessage: (message: string) => void;
  setSnackbarOpen: (open: boolean) => void;
};

const TeamPlayersTab = ({
  teamId,
  teamPlayers,
  onPlayersUpdated,
  setSnackbarMessage,
  setSnackbarOpen,
}: TeamPlayersTabProps) => {
  const [selectedPlayersToAdd, setSelectedPlayersToAdd] = useState<
    PlayerType[]
  >([]);
  const [availablePlayers, setAvailablePlayers] = useState<PlayerType[]>([]);
  const [loadingAvailablePlayers, setLoadingAvailablePlayers] = useState(true);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<TeamPlayer | null>(null);

  const fetchAvailablePlayers = useCallback(async () => {
    if (!teamId) return;
    setLoadingAvailablePlayers(true);
    const { data: allPlayersData, error: allPlayersError } = await supabase
      .from("players")
      .select("id, name");
    if (allPlayersError) {
      console.error("Error fetching all players:", allPlayersError.message);
      setSnackbarMessage(
        `Error fetching all players: ${allPlayersError.message}`
      );
      setSnackbarOpen(true);
    } else {
      const currentPlayersIds = teamPlayers.map((player) => player.player_id);
      const filteredPlayers = (allPlayersData || []).filter(
        (player) => !currentPlayersIds.includes(player.id)
      );
      setAvailablePlayers(filteredPlayers);
    }
    setLoadingAvailablePlayers(false);
  }, [teamId, teamPlayers, setSnackbarMessage, setSnackbarOpen]);

  useEffect(() => {
    fetchAvailablePlayers();
  }, [fetchAvailablePlayers]);

  const handleAddTeamPlayers = async () => {
    if (!teamId || selectedPlayersToAdd.length === 0) return;

    const playersToAdd = selectedPlayersToAdd.map((player) => ({
      team_id: teamId,
      player_id: player.id,
    }));

    const { error } = await supabase.from("player_teams").insert(playersToAdd);

    if (error) {
      console.error("Error adding team players:", error.message);
      setSnackbarMessage(`Error adding team players: ${error.message}`);
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage("Players added to team successfully!");
      setSnackbarOpen(true);
      setSelectedPlayersToAdd([]);
      onPlayersUpdated();
      fetchAvailablePlayers(); // Refresh available players
    }
  };

  const handleRemoveTeamPlayer = async (playerIdToRemove: string) => {
    if (!teamId || !playerIdToRemove) return;
    const { error } = await supabase
      .from("player_teams")
      .delete()
      .eq("team_id", teamId)
      .eq("player_id", playerIdToRemove);

    if (error) {
      console.error("Error removing team player:", error.message);
      setSnackbarMessage(`Error removing team player: ${error.message}`);
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage("Player removed from team successfully!");
      setSnackbarOpen(true);
      onPlayersUpdated();
      fetchAvailablePlayers(); // Refresh available players
    }
  };

  const handleRemoveButtonClick = (player: TeamPlayer) => {
    setPlayerToDelete(player);
    setConfirmDeleteDialogOpen(true);
  };

  const handleCloseConfirmDeleteDialog = () => {
    setConfirmDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (playerToDelete) {
      handleRemoveTeamPlayer(playerToDelete.player_id);
    }
    setConfirmDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  return (
    <Box mt={3}>
      <Typography variant="h6" fontWeight={"bold"} sx={{ marginBottom: -1 }}>
        Add New Players
      </Typography>
      <Autocomplete
        size="small"
        multiple
        id="add-team-players"
        options={availablePlayers}
        getOptionLabel={(option) => option.name}
        value={selectedPlayersToAdd}
        onChange={(_, newValue) => {
          setSelectedPlayersToAdd(newValue);
        }}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            {option.name}
          </li>
        )}
        loading={loadingAvailablePlayers}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Players to Add"
            placeholder="Search players"
            fullWidth
            margin="normal"
          />
        )}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleAddTeamPlayers}
        className="mt-2"
        disabled={selectedPlayersToAdd.length === 0}
      >
        Add Selected Players
      </Button>

      <Typography variant="h6" sx={{ marginTop: 2 }} fontWeight={"bold"}>
        Current Team Players ({teamPlayers.length})
      </Typography>
      <List dense>
        {teamPlayers.map((player) => (
          <ListItem key={player.player_id} sx={{ position: "relative" }}>
            <ListItemAvatar>
              <NoLogoAvatar size="small" name={player.player.name} />
            </ListItemAvatar>
            <ListItemText
              primary={player.player.name || "Unknown Player"}
              secondary={`ELO: ${player.elo}`}
            />
            <Box sx={{ position: "absolute", right: 16 }}>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleRemoveButtonClick(player)}
              >
                <PersonRemoveIcon color="error" />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <Dialog
        open={confirmDeleteDialogOpen}
        onClose={handleCloseConfirmDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" fontWeight={"bold"}>
          {"Confirm Delete"}
        </DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            {`Are you sure you want to remove ${
              playerToDelete ? `${playerToDelete.player.name}` : "this player."
            }`}
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            onClick={handleConfirmDelete}
            color="error"
            autoFocus
          >
            Delete
          </Button>
          <Button onClick={handleCloseConfirmDeleteDialog} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamPlayersTab;
