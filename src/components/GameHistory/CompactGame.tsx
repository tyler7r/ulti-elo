import { GameHistoryType } from "@/lib/types"; // Adjust path as needed
import {
  KeyboardDoubleArrowDown,
  KeyboardDoubleArrowUp,
  Lock as LockIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Paper,
  Snackbar,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
// Assuming these components exist and paths are correct
import EditGameForm from "@/components/EditGame/EditGameForm";
import GamePlayersContainer from "./GamePlayersContainer";
// Removed NoLogoAvatar import

type CompactGameProps = {
  game: GameHistoryType;
  isAdmin: boolean; // Receive admin status directly
};

const CompactGame = ({ game, isAdmin }: CompactGameProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const theme = useTheme();

  // Format date concisely
  const dateFormatted = new Date(game.match_date).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric" }
  );

  // Edit window logic
  const threeDaysInMilliseconds = 3 * 24 * 60 * 60 * 1000;
  const gameDate = new Date(game.match_date);
  const now = new Date();
  const isWithinEditWindow =
    now.getTime() - gameDate.getTime() <= threeDaysInMilliseconds;

  const handleEditClick = () => {
    if (!isAdmin) return; // Guard
    if (isWithinEditWindow) {
      setEditing((prev) => !prev);
      if (expanded && !editing) {
        // Collapse if expanding edit form
        setExpanded(false);
      }
    } else {
      setSnackbarMessage(
        "This game cannot be edited as it is older than 3 days."
      );
      setSnackbarOpen(true);
    }
  };

  const handleToggleExpand = () => {
    if (editing) setEditing(false); // Close edit form if expanding details
    setExpanded((prev) => !prev);
  };

  const handleCloseSnackbar = (
    _event?: React.SyntheticEvent | Event, // Make event optional
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Paper
      elevation={1} // Reduce elevation slightly
      // Reduced padding (p: 1.5)
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        p: 1.5,
        width: "100%",
      }}
    >
      {/* Main Info Row */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
      >
        {/* Left Side: Squads & Date */}
        <Box
          display="flex"
          flexDirection="column"
          gap={0.5}
          flexGrow={1}
          minWidth={0}
        >
          {" "}
          {/* Allow shrinking */}
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {" "}
            {/* Allow wrap */}
            {/* Squad A */}
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                height={12}
                width={12}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                fontWeight="medium"
                noWrap
                title={game.squadA.info.name}
              >
                {" "}
                {/* Use body2, noWrap */}
                {game.squadA.info.name}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontStyle: "italic", mx: 0.5 }}>
              vs.
            </Typography>
            {/* Squad B */}
            <Box display="flex" alignItems="center" gap={0.5}>
              <Box
                height={12}
                width={12}
                sx={{
                  backgroundColor: theme.palette.secondary.main,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                fontWeight="medium"
                noWrap
                title={game.squadB.info.name}
              >
                {" "}
                {/* Use body2, noWrap */}
                {game.squadB.info.name}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {" "}
            {/* Smaller date */}
            {dateFormatted}
          </Typography>
        </Box>

        {/* Right Side: Score & Weight */}
        <Box
          display="flex"
          flexDirection="column"
          alignItems="flex-end"
          flexShrink={0}
        >
          <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
            {" "}
            {/* Adjust line height */}
            {game.squad_a_score}-{game.squad_b_score}
          </Typography>
          {game.game_weight && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontStyle: "italic", textTransform: "capitalize" }}
            >
              {game.game_weight}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Removed IndividualPlayerStats */}

      {/* Action Buttons Row */}
      <Box display="flex" justifyContent="space-between" mt={1.5}>
        {" "}
        {/* Reduced margin */}
        <Button
          onClick={handleToggleExpand}
          color="inherit"
          variant="text"
          size="small"
          sx={{
            fontWeight: "bold",
            p: 0.5,
            minWidth: "auto",
            fontSize: "0.75rem",
          }} // Smaller text/padding
          startIcon={
            expanded ? (
              <KeyboardDoubleArrowUp fontSize="small" />
            ) : (
              <KeyboardDoubleArrowDown fontSize="small" />
            )
          }
        >
          {expanded ? "Hide Details" : "See Details"}
        </Button>
        {isAdmin && (
          <Button
            variant="text"
            size="small"
            color={isWithinEditWindow ? "secondary" : "inherit"}
            startIcon={
              !isWithinEditWindow ? <LockIcon fontSize="small" /> : null
            }
            onClick={handleEditClick}
            sx={{
              fontWeight: "bold",
              fontSize: "0.75rem", // Smaller text
              p: 0.5,
              minWidth: "auto",
              color: !isWithinEditWindow
                ? theme.palette.action.disabled
                : editing
                ? theme.palette.warning.main
                : theme.palette.secondary.main, // Indicate close state
            }}
          >
            {editing ? "Close Edit" : "Edit"}
          </Button>
        )}
      </Box>

      {/* Collapsible Content */}
      {/* Render GamePlayersContainer when expanded and not editing */}
      <Collapse in={expanded && !editing} timeout="auto" unmountOnExit>
        <Box mt={1} borderTop={`1px solid ${theme.palette.divider}`}>
          <GamePlayersContainer game={game} singleGame={false} small={true} />
          {/* Pass game prop */}
        </Box>
      </Collapse>
      {/* Render EditGameForm when editing */}
      <Collapse in={editing} timeout="auto" unmountOnExit>
        <Box mt={1.5} pt={1.5} borderTop={`1px solid ${theme.palette.divider}`}>
          <EditGameForm gameId={game.id} />
          {/* Close form on success */}
        </Box>
      </Collapse>

      {/* Snackbar for edit message */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000} // Slightly shorter duration
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }} // Center maybe better
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="warning"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default CompactGame;
