import NoLogoAvatar from "@/components/Utils/NoLogoAvatar";
import { supabase } from "@/lib/supabase";
import { PlayerType, TeamType } from "@/lib/types";
import { AddCircleOutline } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Modal,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import AddPlayersModal from "./AddPlayersModal";
import NoAccessPage from "./NoAccess";

type TeamPlayer = {
  player_id: string;
  elo: number;
  player: {
    name: string;
  };
};

type TeamPlayersTabProps = {
  team: TeamType;
  teamPlayers: TeamPlayer[];
  onPlayersUpdated: () => void;
  setSnackbarMessage: (message: string) => void;
  setSnackbarOpen: (open: boolean) => void;
  isAdmin: boolean;
  ownerName: string | undefined;
};

const TeamPlayersTab = ({
  team,
  teamPlayers,
  onPlayersUpdated,
  setSnackbarMessage,
  setSnackbarOpen,
  isAdmin,
  ownerName,
}: TeamPlayersTabProps) => {
  const [availablePlayers, setAvailablePlayers] = useState<PlayerType[]>([]);
  const [loadingAvailablePlayers, setLoadingAvailablePlayers] = useState(true);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<TeamPlayer | null>(null);
  const [isAddPlayersOpen, setIsAddPlayersOpen] = useState(false);

  const router = useRouter();

  const fetchAvailablePlayers = useCallback(async () => {
    if (!team.id) return;
    setLoadingAvailablePlayers(true);
    const { data: allPlayersData, error: allPlayersError } = await supabase
      .from("players")
      .select("id, name");
    if (allPlayersError) {
      console.error("Error fetching all players:", allPlayersError.message);
      setSnackbarMessage(
        `Error fetching all players: ${allPlayersError.message}`
      );
      setSnackbarOpen(true);
    } else {
      const currentPlayersIds = teamPlayers.map((player) => player.player_id);
      const filteredPlayers = (allPlayersData || []).filter(
        (player) => !currentPlayersIds.includes(player.id)
      );
      setAvailablePlayers(filteredPlayers);
    }
    setLoadingAvailablePlayers(false);
  }, [team, teamPlayers, setSnackbarMessage, setSnackbarOpen]);

  useEffect(() => {
    fetchAvailablePlayers();
  }, [fetchAvailablePlayers]);

  const handleRemoveTeamPlayer = async (playerIdToRemove: string) => {
    if (!team.id || !playerIdToRemove || !isAdmin) return;
    const { error } = await supabase
      .from("player_teams")
      .delete()
      .eq("team_id", team.id)
      .eq("player_id", playerIdToRemove);

    if (error) {
      console.error("Error removing team player:", error.message);
      setSnackbarMessage(`Error removing team player: ${error.message}`);
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage("Player removed from team successfully!");
      setSnackbarOpen(true);
      onPlayersUpdated();
      fetchAvailablePlayers(); // Refresh available players
    }
    setIsAddPlayersOpen(false);
  };

  const handleRemoveButtonClick = (player: TeamPlayer) => {
    if (!isAdmin) return;
    setPlayerToDelete(player);
    setConfirmDeleteDialogOpen(true);
  };

  const handleCloseConfirmDeleteDialog = () => {
    setConfirmDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (playerToDelete) {
      handleRemoveTeamPlayer(playerToDelete.player_id);
    }
    setConfirmDeleteDialogOpen(false);
    setPlayerToDelete(null);
  };

  const handleOpenAddPlayers = () => {
    setIsAddPlayersOpen(true);
  };

  const handleCloseAddPlayers = () => {
    setIsAddPlayersOpen(false);
  };

  const updateSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handlePlayerClick = (playerId: string) => {
    void router.push(`/player/${playerId}`);
  };

  return !isAdmin ? (
    <NoAccessPage team={team} ownerName={ownerName} isAdmin={isAdmin} />
  ) : (
    <Box p={2}>
      <AddPlayersModal
        team={team}
        onClose={handleCloseAddPlayers}
        open={isAddPlayersOpen}
        availablePlayers={availablePlayers}
        fetchAvailablePlayers={fetchAvailablePlayers}
        onPlayersUpdated={onPlayersUpdated}
        isAdmin={isAdmin}
        updateSnackbar={updateSnackbar}
        loadingAvailablePlayers={loadingAvailablePlayers}
      />
      <Box
        sx={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight={"bold"}>
          Team Players ({teamPlayers.length})
        </Typography>
        {isAdmin && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddCircleOutline />}
            onClick={handleOpenAddPlayers}
          >
            Add
          </Button>
        )}
      </Box>
      <List dense sx={{ px: 1 }}>
        {teamPlayers.map((player) => (
          <ListItem
            key={player.player_id}
            sx={{ position: "relative" }}
            disablePadding
          >
            <ListItemAvatar>
              <NoLogoAvatar size="small" name={player.player.name} />
            </ListItemAvatar>
            <ListItemText
              primary={player.player.name || "Unknown Player"}
              secondary={`ELO: ${player.elo}`}
              onClick={() => handlePlayerClick(player.player_id)}
              sx={{ cursor: "pointer" }}
            />
            <Box sx={{ position: "absolute", right: 16 }}>
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleRemoveButtonClick(player)}
              >
                <PersonRemoveIcon color="error" />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <Modal
        open={confirmDeleteDialogOpen}
        onClose={handleCloseConfirmDeleteDialog}
        aria-labelledby="rank-info-modal-title"
        aria-describedby="rank-info-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: 600,
            maxHeight: "80vh",
            overflow: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            width: { xs: "90%", md: "500px" }, // Similar width
            p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
            borderRadius: 2,
          }}
        >
          <IconButton
            onClick={handleCloseConfirmDeleteDialog}
            sx={{ position: "absolute", top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            id="alert-dialog-title"
            fontWeight={"bold"}
            color="error"
            variant="h5"
            mb={1}
          >
            {"Confirm Delete"}
          </Typography>
          <Typography id="alert-dialog-description">
            {`Are you sure you want to remove ${
              playerToDelete ? `${playerToDelete.player.name}` : "this player."
            }`}
            ?
          </Typography>
          <Box
            display={"flex"}
            width={"100%"}
            justifyContent={"flex-end"}
            gap={1}
            alignItems={"center"}
            mt={2}
          >
            <Button
              onClick={handleCloseConfirmDeleteDialog}
              variant="outlined"
              color="primary"
              size="small"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmDelete}
              color="error"
              size="small"
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default TeamPlayersTab;
