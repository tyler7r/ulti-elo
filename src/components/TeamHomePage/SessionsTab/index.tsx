import { useAuth } from "@/contexts/AuthContext"; // Adjust path
import { SessionType, TeamType } from "@/lib/types"; // Adjust path
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fab,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { format, formatDistanceToNow } from "date-fns"; // For date formatting
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
// Import the session creation modal
import { getActiveSession, getSessions } from "@/pages/api/get-sessions";
import CreateSessionModal from "./Sessions/CreateSession/CreateSession"; // Adjust path

type SessionTabProps = {
  team: TeamType;
};

const COMPLETED_PAGE_SIZE = 10; // How many completed sessions to fetch per page

const SessionsTab = ({ team }: SessionTabProps) => {
  const router = useRouter();
  const { userRoles } = useAuth();
  const theme = useTheme();

  // State
  const [activeSession, setActiveSession] = useState<SessionType | null>(null);
  const [completedSessions, setCompletedSessions] = useState<SessionType[]>([]);
  const [completedPage, setCompletedPage] = useState(1);
  const [hasMoreCompleted, setHasMoreCompleted] = useState(true);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true); // Separate loading for list
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Derived State
  const isAdmin = useMemo(() => {
    return userRoles.some(
      (role) =>
        role.team_id === team.id &&
        (role.role === "admin" || role.role === "owner")
    );
  }, [userRoles, team.id]);

  // --- Data Fetching Callbacks ---
  const fetchActive = useCallback(async () => {
    setLoadingActive(true);
    setError(null); // Clear previous errors
    const { session, error: activeError } = await getActiveSession(team.id);
    if (activeError) {
      console.error("Error fetching active session:", activeError);
      setError("Could not load active session details."); // Set specific error
    }
    setActiveSession(session);
    setLoadingActive(false);
  }, [team.id]);

  const fetchCompleted = useCallback(
    async (pageToFetch: number) => {
      // Only set loading true for the initial fetch (page 1)
      if (pageToFetch === 1) {
        setLoadingCompleted(true);
        setError(null); // Clear previous errors on initial fetch
      }

      const {
        sessions,
        error: completedError,
        totalCount,
      } = await getSessions({
        teamId: team.id,
        active: false,
        page: pageToFetch,
        limit: COMPLETED_PAGE_SIZE,
      });

      if (completedError) {
        console.error("Error fetching completed sessions:", completedError);
        setError("Could not load past sessions."); // Set specific error
        setHasMoreCompleted(false); // Stop fetching on error
      } else if (sessions) {
        setCompletedSessions((prev) =>
          pageToFetch === 1 ? sessions : [...prev, ...sessions]
        );
        setCompletedPage(pageToFetch + 1);
        // Check if we've fetched all based on total count or if last fetch was less than limit
        const currentTotal =
          pageToFetch === 1
            ? sessions.length
            : completedSessions.length + sessions.length;
        setHasMoreCompleted(
          sessions.length === COMPLETED_PAGE_SIZE &&
            (totalCount ? currentTotal < totalCount : true)
        );
      } else {
        setHasMoreCompleted(false); // No sessions returned
      }

      if (pageToFetch === 1) {
        setLoadingCompleted(false);
      }
    },
    [team.id, completedSessions.length]
  ); // Include completedSessions.length for accurate total check

  // --- Initial Fetch Effect ---
  useEffect(() => {
    fetchActive();
    fetchCompleted(1); // Fetch first page of completed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchActive]); // Only depend on fetchActive, which depends on team.id

  // --- Handlers ---
  const handleOpenCreateModal = () => {
    if (!isAdmin || activeSession) return; // Extra safety check
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleSessionCreated = () => {
    handleCloseCreateModal();
    fetchActive(); // Re-fetch active session after creation
    // Optionally, navigate directly to the new session?
  };

  const handleNavigateToSession = (sessionId: string) => {
    void router.push(`/team/${team.id}/sessions/${sessionId}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Render Logic ---
  // Updated Active Session Renderer
  const renderActiveSession = () => (
    <Box display={"flex"} width={"100%"} flexDirection={"column"} gap={1}>
      <Box display={"flex"} width={"100%"} alignItems={"center"} gap={1}>
        <Box
          height={20}
          width={20}
          borderRadius={"50%"}
          sx={{ backgroundColor: theme.palette.error.main }}
        />
        <Typography variant="h5" fontWeight={"bold"}>
          Active Session
        </Typography>
      </Box>
      <Paper
        elevation={2}
        onClick={() => handleNavigateToSession(activeSession!.id)} // Added onClick handler
        sx={{
          p: 2,
          mb: 2,
          border: `2px solid ${theme.palette.error.main}`,
          cursor: "pointer", // Keep cursor pointer
          transition: "box-shadow 0.3s ease-in-out",
          "&:hover": {
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" component="div" fontWeight={"bold"}>
              {activeSession!.title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontStyle={"italic"}
              fontWeight={"bold"}
            >
              Started:{" "}
              {formatDistanceToNow(new Date(activeSession!.session_date), {
                addSuffix: true,
              })}
            </Typography>
          </Box>
          <ChevronRightIcon color="action" />
        </Box>
      </Paper>
    </Box>
  );

  // Updated Completed Session Renderer using onClick
  const renderCompletedSessionItem = (session: SessionType) => (
    <Paper
      key={session.id} // Add key here as it's the top element in the map
      elevation={1}
      onClick={() => handleNavigateToSession(session.id)} // Added onClick handler
      sx={{
        p: 1.5,
        mb: 1.5, // Added margin bottom directly here
        border: `1px solid ${theme.palette.divider}`,
        cursor: "pointer",
        transition: "box-shadow 0.2s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[2],
          borderColor: theme.palette.action.active,
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body1" fontWeight="bold">
            {session.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={"bold"}
            fontStyle={"italic"}
          >
            Completed: {format(new Date(session.updated_at), "P")}
          </Typography>
        </Box>
        <ChevronRightIcon color="action" fontSize="small" />
      </Box>
    </Paper>
  );

  return (
    <Box display="flex" flexDirection="column" gap={1} padding={2}>
      <Box
        display="flex"
        width={"100%"}
        alignItems={"center"}
        justifyContent={"space-between"}
        mb={1}
      >
        <Typography variant="h5" fontWeight={"bold"}>
          {team.name} Sessions
        </Typography>
        {isAdmin && (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<AddCircleOutlineIcon fontSize="small" />}
            onClick={handleOpenCreateModal}
            disabled={!!activeSession || loadingActive} // Disable if active session exists or loading
            title={
              activeSession
                ? "An active session already exists"
                : "Create a new session"
            }
          >
            New
          </Button>
        )}
      </Box>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Active Session Display */}
      {loadingActive ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        activeSession && renderActiveSession()
      )}

      {/* Past Sessions Section */}
      <Box px={1}>
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold" }}
          mb={1}
          color="primary"
        >
          Session History
        </Typography>
        {loadingCompleted && completedSessions.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : completedSessions.length === 0 ? (
          <Typography
            sx={{
              textAlign: "center",
              fontStyle: "italic",
              color: "text.secondary",
            }}
          >
            No past sessions found for this team.
          </Typography>
        ) : (
          <InfiniteScroll
            dataLength={completedSessions.length}
            next={() => fetchCompleted(completedPage)}
            hasMore={hasMoreCompleted}
            loader={
              <div className="flex justify-center items-center mt-2 font-bold text-sm">
                <KeyboardDoubleArrowDownIcon
                  fontSize="small"
                  color="secondary"
                />
                <div>Scroll for more sessions</div>
                <KeyboardDoubleArrowDownIcon
                  fontSize="small"
                  color="secondary"
                />
              </div>
            } // Loader that appears while fetching
            endMessage={
              <div className="font-bold text-sm px-4 mt-2">
                No more sessions...
              </div>
            } // Message when no more data is available
            scrollThreshold={0.9} // When to trigger loading more data (90% scroll)
            scrollableTarget="completed-sessions-scroll-container"
          >
            {completedSessions.map(renderCompletedSessionItem)}
          </InfiniteScroll>
        )}
        {/* Create Session Modal */}
        {isAdmin && (
          <CreateSessionModal
            open={isCreateModalOpen}
            onClose={handleCloseCreateModal}
            onSessionCreated={handleSessionCreated} // Add callback for success
            teamId={team.id} // Pass teamId
          />
        )}
        <Fab
          color="primary"
          onClick={scrollToTop}
          size="small"
          sx={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
            zIndex: 1000,
          }}
          aria-label="Scroll to top"
        >
          <ArrowUpwardIcon />
        </Fab>
      </Box>
    </Box>
  );
};

export default SessionsTab;
