// /components/TeamSettings/TeamSeasonsManager.tsx (Example path)

import { getActiveSeason } from "@/lib/getActiveSeason";
import { SeasonType, TeamType } from "@/lib/types"; // Adjust path
import { endAndStartNextSeason } from "@/pages/api/end-season";
import EventAvailableIcon from "@mui/icons-material/EventAvailable"; // Icon for active season
import SkipNextIcon from "@mui/icons-material/SkipNext"; // Icon for next season button
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import PastSeasonsList from "../HistoryTab/PastSeasonsList";
import ConfirmEndSeasonModal from "./ConfirmEndSeasonModal"; // Import the new modal
import NoAccessPage from "./NoAccess"; // Assuming this exists

interface TeamSeasonsManagerProps {
  team: TeamType;
  isAdmin: boolean;
  ownerName: string | undefined; // Keep if used by NoAccessPage
}

const TeamSeasonsManager = ({
  team,
  isAdmin,
  ownerName,
}: TeamSeasonsManagerProps) => {
  const theme = useTheme();
  const [activeSeason, setActiveSeason] = useState<SeasonType | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading for initial fetch
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false); // Loading for button action
  // State for the confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Fetch active season info
  const fetchActive = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { season, error: fetchError } = await getActiveSeason(team.id);
    if (fetchError) {
      setError(fetchError);
    }
    setActiveSeason(season);
    setIsLoading(false);
  }, [team.id]);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  // --- Modal Handlers ---
  const handleOpenConfirmModal = () => {
    if (!isAdmin || !activeSeason) return;
    setError(null); // Clear errors before opening modal
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    // Only close if not currently processing the action
    if (!actionLoading) {
      setIsConfirmModalOpen(false);
    }
  };

  // --- Action Handler (Called by Modal Confirm) ---
  const executeEndAndStartNext = async () => {
    if (!isAdmin || !activeSeason) return; // Should not happen if button enabled

    setActionLoading(true); // Start loading indicator in modal
    setError(null);
    const { newSeason, error: actionError } = await endAndStartNextSeason(
      team.id
    );
    setActionLoading(false); // Stop loading indicator

    if (actionError) {
      setError(actionError); // Show error in the main component
      handleCloseConfirmModal(); // Close modal even on error
    } else {
      setActiveSeason(newSeason); // Update displayed active season
      handleCloseConfirmModal(); // Close the modal
    }
  };

  // --- Render ---
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Use NoAccessPage if not admin
  if (!isAdmin) {
    return <NoAccessPage team={team} ownerName={ownerName} isAdmin={isAdmin} />;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Manage Seasons
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Active Season Info */}
      <Paper
        elevation={2}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          width: "100%",
          mb: 2,
          p: 2,
          borderRadius: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <EventAvailableIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Active Season:{" "}
            {activeSeason ? `S${activeSeason.season_no}` : "None"}
          </Typography>
        </Box>
        {activeSeason ? (
          <Typography variant="body2" color="text.secondary">
            Started: {format(new Date(activeSeason.start_date), "PPP")}
          </Typography>
        ) : (
          <Typography sx={{ fontStyle: "italic", color: "text.secondary" }}>
            No active season found. A new one should be created automatically
            with the team. If not, contact support.
          </Typography>
        )}
      </Paper>

      {/* Admin Action Button */}
      {isAdmin && activeSeason && (
        <Box sx={{ display: "flex", mb: 3 }}>
          <Button
            variant="contained"
            color="primary" // Keep warning color for emphasis
            onClick={handleOpenConfirmModal} // Open the modal first
            disabled={actionLoading} // Disable button while modal action is loading
            startIcon={<SkipNextIcon />}
          >
            {/* Button text doesn't need loading state, modal handles it */}
            End S{activeSeason.season_no} & Start S{activeSeason.season_no + 1}
          </Button>
        </Box>
      )}
      {isAdmin &&
        !activeSeason &&
        !isLoading && ( // Show if loading is done and still no active season
          <Alert severity="warning" sx={{ mb: 3 }}>
            Cannot find an active season. Please contact support or check
            database integrity.
          </Alert>
        )}

      <Divider sx={{ my: 2 }} />

      {/* Past Seasons */}
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="h6" fontWeight="bold">
          Season History
        </Typography>
      </Box>
      {/* Pass teamId */}
      <PastSeasonsList teamId={team.id} />

      {/* Confirmation Modal */}
      <ConfirmEndSeasonModal
        open={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={executeEndAndStartNext} // Pass the actual execution function
        currentSeasonNo={activeSeason?.season_no ?? null}
        nextSeasonNo={activeSeason ? activeSeason.season_no + 1 : null}
        isLoading={actionLoading} // Pass action loading state to modal
      />
    </Box>
  );
};

export default TeamSeasonsManager;
