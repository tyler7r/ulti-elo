// /components/Sessions/SessionDetailsDisplay.tsx
import { supabase } from "@/lib/supabase";
import { SessionType, TeamType } from "@/lib/types";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Snackbar,
  Typography,
  useTheme,
} from "@mui/material";
import { format } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NoLogoAvatar from "../../../../Utils/NoLogoAvatar";

type SessionDetailsDisplayProps = {
  session: SessionType;
  isAdmin: boolean;
  onSessionUpdated: () => void;
  navigateToFirstTab: () => void;
};

const SessionDetailsDisplay = ({
  session,
  isAdmin,
  onSessionUpdated,
  navigateToFirstTab,
}: SessionDetailsDisplayProps) => {
  const router = useRouter();
  const theme = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<TeamType | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const formattedDate = session.created_at
    ? format(new Date(session.created_at), "P") // e.g., Aug 17, 2024 1:00 PM
    : "Date not set";

  const threeDaysInMilliseconds = 3 * 24 * 60 * 60 * 1000;
  const gameDate = new Date(session.created_at);
  const now = new Date();
  const isWithinEditWindow =
    now.getTime() - gameDate.getTime() <= threeDaysInMilliseconds;

  const handleEditClick = () => {
    if (isWithinEditWindow) {
      handleMarkActive();
    } else {
      setSnackbarMessage(
        "This session cannot be edited as it is older than 7 days."
      );
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    const fetchTeam = async () => {
      const { data, error } = await supabase
        .from("teams")
        .select()
        .eq("id", session.team_id)
        .single();
      if (error) console.error(error);
      else setTeam(data);
    };

    if (session.id) fetchTeam();
  }, [session]);

  const handleTeamClick = (teamId: string) => {
    void router.push(`/team/${teamId}?tab=sessions`);
  };

  const handleMarkComplete = async () => {
    if (!isAdmin || !session.active) return;

    setIsLoading(true);
    setError(null);
    const date = new Date();
    const newDate = date.toUTCString();

    try {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({ active: false, updated_at: newDate })
        .eq("id", session.id);

      if (updateError) throw updateError;

      navigateToFirstTab();
      onSessionUpdated(); // Refresh parent state
    } catch (completionError) {
      setError(
        `Failed to mark session complete: ${completionError || "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkActive = async () => {
    if (!isAdmin || session.active) return;

    setIsLoading(true);
    setError(null);

    const date = new Date();
    const newDate = date.toUTCString();

    try {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({ active: true, updated_at: newDate })
        .eq("id", session.id);

      if (updateError) throw updateError;

      navigateToFirstTab();
      onSessionUpdated(); // Refresh parent state
    } catch (completionError) {
      setError(
        `Failed to make session active: ${completionError || "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
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

  return (
    <Box p={1} width={"100%"}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight={"bold"}>
        {session.title}
      </Typography>
      <Box display={"flex"} width={"100%"} alignItems={"center"} gap={2}>
        {team && (
          <Box
            display={"flex"}
            alignItems={"center"}
            gap={1}
            sx={{ cursor: "pointer" }}
            component={"button"}
            onClick={() => handleTeamClick(team.id)}
          >
            {team.logo_url ? (
              <Image
                alt="team logo"
                src={team.logo_url}
                height={40}
                width={40}
                className="rounded"
              />
            ) : (
              <NoLogoAvatar name={team.name} size="small" />
            )}
            <Typography>{team.name}</Typography>
          </Box>
        )}
        <Divider flexItem orientation="vertical" />
        <Typography
          variant="subtitle1"
          color="text.secondary"
          fontStyle={"italic"}
        >
          {formattedDate}
        </Typography>
      </Box>
      <Box display={"flex"} width={"100%"} alignItems={"center"} mt={2}>
        {isAdmin && session.active && (
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={handleMarkComplete}
            disabled={isLoading}
            sx={{ width: "100%" }}
            startIcon={
              isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
          >
            {isLoading ? "Updating..." : "Mark Complete"}
          </Button>
        )}
        <Box
          display={"flex"}
          width={"100%"}
          alignItems={"center"}
          gap={1}
          justifyContent={"space-between"}
        >
          {!session.active && (
            <Box display={"flex"} alignItems={"center"} gap={0.25}>
              <CheckCircleIcon color="success" fontSize="small" />
              <Typography variant="button" color="success" fontWeight={"bold"}>
                Completed
              </Typography>
            </Box>
          )}
          {!session.active && isAdmin && (
            <Button
              color={isWithinEditWindow ? "secondary" : "inherit"}
              startIcon={!isWithinEditWindow ? <LockIcon /> : null}
              onClick={handleEditClick}
              sx={{
                fontWeight: "bold",
                color: isWithinEditWindow
                  ? theme.palette.secondary.main
                  : theme.palette.divider,
              }}
            >
              Edit
            </Button>
          )}
        </Box>
      </Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="warning"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SessionDetailsDisplay;
