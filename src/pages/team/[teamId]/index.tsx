import GameHistory from "@/components/GameHistory";
import Leaderboard from "@/components/Leaderboard";
import PlayTab from "@/components/TeamHomePage/PlayTab";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TeamType } from "@/lib/types";
import LockIcon from "@mui/icons-material/Lock";
import ShieldIcon from "@mui/icons-material/Shield";
import {
  Alert,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

const TeamHomePage = () => {
  const { user, userRoles } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // For Tabs
  const [team, setTeam] = useState<TeamType | null>(null);
  const [openRequestAdminDialog, setOpenRequestAdminDialog] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [requestAdminLoading, setRequestAdminLoading] = useState(false);
  const [requestAdminMessage, setRequestAdminMessage] = useState<{
    message: string | null;
    severity: "error" | "success" | "info";
  }>({ message: null, severity: "error" });

  const router = useRouter();
  const teamId = router.query.teamId as string;
  const userRole = userRoles.find((role) => role.team_id === teamId);

  const fetchTeam = async (teamId: string) => {
    const { data, error } = await supabase
      .from("teams")
      .select()
      .eq("id", teamId)
      .single();
    if (error) console.error("Error fetching team:", error.message);

    setTeam(data);
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

  useEffect(() => {
    if (teamId) {
      void fetchTeam(teamId);
      void fetchPendingRequests();
    }
  }, [teamId, userRole, fetchPendingRequests]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    if (newValue === 1 && !userRole) {
      setOpenRequestAdminDialog(true);
    } else {
      setActiveTab(newValue);
    }
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
        }
        setRequestAdminMessage({
          message: `Error sending admin request: ${error.message}`,
          severity: "error",
        });
        setRequestAdminLoading(false);
      } else {
        setRequestAdminMessage({
          message: "Request sent to the team owner.",
          severity: "success",
        });

        try {
          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              teamId: team.id,
            }),
          });

          if (response.ok) {
            setRequestAdminMessage({
              message: "Email sent successfully",
              severity: "success",
            });
          } else {
            setRequestAdminMessage({
              message: "Failed to send email notification to team owner.",
              severity: "error",
            });
          }
        } catch (error) {
          console.error("Error calling send-email API", error);
        }
        setTimeout(() => {
          handleRequestDialogClose();
        }, 1000);
      }
    } else {
      setRequestAdminLoading(false);
      setRequestAdminMessage({ message: null, severity: "error" });
      void router.push("/auth/login");
    }
  };

  const handleRequestDialogClose = () => {
    setRequestAdminLoading(false);
    setOpenRequestAdminDialog(false);
    setRequestAdminMessage({ message: null, severity: "error" });
  };

  const handleNavigateToAdmin = () => {
    router.push(`/team/${teamId}/admin`);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <div className="flex w-full items-center justify-center">
        <Typography
          variant="h3"
          fontWeight={"bold"}
          sx={{ textAlign: "center", marginTop: "16px" }}
        >
          {team?.name}
        </Typography>
        {user && userRole && (
          <IconButton onClick={handleNavigateToAdmin} size="small">
            <Badge badgeContent={pendingRequests} color="secondary">
              <ShieldIcon />
            </Badge>
          </IconButton>
        )}
      </div>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="team tabs"
        variant="fullWidth"
      >
        <Tab label="Leaderboard" />
        <Tab
          label="Play"
          icon={user && userRole ? undefined : <LockIcon fontSize="small" />}
          iconPosition="start"
        />
        <Tab label="History" />
      </Tabs>

      <Box>
        {activeTab === 1 && team && <PlayTab team={team} />}

        <Dialog
          open={openRequestAdminDialog}
          onClose={handleRequestDialogClose}
        >
          <DialogTitle fontWeight={"bold"}>Request Admin Access</DialogTitle>
          <DialogContent>
            <Typography>
              {user
                ? `You must be a team admin for ${
                    team?.name ? team.name : "this team"
                  } to record games. Request admin access to
              this team. The team owner will be notified.`
                : `You must have a registered account and be a team admin for ${
                    team?.name ? team.name : "this team"
                  } before you can record games.`}
            </Typography>
          </DialogContent>
          {requestAdminMessage.message && (
            <Alert severity={requestAdminMessage.severity}>
              {requestAdminMessage.message}
            </Alert>
          )}
          <DialogActions>
            <Button
              disabled={requestAdminLoading}
              variant="outlined"
              onClick={handleRequestAdmin}
            >
              {requestAdminLoading
                ? "Loading..."
                : user
                ? "Send Request"
                : "Login"}
            </Button>
            <Button onClick={handleRequestDialogClose} color="secondary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {activeTab === 0 && (
          <Box>
            <Leaderboard teamId={teamId} />
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            {/* Add Game History Component Here */}
            <GameHistory teamId={teamId} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TeamHomePage;
