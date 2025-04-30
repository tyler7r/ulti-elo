import { supabase } from "@/lib/supabase";
import { PlayerType, TeamType } from "@/lib/types";
import CloseIcon from "@mui/icons-material/Close";
import {
  Autocomplete,
  Backdrop,
  Box,
  Button,
  Fade,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface AddPlayersModalProps {
  open: boolean;
  onClose: () => void;
  team: TeamType;
  isAdmin: boolean;
  fetchAvailablePlayers: () => void;
  onPlayersUpdated: () => void;
  updateSnackbar: (message: string) => void;
  availablePlayers: PlayerType[];
  loadingAvailablePlayers: boolean;
}

const AddPlayersModal = ({
  open,
  onClose,
  team,
  isAdmin,
  fetchAvailablePlayers,
  onPlayersUpdated,
  updateSnackbar,
  availablePlayers,
  loadingAvailablePlayers,
}: AddPlayersModalProps) => {
  const [selectedPlayersToAdd, setSelectedPlayersToAdd] = useState<
    PlayerType[]
  >([]);

  const handleAddTeamPlayers = async () => {
    if (!team.id || selectedPlayersToAdd.length === 0 || !isAdmin) return;

    const playersToAdd = selectedPlayersToAdd.map((player) => ({
      team_id: team.id,
      player_id: player.id,
    }));

    const { error } = await supabase.from("player_teams").insert(playersToAdd);

    if (error) {
      console.error("Error adding team players:", error.message);
      updateSnackbar(`Error adding team players: ${error.message}`);
    } else {
      updateSnackbar("Players added to team successfully!");
      setSelectedPlayersToAdd([]);
      onPlayersUpdated();
      fetchAvailablePlayers(); // Refresh available players
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose} // Prevent closing while loading
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
      aria-labelledby="confirm-end-season-modal-title"
      aria-describedby="confirm-end-season-modal-description"
    >
      <Fade in={open}>
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
            size="small"
            sx={{ position: "absolute", top: 10, right: 10 }}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
          <Box display={"flex"} flexDirection={"column"}>
            <Typography variant="h6" fontWeight={"bold"} color="primary">
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
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 1,
                mt: 1,
              }}
            >
              <Button
                color="secondary"
                size="small"
                variant="outlined"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddTeamPlayers}
                disabled={selectedPlayersToAdd.length === 0}
                size="small"
              >
                Add Selected Players
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AddPlayersModal;
