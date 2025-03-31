import EditGameForm from "@/components/EditGame/EditGameForm";
import { useAuth } from "@/contexts/AuthContext";
import { GameHistoryType } from "@/lib/types";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
import { useRouter } from "next/router";
import { useState } from "react";
import GamePlayersContainer from "./GamePlayersContainer";

type SingleGameViewProps = {
  game: GameHistoryType;
};

const SingleGameView = ({ game }: SingleGameViewProps) => {
  const { userRoles } = useAuth();
  const router = useRouter();
  const dateFormatted = new Date(game.match_date).toLocaleDateString();
  const [editing, setEditing] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isAdmin = userRoles.find((role) => role.team_id === game.team_id);
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
    <div>
      <div className="w-full p-2">
        <Button
          color="primary"
          size="small"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={() => void router.push(`/team/${game.team_id}`)}
        >
          Go to Team Page
        </Button>
      </div>
      <Box
        className="px-4 py-2 rounded-md w-full mx-auto" // Increased padding, margin for centering
      >
        <Typography variant="h5" gutterBottom fontWeight={"bold"}>
          Game Details
        </Typography>
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col gap-1">
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
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
                  width: { xs: "100%", md: "auto" },
                  justifyContent: { xs: "center", md: "flex-start" },
                }}
              >
                <div className="flex items-center gap-1 text-nowrap">
                  <Box
                    height={20}
                    width={20}
                    sx={{ backgroundColor: theme.palette.primary.main }}
                  />
                  <Typography variant="h5" fontWeight={"bold"}>
                    {game.squadA.info.name}
                  </Typography>
                </div>
                <Typography fontWeight={"italic"} variant="h6">
                  vs.
                </Typography>
              </Box>
              <div
                className="flex items-center gap-1 text-nowrap"
                style={{ justifyContent: isMobile ? "center" : "flex-start" }}
              >
                <Box
                  height={20}
                  width={20}
                  sx={{ backgroundColor: theme.palette.secondary.main }}
                />
                <Typography variant="h5" fontWeight={"bold"}>
                  {game.squadB.info.name}
                </Typography>
              </div>
            </Box>
            <Typography className="text-sm italic">{dateFormatted}</Typography>
          </div>
          <div>
            <Typography
              fontWeight={"bold"}
              sx={{ textWrap: "nowrap" }}
              variant="h5"
            >
              {game.squad_a_score} - {game.squad_b_score}
            </Typography>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          {isAdmin && (
            <Button
              variant="outlined"
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
        {!editing && <GamePlayersContainer game={game} singleGame={true} />}
        {editing && (
          <Box mt={4}>
            <EditGameForm gameId={game.id} singleGame={true} />
          </Box>
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
    </div>
  );
};

export default SingleGameView;
