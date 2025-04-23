import { supabase } from "@/lib/supabase";
import { PlayerTeamType } from "@/lib/types";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
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

type CreateSquadProps = {
  teamId: string;
  onClose: () => void;
  openSquadModal: boolean;
  updateSquads: () => void;
};

const fetchAvailablePlayers = async (teamId: string) => {
  const query = supabase
    .from("player_teams")
    .select("*, player:players(name)")
    .eq("team_id", teamId);
  const { data: availablePlayers, error: availableError } = await query;

  if (availableError) {
    console.error("Error fetch available players:", availableError);
    return [];
  }
  return availablePlayers;
};

const CreateSquad = ({
  teamId,
  onClose,
  openSquadModal,
  updateSquads,
}: CreateSquadProps) => {
  const [players, setPlayers] = useState<PlayerTeamType[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerTeamType[]>([]);
  const [squadName, setSquadName] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const getPlayers = async () => {
      const ps = await fetchAvailablePlayers(teamId);
      setPlayers(ps);
    };
    if (teamId) getPlayers();
  }, [teamId]);

  const handlePlayerSelect = (newPlayers: PlayerTeamType[]) => {
    setSelectedPlayers(newPlayers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    if (selectedPlayers.length === 0) {
      setError("There must be at least 1 player on your squad!");
      setLoading(false);
      return;
    }

    try {
      const { data: squad, error } = await supabase
        .from("squads")
        .insert([{ name: squadName, team_id: teamId, session_id: "" }])
        .select("id")
        .single();

      if (error) throw error;

      const squadId = squad.id;
      const squadPlayers = [
        ...selectedPlayers.map((player) => ({
          pt_id: player.pt_id,
          squad_id: squadId,
        })),
      ];
      await supabase.from("squad_players").insert(squadPlayers);

      setSuccess(`${squadName} successfully created!`);
      const ps = await fetchAvailablePlayers(teamId);
      setPlayers(ps);
      setTimeout(() => {
        setLoading(false);
        setSquadName("");
        setSelectedPlayers([]);
        updateSquads();
      }, 500);
    } catch (error) {
      console.error("Error creating squad:", error);
    }
  };

  return (
    <Modal
      open={openSquadModal}
      onClose={onClose}
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
    >
      <Fade in={openSquadModal}>
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
                  Create New Squad
                </Typography>
              </div>
              <IconButton
                onClick={onClose}
                sx={{ position: "absolute", top: 10, right: 10 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

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
                sx={{ marginBottom: 2 }}
                slotProps={{
                  htmlInput: { maxLength: 20 },
                }}
              />
              <FormControl fullWidth>
                <Autocomplete
                  multiple
                  options={players.filter(
                    (player) =>
                      !selectedPlayers.some((p) => p.pt_id === player.pt_id)
                  )}
                  getOptionLabel={(option) => `${option.player.name}`} // Display only name
                  value={selectedPlayers}
                  onChange={(_, newValue) => handlePlayerSelect(newValue)}
                  isOptionEqualToValue={(option, value) =>
                    option.pt_id === value.pt_id
                  }
                  renderOption={(props, option) => (
                    <li {...props} key={option.pt_id}>
                      {option.player.name} (ELO: {option.elo})
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
              {(error || success) && (
                <Alert severity={error ? "error" : "success"}>
                  {error ? error : success}
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Squad"}
              </Button>
            </form>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default CreateSquad;
