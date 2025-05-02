import { useAuth } from "@/contexts/AuthContext"; // Adjust path
import { SessionTypeWithStats, TeamType } from "@/lib/types"; // Adjust path
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined"; // Icon for Season
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined"; // Icon for Attendees
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Fab,
  Paper,
  Tooltip, // Import Tooltip
  Typography,
  useTheme,
} from "@mui/material";
import { format, formatDistanceToNow } from "date-fns"; // For date formatting
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
// Import the session creation modal
import { getActiveSession, getSessions } from "@/pages/api/get-sessions"; // Ensure this API returns new fields
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import CreateSessionModal from "./Sessions/CreateSession/CreateSession"; // Adjust path

type SessionTabProps = {
  team: TeamType;
};

const COMPLETED_PAGE_SIZE = 10; // How many completed sessions to fetch per page

// Helper component for stat display
const StatItem = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number | undefined | null;
  label: string;
}) => {
  if (value === undefined || value === null) return null; // Don't render if no value

  return (
    <Tooltip title={label} placement="top" arrow>
      <Box display="flex" alignItems="center" gap={0.5}>
        {icon}
        <Typography variant="caption" color="text.secondary" fontWeight="500">
          {value}
        </Typography>
      </Box>
    </Tooltip>
  );
};

const SessionsTab = ({ team }: SessionTabProps) => {
  const router = useRouter();
  const { userRoles } = useAuth();
  const theme = useTheme();

  // State (remains mostly the same)
  const [activeSession, setActiveSession] =
    useState<SessionTypeWithStats | null>(null); // SessionType now includes new fields
  const [completedSessions, setCompletedSessions] = useState<
    SessionTypeWithStats[]
  >([]); // SessionType now includes new fields
  const [completedPage, setCompletedPage] = useState(1);
  const [hasMoreCompleted, setHasMoreCompleted] = useState(true);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
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
  // IMPORTANT: Assumes getActiveSession and getSessions now return the extended SessionType
  const fetchActive = useCallback(async () => {
    setLoadingActive(true);
    setError(null);
    // Assuming getActiveSession fetches the extended SessionType
    const { session, error: activeError } = await getActiveSession(team.id);
    if (activeError) {
      console.error("Error fetching active session:", activeError);
      setError("Could not load active session details.");
    }
    setActiveSession(session);
    setLoadingActive(false);
  }, [team.id]);

  const fetchCompleted = useCallback(
    async (pageToFetch: number) => {
      if (pageToFetch === 1) {
        setLoadingCompleted(true);
        setError(null);
      }

      // Assuming getSessions fetches the extended SessionType
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
        setError("Could not load past sessions.");
        setHasMoreCompleted(false);
      } else if (sessions) {
        // Ensure correct typing for state update
        const newSessions = sessions as SessionTypeWithStats[];
        setCompletedSessions((prev) =>
          pageToFetch === 1 ? newSessions : [...prev, ...newSessions]
        );
        setCompletedPage(pageToFetch + 1);
        const currentTotal =
          (pageToFetch === 1 ? 0 : completedSessions.length) +
          newSessions.length;
        setHasMoreCompleted(
          newSessions.length === COMPLETED_PAGE_SIZE &&
            (totalCount ? currentTotal < totalCount : true)
        );
      } else {
        setHasMoreCompleted(false);
      }

      if (pageToFetch === 1) {
        setLoadingCompleted(false);
      }
    },
    [team.id, completedSessions.length] // Dependency updated
  );

  // --- Initial Fetch Effect ---
  useEffect(() => {
    fetchActive();
    fetchCompleted(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchActive]); // Only depends on fetchActive

  // --- Handlers ---
  const handleOpenCreateModal = () => {
    if (!isAdmin || activeSession) return;
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleSessionCreated = (newSessionId?: string) => {
    // Optional new ID
    handleCloseCreateModal();
    fetchActive(); // Re-fetch active session
    if (newSessionId) {
      // Navigate if ID is provided
      handleNavigateToSession(newSessionId);
    }
  };

  const handleNavigateToSession = (sessionId: string) => {
    void router.push(`/team/${team.id}/sessions/${sessionId}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Render Logic ---

  // Updated Active Session Renderer
  const renderActiveSession = () => {
    if (!activeSession) return null; // Guard clause

    return (
      <Box display={"flex"} width={"100%"} flexDirection={"column"} gap={1}>
        {/* Header */}
        <Box display={"flex"} width={"100%"} alignItems={"center"} gap={1}>
          <Box
            height={15}
            width={15}
            borderRadius={"50%"}
            sx={{ backgroundColor: theme.palette.error.main }}
          />
          <Typography variant="h6" fontWeight={"bold"}>
            Active Session
          </Typography>
        </Box>
        {/* Card */}
        <Paper
          elevation={3} // Slightly more elevation for active
          onClick={() => handleNavigateToSession(activeSession.id)}
          sx={{
            p: 2, // Increase padding slightly
            borderLeft: `4px solid ${theme.palette.error.main}`, // Use border left for emphasis
            cursor: "pointer",
            transition:
              "box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out",
            "&:hover": {
              boxShadow: theme.shadows[6],
              transform: "translateY(-2px)", // Slight lift on hover
            },
            borderRadius: "8px", // More rounded corners
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={0.5}
          >
            {/* Left Side: Title & Time */}
            <Box>
              <Typography variant="h6" component="div" fontWeight={"bold"}>
                {activeSession.title}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontStyle={"italic"}
                fontWeight={"500"} // Slightly less bold
              >
                Started{" "}
                {formatDistanceToNow(new Date(activeSession.created_at), {
                  addSuffix: true,
                })}
              </Typography>
            </Box>
            {/* Right Side: Arrow */}
            <ChevronRightIcon color="action" />
          </Box>

          {/* New Stats Row */}
          <Divider sx={{ my: 0.5 }} />
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            flexWrap="wrap"
            mt={1}
          >
            <StatItem
              icon={
                <CalendarMonthOutlinedIcon
                  sx={{ fontSize: 16 }}
                  color="secondary"
                />
              }
              value={
                activeSession.season_no
                  ? `Season ${activeSession.season_no}`
                  : "--"
              }
              label="Season"
            />
            <StatItem
              icon={
                <GroupsOutlinedIcon sx={{ fontSize: 20 }} color="primary" />
              }
              value={activeSession.attendees_count ?? 0}
              label="Attendees"
            />
            <StatItem
              icon={
                <SportsScoreIcon
                  sx={{ fontSize: 20, color: "text.secondary" }}
                />
              }
              value={activeSession.games_played_count ?? 0}
              label="Games Played"
            />
          </Box>
        </Paper>
      </Box>
    );
  };

  // Updated Completed Session Renderer
  const renderCompletedSessionItem = (session: SessionTypeWithStats) => (
    <Paper
      key={session.id}
      elevation={1}
      onClick={() => handleNavigateToSession(session.id)}
      sx={{
        p: 1.5, // Standard padding
        mb: 1.5,
        border: `1px solid ${theme.palette.divider}`, // Standard border
        cursor: "pointer",
        transition: "box-shadow 0.2s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[3], // Standard hover
        },
        borderRadius: "6px", // Standard corners
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={0.5}
      >
        {/* Left Side: Title & Time */}
        <Box>
          <Typography variant="body1" fontWeight="bold" noWrap>
            {session.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={"500"} // Slightly less bold
            fontStyle={"italic"}
          >
            {/* Use updated_at for completion date, fallback to created_at */}
            {format(new Date(session.updated_at || session.created_at), "P p")}
          </Typography>
        </Box>
        {/* Right Side: Arrow */}
        <ChevronRightIcon color="action" fontSize="small" />
      </Box>

      {/* New Stats Row */}
      <Divider sx={{ my: 0.5 }} />
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mt={1}>
        <StatItem
          icon={
            <CalendarMonthOutlinedIcon
              color="secondary"
              sx={{ fontSize: 16 }}
            />
          }
          value={session.season_no ? `Season ${session.season_no}` : "--"}
          label="Season"
        />
        <StatItem
          icon={<GroupsOutlinedIcon sx={{ fontSize: 20 }} color="primary" />}
          value={session.attendees_count ?? 0}
          label="Attendees"
        />
        <StatItem
          icon={
            <SportsScoreIcon sx={{ fontSize: 20, color: "text.secondary" }} />
          }
          value={session.games_played_count ?? 0}
          label="Games Played"
        />
      </Box>
    </Paper>
  );

  return (
    <Box display="flex" flexDirection="column" gap={2} padding={2}>
      <Box
        display="flex"
        width={"100%"}
        alignItems={"center"}
        justifyContent={"space-between"}
        flexWrap="wrap" // Allow wrapping on small screens
        gap={1} // Gap between title and button
      >
        <Typography variant="h5" fontWeight={"bold"}>
          {team.name} Sessions
        </Typography>
        {isAdmin && (
          <Button
            variant="outlined" // Changed to contained for primary action
            color="primary"
            size="small"
            startIcon={<AddCircleOutlineIcon fontSize="small" />}
            onClick={handleOpenCreateModal}
            disabled={!!activeSession || loadingActive}
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
      ) : // Render active session only if it exists
      activeSession ? (
        renderActiveSession()
      ) : (
        // Optionally show a message if admin and no active session
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic", px: 1 }}
        >
          No active session. Only team admins can start a new one.
        </Typography>
      )}
      {/* Divider */}
      <Divider />
      {/* Past Sessions Section */}
      <Box>
        {/* Removed px={1} */}
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold" }}
          mb={1} // Added margin bottom
          // color="primary" // Removed color
        >
          Session History
        </Typography>
        {loadingCompleted && completedSessions.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : completedSessions.length === 0 && !loadingCompleted ? ( // Check loading state here
          <Typography
            sx={{
              px: 1,
              fontStyle: "italic",
              color: "text.secondary",
            }}
            variant="body2"
          >
            No past sessions found for this team.
          </Typography>
        ) : (
          // Container for infinite scroll needed for target ID
          <Box id="completed-sessions-scroll-container">
            <InfiniteScroll
              dataLength={completedSessions.length}
              next={() => fetchCompleted(completedPage)}
              hasMore={hasMoreCompleted}
              loader={
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 1,
                    my: 2,
                  }}
                >
                  <CircularProgress size={20} />
                  <Typography variant="caption" color="text.secondary">
                    Loading more sessions...
                  </Typography>
                </Box>
              }
              endMessage={
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    color: "text.disabled",
                    my: 2,
                  }}
                >
                  — End of Session History —
                </Typography>
              }
              scrollThreshold={0.9}
              // Use document scroll unless nested in a specific scrollable element
              // scrollableTarget="completed-sessions-scroll-container" // Only use if Box above has fixed height and overflow: 'auto'
            >
              {completedSessions.map(renderCompletedSessionItem)}
            </InfiniteScroll>
          </Box>
        )}
      </Box>
      {/* Create Session Modal */}
      {isAdmin && (
        <CreateSessionModal
          open={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onSessionCreated={handleSessionCreated}
          teamId={team.id}
        />
      )}
      {/* Scroll to Top FAB (optional) */}
      {/* Consider only showing after scrolling down a bit */}
      <Fab
        color="secondary" // Changed color
        onClick={scrollToTop}
        size="small"
        sx={{
          position: "fixed",
          bottom: { xs: 70, sm: 24 }, // Adjust position to avoid overlap with potential bottom nav
          right: { xs: 16, sm: 24 },
          zIndex: 1000,
          opacity: 0.8,
          "&:hover": { opacity: 1 },
        }}
        aria-label="Scroll to top"
      >
        <ArrowUpwardIcon />
      </Fab>
    </Box>
  );
};

export default SessionsTab;
