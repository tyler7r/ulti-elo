import GameHistory from "@/components/GameHistory/GameHistory";
import SessionsTab from "@/components/TeamHomePage/SessionsTab";
import TeamLeaderboardTab from "@/components/TeamHomePage/StatsTab/TeamLeaderboard";
import NoLogoAvatar from "@/components/Utils/NoLogoAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TeamType } from "@/lib/types";
import CloseIcon from "@mui/icons-material/Close";
// import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord"; // Keep this import if needed elsewhere, otherwise remove
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Alert,
  Badge, // Import Badge
  Box,
  Button,
  IconButton,
  Modal,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Image from "next/image"; // Import the Image component
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

const TeamHomePage = () => {
  const { user, userRoles } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // Default to Leaderboard
  const [team, setTeam] = useState<TeamType | null>(null);
  const [openRequestAdminDialog, setOpenRequestAdminDialog] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [requestAdminLoading, setRequestAdminLoading] = useState(false);
  const [requestAdminMessage, setRequestAdminMessage] = useState<{
    message: string | null;
    severity: "error" | "success" | "info";
  }>({ message: null, severity: "error" });
  const [ownerName, setOwnerName] = useState<string | undefined>(undefined);
  const [activeSession, setActiveSession] = useState(false);

  const router = useRouter();
  const teamId = router.query.teamId as string;
  const queryTab = router.query.tab as string | undefined;
  const userRole = userRoles.find((role) => role.team_id === teamId);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchTeam = async (teamId: string) => {
    const { data, error } = await supabase
      .from("teams")
      .select(`*, users!teams_owner_id_fkey(name)`)
      .eq("id", teamId)
      .single();
    if (error) console.error("Error fetching team:", error.message);

    setTeam(data);
    if (data?.users?.name) {
      setOwnerName(data.users.name);
    }
  };

  const fetchPendingRequests = useCallback(async () => {
    if (userRole) {
      const { count, error } = await supabase
        .from("admin_requests")
        .select("*", { count: "exact", head: true })
        .eq("team_id", teamId)
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching admin requests:", error.message);
      } else {
        setPendingRequests(count || 0);
      }
    }
  }, [teamId, userRole]);

  const fetchActiveSession = useCallback(async () => {
    const { data } = await supabase
      .from("sessions")
      .select() // Just need to know if one exists
      .eq("active", true)
      .eq("team_id", teamId)
      .single();

    // Check if count is greater than 0 or data exists (depending on Supabase version/return)
    if (data) {
      setActiveSession(true);
    } else {
      setActiveSession(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      void fetchTeam(teamId);
      void fetchPendingRequests();
      void fetchActiveSession();

      // Optional: Set up a subscription for active sessions if real-time updates are needed
      // const sessionSubscription = supabase.channel(`active-session-${teamId}`)
      //   .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `team_id=eq.${teamId}` }, payload => {
      //     console.log('Session change received!', payload)
      //     // Re-fetch active session status on any change for simplicity
      //     void fetchActiveSession();
      //   })
      //   .subscribe()

      // return () => {
      //   supabase.removeChannel(sessionSubscription);
      // }
    }
  }, [teamId, userRole, fetchPendingRequests, fetchActiveSession]);

  useEffect(() => {
    if (router.isReady && queryTab) {
      let tabIndex = 0;
      if (queryTab === "leaderboard") {
        tabIndex = 0;
      } else if (queryTab === "sessions") {
        tabIndex = 1;
      } else if (queryTab === "history") {
        tabIndex = 2;
      }
      setActiveTab(tabIndex);
    }
  }, [router, queryTab, teamId, userRole]); // Removed router.isReady as dependency - query should be enough

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    let newTabParam: string | undefined;
    if (newValue === 0) {
      newTabParam = "leaderboard";
    } else if (newValue === 1) {
      newTabParam = "sessions";
    } else if (newValue === 2) {
      newTabParam = "history";
    }

    setActiveTab(newValue);

    const currentPath = `/team/${teamId}`;
    const newQuery = newTabParam ? { tab: newTabParam } : {};

    // Shallow routing to avoid full page reload if only query param changes
    router.push({ pathname: currentPath, query: newQuery }, undefined, {
      shallow: true,
    });
  };

  const handleRequestAdmin = async () => {
    setRequestAdminLoading(true);
    if (team && user) {
      const { error } = await supabase
        .from("admin_requests")
        .insert([{ user_id: user.id, team_id: team.id }]);
      if (error) {
        if (error.code === "23505") {
          setRequestAdminMessage({
            message:
              "You have already submitted a request to be an admin for this team!",
            severity: "info",
          });
        } else {
          // Show generic error for other codes
          setRequestAdminMessage({
            message: `Error sending admin request. Please try again later.`, // Avoid exposing detailed errors
            severity: "error",
          });
          console.error("Error inserting admin request:", error.message); // Log detailed error
        }
        setRequestAdminLoading(false); // Ensure loading stops on error
      } else {
        setRequestAdminMessage({
          message: "Request sent to the team owner.",
          severity: "success",
        });

        // Attempt email notification (fire and forget, UI updated regardless)
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, teamId: team.id }),
        }).catch((err) => console.error("Error calling send-email API:", err));

        setTimeout(() => {
          handleRequestDialogClose();
        }, 1500); // Slightly longer timeout
      }
    } else {
      // If no user, redirect to login instead of showing error in dialog
      handleRequestDialogClose(); // Close dialog first
      void router.push("/auth/login");
    }
    // Removed setRequestAdminLoading(false) from here as it's handled in success/error cases
  };

  const handleRequestDialogClose = () => {
    // Reset state completely on close
    setOpenRequestAdminDialog(false);
    setRequestAdminLoading(false);
    setRequestAdminMessage({ message: null, severity: "error" });
  };

  const handleNavigateToAdmin = () => {
    void router.push(`/team/${teamId}/admin`);
  };

  return (
    team && (
      <Box sx={{ width: "100%" }}>
        {/* Team Header */}
        <Box
          display={"flex"}
          flexDirection={"column"}
          p={1}
          px={2}
          pt={2}
          justifyContent={"center"}
          alignItems={"flex-start"}
          gap={1}
        >
          <div className="flex w-full items-center gap-2">
            {team.logo_url ? (
              <Image
                src={team.logo_url}
                alt={`${team.name} Logo`}
                width={50}
                height={50}
                className="rounded"
              />
            ) : (
              team.name && <NoLogoAvatar size="large" name={team.name} />
            )}
            <Typography
              variant={isSmallScreen ? "h4" : "h3"}
              fontWeight={"bold"}
              // sx={{ textAlign: "center" }} // Removed text align center
            >
              {team.name}
            </Typography>
            {user && userRole && (
              <IconButton
                onClick={handleNavigateToAdmin}
                size="small"
                sx={{ ml: "auto" }}
              >
                {" "}
                {/* Pushes icon to the right */}
                <Badge badgeContent={pendingRequests} color="error">
                  {" "}
                  {/* Changed badge color */}
                  <SettingsIcon />
                </Badge>
              </IconButton>
            )}
          </div>
          {user && !userRole && (
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              onClick={() => setOpenRequestAdminDialog(true)}
              sx={{ mt: 1 }} // Add some margin top
            >
              Request Admin Access
            </Button>
          )}
        </Box>

        {/* Tabs Section */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          {" "}
          {/* Add border here */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="team tabs"
            variant="scrollable"
            scrollButtons="auto"
            //   sx={{ borderBottom: 1, borderColor: 'divider' }} // Remove border from here
          >
            <Tab
              label="Leaderboard"
              id="team-tab-0"
              aria-controls="team-tabpanel-0"
            />
            <Tab
              id="team-tab-1"
              aria-controls="team-tabpanel-1"
              // Use Badge for the active session indicator
              label={
                <Badge
                  // overlap="circular" // Optional: adjust overlap if needed
                  variant="dot"
                  color="error"
                  invisible={!activeSession} // Control visibility
                  sx={{
                    // Fine-tune dot position relative to the label span
                    ".MuiBadge-dot": {
                      position: "absolute", // Allows precise positioning
                      top: "4px", // Adjust vertical position
                      right: "-8px", // Adjust horizontal position
                      // transform: 'scale(0.8) translate(50%, -50%)', // Alternative scaling/positioning
                    },
                  }}
                >
                  Sessions
                </Badge>
              }
              // Remove icon and iconPosition props
            />
            <Tab
              label="History"
              id="team-tab-2"
              aria-controls="team-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box sx={{ pt: 2 }}>
          {" "}
          {/* Add padding top to content area */}
          {/* Panel 0: Leaderboard */}
          <div
            role="tabpanel"
            hidden={activeTab !== 0}
            id={`team-tabpanel-0`}
            aria-labelledby={`team-tab-0`}
          >
            {activeTab === 0 && <TeamLeaderboardTab teamId={teamId} />}
          </div>
          {/* Panel 1: Sessions */}
          <div
            role="tabpanel"
            hidden={activeTab !== 1}
            id={`team-tabpanel-1`}
            aria-labelledby={`team-tab-1`}
          >
            {activeTab === 1 && <SessionsTab team={team} />}
          </div>
          {/* Panel 2: History */}
          <div
            role="tabpanel"
            hidden={activeTab !== 2}
            id={`team-tabpanel-2`}
            aria-labelledby={`team-tab-2`}
          >
            {activeTab === 2 && <GameHistory teamId={teamId} />}
          </div>
        </Box>

        {/* Request Admin Modal */}
        <Modal
          open={openRequestAdminDialog}
          onClose={handleRequestDialogClose}
          aria-labelledby="request-admin-modal-title"
          aria-describedby="request-admin-modal-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: 600,
              maxHeight: "80vh", // Limit height
              overflowY: "auto", // Allow vertical scroll if needed
              bgcolor: "background.paper",
              boxShadow: 24,
              width: { xs: "90%", md: "500px" },
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: 2, // Consistent border radius
            }}
          >
            <IconButton
              aria-label="close"
              onClick={handleRequestDialogClose}
              sx={{ position: "absolute", top: 8, right: 8 }} // Standard positioning
            >
              <CloseIcon />
            </IconButton>
            <Typography
              id="request-admin-modal-title"
              variant="h6" // Adjusted variant slightly
              component="h2"
              fontWeight="bold"
              // color="primary" // Removed color for default text color
              mb={2} // Increased margin bottom
            >
              Request Admin Access
            </Typography>
            <Typography id="request-admin-modal-description" sx={{ mb: 2 }}>
              {" "}
              {/* Added description id */}
              {user
                ? `To manage sessions and record games for ${
                    team.name
                  }, you need admin privileges. Click below to send a request to the team owner (${
                    ownerName ?? "N/A"
                  }).`
                : `You must log in and request admin access for ${team.name} to manage sessions or record games.`}
            </Typography>
            {requestAdminMessage.message && (
              <Alert severity={requestAdminMessage.severity} sx={{ mb: 2 }}>
                {requestAdminMessage.message}
              </Alert>
            )}
            <Box
              display="flex"
              justifyContent="flex-end" // Keep buttons to the right
              gap={1}
              mt={2}
            >
              <Button
                onClick={handleRequestDialogClose}
                color="inherit" // Use inherit or secondary for cancel
                size="small"
                variant="outlined" // Optional outline
              >
                Cancel
              </Button>
              <Button
                disabled={requestAdminLoading || !user} // Disable if no user or loading
                variant="contained"
                color="primary"
                size="small" // Consistent button size
                onClick={handleRequestAdmin}
              >
                {requestAdminLoading
                  ? "Sending..."
                  : user
                  ? "Send Request"
                  : "Login Required"}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    )
  );
};

export default TeamHomePage;
