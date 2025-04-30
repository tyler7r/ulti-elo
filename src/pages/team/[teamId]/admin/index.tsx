import PendingRequestsTab from "@/components/TeamHomePage/AdminTab/PendingRequests";
import TeamPlayersTab from "@/components/TeamHomePage/AdminTab/TeamPlayers";
import TeamSeasonsManager from "@/components/TeamHomePage/AdminTab/TeamSeasons";
import TeamSettingsTab from "@/components/TeamHomePage/AdminTab/TeamSettings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventAvailableIcon from "@mui/icons-material/EventAvailable"; // Icon for active season
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Alert,
  Badge,
  Box,
  Button,
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
  elo: number;
  player: {
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

const AdminPage = () => {
  const { userRoles } = useAuth();
  const router = useRouter();
  const teamId = router.query.teamId as string;
  const [activeTab, setActiveTab] = useState(0);
  const [team, setTeam] = useState<Team | null>(null);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [ownerName, setOwnerName] = useState<string | undefined>(undefined);
  const userRole = userRoles.find((role) => role.team_id === teamId);
  const isAdmin = userRole ? true : false;

  const fetchTeamData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("*, users!teams_owner_id_fkey(name)")
      .eq("id", teamId)
      .single();
    setTeam(teamData);
    if (teamData?.users?.name) {
      setOwnerName(teamData.users.name);
    }

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
        elo,
        player:players (name)
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
    <Box>
      <Box sx={{ px: 2, mt: 1 }}>
        <Button
          onClick={() => router.push(`/team/${teamId}`)}
          size="small"
          startIcon={<ArrowBackIcon />}
        >
          {/* <ArrowBackIcon /> */}Back
        </Button>
        <Typography variant="h4" fontWeight="bold" className="mb-4">
          {team.name} Admin
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="team admin tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Players" icon={<PersonAddIcon fontSize="small" />} />
        <Tab label="Seasons" icon={<EventAvailableIcon fontSize="small" />} />
        <Tab
          label={
            <div className="flex flex-col gap-1 items-center">
              <Badge badgeContent={requests.length} color="primary">
                <NotificationsActiveIcon fontSize="small" />
              </Badge>
              <div className="text-nowrap">Admin Requests</div>
            </div>
          }
        />
        <Tab label="Settings" icon={<SettingsIcon fontSize="small" />} />
      </Tabs>

      {activeTab === 3 && (
        <TeamSettingsTab
          team={team}
          onTeamUpdated={handleTeamUpdated}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarOpen={setSnackbarOpen}
          isAdmin={isAdmin}
          ownerName={ownerName}
        />
      )}

      {activeTab === 2 && (
        <PendingRequestsTab
          team={team}
          requests={requests}
          onRequestsUpdated={handleRequestsUpdated}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarOpen={setSnackbarOpen}
          isAdmin={isAdmin}
          ownerName={ownerName}
        />
      )}

      {activeTab === 0 && (
        <TeamPlayersTab
          team={team}
          teamPlayers={teamPlayers}
          onPlayersUpdated={handlePlayersUpdated}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarOpen={setSnackbarOpen}
          isAdmin={isAdmin}
          ownerName={ownerName}
        />
      )}

      {activeTab === 1 && (
        <TeamSeasonsManager
          team={team}
          isAdmin={isAdmin}
          ownerName={ownerName}
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
