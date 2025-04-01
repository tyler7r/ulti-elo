import { supabase } from "@/lib/supabase";
import { PlayerSelectType } from "@/lib/types";
import CloseIcon from "@mui/icons-material/Close";
import {
  Autocomplete,
  Backdrop,
  Box,
  Button,
  Fade,
  FormControl,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

type EditSquadProps = {
  squadId: string;
  teamId: string;
  onClose: () => void;
  openEditSquadModal: boolean;
  updateSquads: () => void;
};

const fetchAvailablePlayers = async (teamId: string) => {
  const query = supabase
    .from("player_teams")
    .select("player_id, players(*)")
    .eq("team_id", teamId);

  const { data: availablePlayers, error: availableError } = await query;

  if (availableError) {
    console.error("Error fetching available players:", availableError);
    return [];
  }
  return availablePlayers;
};

const EditSquad = ({
  squadId,
  teamId,
  onClose,
  openEditSquadModal,
  updateSquads,
}: EditSquadProps) => {
  const [players, setPlayers] = useState<PlayerSelectType[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerSelectType[]>(
    []
  );
  const [initialPlayers, setInitialPlayers] = useState<PlayerSelectType[]>([]);
  const [squadName, setSquadName] = useState("");
  const [initialSquadName, setInitialSquadName] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);

  useEffect(() => {
    const getPlayers = async () => {
      const ps = await fetchAvailablePlayers(teamId);
      setPlayers(ps);

      // Fetch existing squad details
      const { data: squadData, error: squadError } = await supabase
        .from("squads")
        .select("name")
        .eq("id", squadId)
        .single();
      if (squadError) {
        console.error("Error fetching squad:", squadError);
        return;
      }

      setSquadName(squadData.name || "");
      setInitialSquadName(squadData.name || "");

      // Fetch players associated with the squad
      const { data: squadPlayers, error: squadPlayersError } = await supabase
        .from("squad_players")
        .select("player_id, players!inner(*)")
        .eq("squad_id", squadId)
        .eq("active", true);
      if (squadPlayersError) {
        console.error("Error fetching squad players:", squadPlayersError);
        return;
      }

      // Set the selected players
      setInitialPlayers(squadPlayers);
      setSelectedPlayers(squadPlayers);
    };

    if (teamId && squadId) {
      getPlayers();
    }
  }, [teamId, squadId]);

  useEffect(() => {
    const initialPlayerIDs = JSON.stringify(
      initialPlayers.map((p) => p.player_id)
    );
    const selectedPlayerIDs = JSON.stringify(
      selectedPlayers.map((p) => p.player_id)
    );
    const sameSquadPlayers = initialPlayerIDs === selectedPlayerIDs;
    const sameSquadName = initialSquadName === squadName;

    if ((sameSquadPlayers && sameSquadName) || loading) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [loading, initialPlayers, initialSquadName, squadName, selectedPlayers]);

  const handlePlayerSelect = (newPlayers: PlayerSelectType[]) => {
    setSelectedPlayers(newPlayers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Update squad details (name)
      const { error: updateError } = await supabase
        .from("squads")
        .update({ name: squadName })
        .eq("id", squadId);

      if (updateError) throw updateError;

      // Identify players to add, keep, and remove
      const currentPlayerIds = initialPlayers.map((p) => p.player_id);
      const newPlayerIds = selectedPlayers.map((p) => p.player_id);

      const playersToAdd = selectedPlayers.filter(
        (p) => !currentPlayerIds.includes(p.player_id)
      );
      const playersToRemove = initialPlayers.filter(
        (p) => !newPlayerIds.includes(p.player_id)
      );

      // 🟢 Add new players with first and last game numbers
      if (playersToAdd.length > 0) {
        const newSquadPlayers = playersToAdd.map((player) => ({
          player_id: player.player_id,
          squad_id: squadId,
          active: true,
        }));

        const { error: addError } = await supabase
          .from("squad_players")
          .upsert(newSquadPlayers);

        if (addError) throw addError;
      }

      // 🔴 Remove players by updating their last_game number
      if (playersToRemove.length > 0) {
        for (const player of playersToRemove) {
          const { error: removeError } = await supabase
            .from("squad_players")
            .update({ active: false })
            .eq("squad_id", squadId)
            .eq("player_id", player.player_id);

          if (removeError) throw removeError;
        }
      }

      setSuccess(`${squadName} successfully updated!`);
      setLoading(false);
      updateSquads();
    } catch (error) {
      console.error("Error updating squad:", error);
      setError("An error occurred while updating the squad.");
      setLoading(false);
    }
  };

  const handleRetireSquad = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("squads")
        .update({ active: false })
        .eq("id", squadId);

      if (error) throw error;

      setSuccess("Squad retired successfully!");
      setLoading(false);
      updateSquads();
    } catch (error) {
      console.error("Error retiring squad:", error);
      setError("An error occurred while retiring the squad.");
      setLoading(false);
    }
  };

  return (
    <Modal
      open={openEditSquadModal}
      onClose={onClose}
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
    >
      <Fade in={openEditSquadModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", md: "500px" },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            overflow: "scroll",
            maxHeight: "80vh",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="flex flex-col w-full">
                <Typography variant="h5" color="primary" fontWeight={"bold"}>
                  Edit Squad
                </Typography>
              </div>
              <IconButton
                onClick={onClose}
                sx={{ position: "absolute", top: 10, right: 10 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {error && (
              <Typography
                variant="overline"
                sx={{ fontWeight: "bold" }}
                color="error"
              >
                {error}
              </Typography>
            )}
            {success && (
              <Typography
                variant="overline"
                sx={{ fontWeight: "bold" }}
                color="success"
              >
                {success}
              </Typography>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4 flex flex-col gap-2"
            >
              <TextField
                type="text"
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                placeholder="Squad Name"
                label="Squad Name"
                variant="outlined"
                fullWidth
                required
                slotProps={{
                  htmlInput: { maxLength: 20 },
                }}
              />
              <FormControl fullWidth sx={{ marginTop: 1 }}>
                <Autocomplete
                  multiple
                  options={players.filter(
                    (player) =>
                      !selectedPlayers.some(
                        (p) => p.player_id === player.player_id
                      )
                  )}
                  getOptionLabel={(option) => `${option.players.name}`} // Display only name
                  value={selectedPlayers}
                  onChange={(_, newValue) => handlePlayerSelect(newValue)}
                  isOptionEqualToValue={(option, value) =>
                    option.player_id === value.player_id
                  }
                  renderOption={(props, option) => (
                    <li {...props} key={option.player_id}>
                      {option.players.name} (ELO: {option.players.elo})
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`Select Players for ${
                        squadName === "" ? "Your Squad" : `${squadName}`
                      }`}
                      placeholder="Choose players"
                    />
                  )}
                />
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={disabled}
              >
                {loading ? "Saving..." : "Save Squad"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleRetireSquad}
                disabled={loading}
              >
                {loading ? "Retiring..." : "Retire Squad"}
              </Button>
            </form>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default EditSquad;
