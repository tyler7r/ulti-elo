import { supabase } from "@/lib/supabase";
import { PlayerType } from "@/lib/types";
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
import { useEffect, useState } from "react";

type CreateTeamProps = {
  onClose: () => void;
  openTeamModal: boolean;
};

const CreateTeam = ({ onClose, openTeamModal }: CreateTeamProps) => {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<PlayerType[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPlayers, setFetchingPlayers] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<boolean>(false);

  // Fetch teams from Supabase
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from("players").select("*");
      if (error) console.error("Error fetching players:", error);
      else setPlayers(data);
      setFetchingPlayers(false);
    };
    fetchPlayers();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Insert new player
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert([{ name }])
      .select()
      .single();

    if (teamError) {
      setError("Error creating player.");
      console.error(teamError);
      setLoading(false);
      return;
    }

    const teamId = team.id;

    // Insert player-team relationships if teams were selected
    if (selectedPlayers.length > 0) {
      const playerTeams = selectedPlayers.map((p) => ({
        player_id: p.id,
        team_id: teamId,
      }));

      const { error: playerTeamsError } = await supabase
        .from("player_teams")
        .insert(playerTeams);

      if (playerTeamsError) {
        setError("Error assigning players.");
        console.error(playerTeamsError);
        setLoading(false);
        return;
      }
    }

    setName("");
    setSelectedPlayers([]);
    setSuccess(true);
    setLoading(false);
  };

  return (
    <Modal
      open={openTeamModal}
      onClose={onClose}
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
    >
      <Fade in={openTeamModal}>
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
              <Typography variant="h5" color="primary">
                Create New Team
              </Typography>
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
                Team created successfully!
              </Typography>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4 flex flex-col gap-2"
            >
              {/* Team Name Input */}
              <TextField
                fullWidth
                label="Team Name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {/* Multi-Select Dropdown for Players */}
              <Autocomplete
                multiple
                options={players}
                getOptionLabel={(option) => option.name}
                value={selectedPlayers}
                onChange={(_, newValue) => setSelectedPlayers(newValue)}
                loading={fetchingPlayers}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name} (Elo: {option.elo})
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Players"
                    placeholder="Choose players"
                  />
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Team"}
              </Button>
            </form>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default CreateTeam;
