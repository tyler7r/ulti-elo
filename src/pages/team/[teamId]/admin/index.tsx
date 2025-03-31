import PendingRequestsTab from "@/components/TeamHomePage/AdminTab/PendingRequests";
import TeamPlayersTab from "@/components/TeamHomePage/AdminTab/TeamPlayers";
import TeamSettingsTab from "@/components/TeamHomePage/AdminTab/TeamSettings";
import { supabase } from "@/lib/supabase";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  IconButton,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

interface AdminRequest {
  user_id: string;
  team_id: string;
  created_at: string;
  user: {
    email: string;
    name: string;
  };
  team: {
    name: string;
  };
}

interface TeamPlayer {
  player_id: string;
  player: {
    name: string;
    elo: number;
  };
}

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

const AdminPage = () => {
  const router = useRouter();
  const teamId = router.query.teamId as string;
  const [activeTab, setActiveTab] = useState(0);
  const [team, setTeam] = useState<Team | null>(null);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const fetchTeamData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();

    if (teamError) {
      console.error("Error fetching team data:", teamError.message);
      setSnackbarMessage(`Error fetching team data: ${teamError.message}`);
      setSnackbarOpen(true);
    } else {
      setTeam(teamData);
    }

    const { data: requestsData, error: requestsError } = await supabase
      .from("admin_requests")
      .select(
        `
        user_id,
        team_id,
        created_at,
        user:users (email, name),
        team: teams (name)
      `
      )
      .eq("team_id", teamId)
      .eq("status", "pending");

    if (requestsError) {
      console.error("Error fetching admin requests:", requestsError.message);
      setSnackbarMessage(
        `Error fetching admin requests: ${requestsError.message}`
      );
      setSnackbarOpen(true);
    } else {
      setRequests(requestsData || []);
    }

    const { data: playersData, error: playersError } = await supabase
      .from("player_teams")
      .select(
        `
        player_id,
        player:players (name, elo)
      `
      )
      .order("player(name)", { ascending: true })
      .eq("team_id", teamId);

    if (playersError) {
      console.error("Error fetching team players:", playersError.message);
      setSnackbarMessage(
        `Error fetching team players: ${playersError.message}`
      );
      setSnackbarOpen(true);
    } else {
      setTeamPlayers(playersData || []);
    }

    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCloseSnackbar = (
    _event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleTeamUpdated = () => {
    fetchTeamData();
  };

  const handleRequestsUpdated = () => {
    fetchTeamData();
  };

  const handlePlayersUpdated = () => {
    fetchTeamData();
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!team) {
    return (
      <Box className="p-4">
        <IconButton onClick={() => router.push(`/`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Team not found.</Typography>
      </Box>
    );
  }

  return (
    <Box className="p-4">
      <IconButton onClick={() => router.push(`/team/${teamId}`)}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h4" fontWeight="bold" className="mb-4">
        {team.name} Admin
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="team admin tabs"
        variant="fullWidth"
      >
        <Tab label="Players" icon={<PersonAddIcon />} />
        <Tab
          label={
            <div className="flex flex-col gap-1 items-center">
              <Badge badgeContent={requests.length} color="primary">
                <NotificationsActiveIcon />
              </Badge>
              <div className="text-nowrap">Admin Requests</div>
            </div>
          }
        />
        <Tab label="Settings" icon={<SettingsIcon />} />
      </Tabs>

      {activeTab === 2 && (
        <TeamSettingsTab
          team={team}
          onTeamUpdated={handleTeamUpdated}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarOpen={setSnackbarOpen}
        />
      )}

      {activeTab === 1 && (
        <PendingRequestsTab
          teamId={teamId}
          requests={requests}
          onRequestsUpdated={handleRequestsUpdated}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarOpen={setSnackbarOpen}
        />
      )}

      {activeTab === 0 && (
        <TeamPlayersTab
          teamId={teamId}
          teamPlayers={teamPlayers}
          onPlayersUpdated={handlePlayersUpdated}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarOpen={setSnackbarOpen}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPage;
