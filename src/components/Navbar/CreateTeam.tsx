import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AlertType, PlayerType } from "@/lib/types";
import { startNewSeason } from "@/pages/api/start-season";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete"; // Import the delete icon
import {
  Alert,
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
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

type CreateTeamProps = {
  onClose: () => void;
  openTeamModal: boolean;
};

const CreateTeam = ({ onClose, openTeamModal }: CreateTeamProps) => {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [players, setPlayers] = useState<PlayerType[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPlayers, setFetchingPlayers] = useState(true);
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch teams from Supabase
  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from("players").select(`name, id`);
      if (error) console.error("Error fetching players:", error);
      else {
        setPlayers(data);
      }
      setFetchingPlayers(false);
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (!openTeamModal) {
      setName("");
      setLogoFile(null);
      setLogoPreviewUrl(null);
      setSelectedPlayers([]);
    }
  }, [openTeamModal]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreviewUrl(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreviewUrl(null);
  };

  const uploadLogo = async (
    file: File,
    teamId: string
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `team-logos/${teamId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("team-logos") // Replace with your bucket name
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading logo:", uploadError);
        setAlert({
          message: `Error uploading logo: ${uploadError.message}`,
          severity: "error",
        });
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from("team-logos") // Replace with your bucket name
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Error during logo upload:", err);
      setAlert({
        message: "An unexpected error occurred during logo upload.",
        severity: "error",
      });
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ message: null, severity: "error" });

    if (!user) {
      setAlert({
        message: "You must be signed in to create a team!",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    // Insert new team
    try {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert([{ name, owner_id: user.id }])
        .select()
        .single();

      if (teamError) {
        setAlert({
          message: `Error creating team: ${teamError.message}`,
          severity: "error",
        });
        setLoading(false);
        return;
      }

      const teamId = team.id;
      let logoUrl: string | null = null;

      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, teamId);
        if (!logoUrl) {
          setLoading(false);
          return; // Stop if logo upload fails
        }
      }

      // Update team with logo URL if uploaded
      const { error: updateTeamError } = await supabase
        .from("teams")
        .update({ logo_url: logoUrl })
        .eq("id", teamId);

      if (updateTeamError) {
        console.error("Error updating team with logo URL:", updateTeamError);
        setAlert({
          message: `Error updating team with logo: ${updateTeamError.message}`,
          severity: "error",
        });
        setLoading(false);
        return;
      }

      const { error: teamAdminError } = await supabase
        .from("team_admins")
        .insert([{ is_owner: true, team_id: teamId, user_id: user.id }]);

      if (teamAdminError) {
        setAlert({
          message: `Error creating team admin account: ${teamAdminError.message}`,
          severity: "error",
        });
        setLoading(false);
        return;
      }

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
          setAlert({
            message: `Error assigning players: ${playerTeamsError.message}.`,
            severity: "error",
          });
          setLoading(false);
          return;
        }
      }

      await startNewSeason(team.id);

      setName("");
      setSelectedPlayers([]);
      setLogoFile(null);
      setLogoPreviewUrl(null);
      setAlert({ message: "Team successfully created!", severity: "success" });
      setTimeout(() => {
        onClose();
        void router.push(`/team/${teamId}`);
      }, 500);
    } catch (err) {
      console.error("Unexpected error:", err);
      setAlert({ message: "An unexpected error occurred.", severity: "error" });
    } finally {
      setLoading(false);
    }
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h5" color="primary" fontWeight={"bold"}>
                Create New Team
              </Typography>
              <IconButton
                onClick={onClose}
                sx={{ position: "absolute", top: 10, right: 10 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {alert.message && (
              <Alert severity={alert.severity}>{alert.message}</Alert>
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
                sx={{ marginBottom: "8px" }}
              />

              {/* Multi-Select Dropdown for Players */}
              <Autocomplete
                multiple
                options={players.filter(
                  (player) => !selectedPlayers.some((p) => p.id === player.id)
                )}
                getOptionLabel={(option) => option.name}
                value={selectedPlayers}
                onChange={(_, newValue) => setSelectedPlayers(newValue)}
                loading={fetchingPlayers}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.name}
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

              {/* Logo Upload */}
              <Typography fontWeight={"bold"} variant="subtitle1">
                Team Logo (Optional)
              </Typography>
              <Box display="flex" alignItems="center" gap={2} className="mb-2">
                <Button
                  variant="outlined"
                  component="span"
                  onClick={handleButtonClick}
                  startIcon={<CloudUploadIcon />}
                >
                  Choose File
                </Button>
                <Typography variant="body2" color="textSecondary">
                  {logoFile ? logoFile.name : "No file chosen"}
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />
                {logoPreviewUrl && (
                  <IconButton
                    onClick={handleRemoveLogo}
                    size="small"
                    aria-label="remove logo"
                  >
                    <DeleteIcon color="error" />
                  </IconButton>
                )}
              </Box>
              {logoPreviewUrl && (
                <Box
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "none",
                  }}
                >
                  <Image
                    src={logoPreviewUrl}
                    alt="Logo Preview"
                    width={100}
                    height={100}
                    objectFit="cover"
                  />
                </Box>
              )}

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
