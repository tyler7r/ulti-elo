import { supabase } from "@/lib/supabase";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";

interface Team {
  id: string;
  name: string;
  //   logo_url: string | null;
}

interface TeamSettingsTabProps {
  team: Team | null;
  onTeamUpdated: () => void;
  setSnackbarMessage: (message: string) => void;
  setSnackbarOpen: (open: boolean) => void;
}

const TeamSettingsTab = ({
  team,
  onTeamUpdated,
  setSnackbarMessage,
  setSnackbarOpen,
}: TeamSettingsTabProps) => {
  const [teamName, setTeamName] = useState(team?.name || "");

  const handleUpdateTeamName = async () => {
    if (!team?.id || !teamName || teamName === team.name) return;
    const { error } = await supabase
      .from("teams")
      .update({ name: teamName })
      .eq("id", team.id);

    if (error) {
      console.error("Error updating team name:", error.message);
      setSnackbarMessage(`Error updating team name: ${error.message}`);
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage("Team name updated successfully!");
      setSnackbarOpen(true);
      onTeamUpdated(); // Refresh data in parent component
    }
  };

  return (
    <Box mt={3}>
      <Typography variant="h6" className="mb-2">
        Edit Team Name
      </Typography>
      <TextField
        label="Team Name"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpdateTeamName}
      >
        Update Team Name
      </Button>

      <Typography variant="h6" className="mt-4 mb-2">
        Team Logo (Coming Soon)
      </Typography>
      {/* {team?.logo_url && (
        <Box mt={2}>
          <img src={team.logo_url} alt="Team Logo" className="max-w-xs" />
        </Box>
      )} */}
      {/* Placeholder for logo upload */}
      <Button variant="outlined" className="mt-2" disabled>
        Upload New Logo
      </Button>
    </Box>
  );
};

export default TeamSettingsTab;
