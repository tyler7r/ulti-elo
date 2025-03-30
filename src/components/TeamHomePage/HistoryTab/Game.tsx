import EditGameForm from "@/components/GameEdits/EditGameForm";
import { useAuth } from "@/contexts/AuthContext";
import { GameHistoryType } from "@/lib/types";
import {
  KeyboardDoubleArrowDown,
  KeyboardDoubleArrowUp,
} from "@mui/icons-material";
import LockIcon from "@mui/icons-material/Lock";
import {
  Alert,
  Box,
  Button,
  Snackbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import GamePlayers from "./GamePlayers";

type GameProps = {
  game: GameHistoryType;
};

const Game = ({ game }: GameProps) => {
  const { userRoles } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const dateFormatted = new Date(game.match_date).toLocaleDateString();
  const [editing, setEditing] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isAdmin = userRoles.find((role) => role.team_id === game.team_id); // Check if screen is medium size or smaller
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const threeDaysInMilliseconds = 3 * 24 * 60 * 60 * 1000;
  const gameDate = new Date(game.match_date);
  const now = new Date();
  const isWithinEditWindow =
    now.getTime() - gameDate.getTime() <= threeDaysInMilliseconds;

  const handleEditClick = () => {
    if (isWithinEditWindow) {
      setEditing((prev) => !prev);
      if (expanded) {
        setExpanded(false);
      }
    } else {
      setSnackbarMessage(
        "This game cannot be edited as it is older than 3 days."
      );
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (event) event.preventDefault();
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box
      className="p-4 rounded-sm shadow-md w-full"
      sx={{ border: `1px solid ${theme.palette.divider}` }}
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" }, // Column on extra-small, row on medium and up
              alignItems: { xs: "start", sm: "center" },
              justifyContent: "center",
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 1,
                width: { xs: "100%", md: "auto" }, // Ensure full width on mobile for alignment
                justifyContent: { xs: "center", md: "flex-start" }, // Center on mobile, left on desktop
              }}
            >
              <div className="flex items-center gap-1 text-nowrap">
                <Box
                  height={15}
                  width={15}
                  sx={{ backgroundColor: theme.palette.primary.main }}
                />
                <Typography variant="body1" fontWeight={"bold"}>
                  {game.squadA.info.name}
                </Typography>
              </div>
              <Typography fontWeight={"italic"} variant="body2">
                vs.
              </Typography>
            </Box>
            <div
              className="flex items-center gap-1 text-nowrap"
              style={{ justifyContent: isMobile ? "center" : "flex-start" }}
            >
              <Box
                height={15}
                width={15}
                sx={{ backgroundColor: theme.palette.secondary.main }}
              />
              <Typography variant="body1" fontWeight={"bold"}>
                {game.squadB.info.name}
              </Typography>
            </div>
          </Box>
          <p className="text-sm italic">{dateFormatted}</p>
        </div>
        <div>
          <p className="font-bold text-nowrap">
            {game.squad_a_score} - {game.squad_b_score}
          </p>
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <Button
          onClick={() => {
            if (editing) setEditing(false);
            setExpanded(!expanded);
          }}
          color="inherit"
          variant="text"
          sx={{ fontWeight: "bold" }}
          className="flex items-center justify-center gap-1"
          size="small"
        >
          {expanded ? "Hide" : "See More"}
          {expanded ? (
            <KeyboardDoubleArrowUp color="disabled" fontSize="small" />
          ) : (
            <KeyboardDoubleArrowDown color="disabled" fontSize="small" />
          )}
        </Button>
        {isAdmin && (
          <Button
            variant="text"
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
            {!editing ? "Edit" : "Close"}
          </Button>
        )}
      </div>
      {expanded && (
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <GamePlayers squad={game.squadA} isSquadA={true} />
          <GamePlayers squad={game.squadB} isSquadA={false} />
        </div>
      )}
      {editing && <EditGameForm gameId={game.id} />}
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

export default Game;
