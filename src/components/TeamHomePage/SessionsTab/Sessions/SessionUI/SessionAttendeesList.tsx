// /components/Sessions/SessionAttendeesList.tsx (Adjust path as needed)
import { supabase } from "@/lib/supabase"; // Adjust path
import { PlayerTeamType, SquadWithPlayerDetails } from "@/lib/types"; // Adjust path
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import AssignNewPlayersModal, {
  NewPlayerAssignmentData,
} from "./AssignNewPlayersModal";
import ConfirmRemoveAttendeeModal from "./HelperModals/ConfirmRemoveAttendee";
import SquadPlayerList from "./SquadPlayerList";

type SessionAttendeesListProps = {
  attendees: PlayerTeamType[]; // Current attendees in the session
  squads: SquadWithPlayerDetails[]; // All squads for the session (with session_round)
  sessionId: string;
  teamId: string;
  onAttendeesUpdated: () => void; // Callback to refresh parent state
  isAdmin: boolean;
  isActive: boolean;
};

const SessionAttendeesList = ({
  attendees,
  squads,
  sessionId,
  teamId,
  onAttendeesUpdated,
  isAdmin,
  isActive,
}: SessionAttendeesListProps) => {
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For async operations
  const [error, setError] = useState<string | null>(null);

  // State for Adding Players
  const [allTeamPlayers, setAllTeamPlayers] = useState<PlayerTeamType[]>([]); // All players on the team
  const [playersToAdd, setPlayersToAdd] = useState<PlayerTeamType[]>([]); // Players selected in Autocomplete
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false); // Controls the assignment modal

  // State for Removing Players
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<PlayerTeamType | null>(
    null
  );

  // --- Memoized Data ---
  // Available players (all team players NOT already in the session)
  const availablePlayersToAdd = useMemo(() => {
    const currentAttendeeIds = new Set(attendees.map((a) => a.pt_id));
    return allTeamPlayers.filter((p) => !currentAttendeeIds.has(p.pt_id));
  }, [allTeamPlayers, attendees]);

  // Group squads by round number for assignment UI
  const squadsByRound = useMemo(() => {
    const grouped: Record<number, SquadWithPlayerDetails[]> = {};
    squads.forEach((squad) => {
      const roundNo = squad.session_round;
      if (roundNo === null || roundNo === undefined) return;
      if (!grouped[roundNo]) grouped[roundNo] = [];
      grouped[roundNo].push(squad);
    });
    const sortedGrouped: Record<number, SquadWithPlayerDetails[]> = {};
    Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((index) => {
        sortedGrouped[index] = grouped[index];
      });
    return sortedGrouped;
  }, [squads]);
  const roundNumbers = useMemo(
    () => Object.keys(squadsByRound).map(Number),
    [squadsByRound]
  );

  // --- Effects ---
  // Fetch all team players when editing mode is entered
  useEffect(() => {
    // Fetch only if editing, admin, teamId is present, and list is empty
    if (
      isEditing &&
      isAdmin &&
      teamId &&
      isActive &&
      allTeamPlayers.length === 0
    ) {
      let isMounted = true; // Prevent state update if component unmounts
      const fetchTeamPlayers = async () => {
        setIsLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
          .from("player_teams")
          // Ensure you select all fields needed by PlayerTeamType AND the nested player name
          .select(`*, player:players!inner(name)`)
          .eq("team_id", teamId);

        if (!isMounted) return; // Don't update state if unmounted

        if (fetchError) {
          console.error("Error fetching team players:", fetchError);
          setError("Could not load team players list.");
        } else if (data) {
          setAllTeamPlayers(data);
        } else {
          setAllTeamPlayers([]); // Set empty if no data
        }
        setIsLoading(false);
      };

      fetchTeamPlayers();

      // Cleanup function to prevent state updates on unmounted component
      return () => {
        isMounted = false;
      };
    } else if (!isEditing) {
      // Reset add state when exiting edit mode
      setPlayersToAdd([]);
      // Don't clear allTeamPlayers here, keep it cached while component is mounted
      setError(null);
      setIsAssignModalOpen(false);
    }
    // Only refetch if isEditing, isAdmin, or teamId changes. Avoid allTeamPlayers.length as dependency.
  }, [isEditing, isAdmin, teamId, allTeamPlayers.length, isActive]);

  // --- Handlers ---
  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
    // Reset state only when EXITTING edit mode
    if (isEditing) {
      setPlayersToAdd([]);
      setError(null);
      setIsAssignModalOpen(false);
    }
  };

  // Add Player Handlers
  const handleOpenAssignModal = () => {
    if (playersToAdd.length === 0 || !isAdmin || !isActive) return;
    setError(null); // Clear previous errors
    setIsAssignModalOpen(true); // Open the assignment modal
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
  };

  // Called by AssignNewPlayersModal on confirm
  const handleConfirmAssignments = async (
    assignments: NewPlayerAssignmentData
  ) => {
    if (playersToAdd.length === 0 || !isAdmin || !isActive) return;
    setIsLoading(true);
    setError(null);

    const attendeeInserts = playersToAdd.map((p) => ({
      session_id: sessionId,
      pt_id: p.pt_id,
    }));
    const playerAssignmentInserts: { pt_id: string; squad_id: string }[] = [];

    // Build inserts based on assignments received from modal
    playersToAdd.forEach((player) => {
      let assignmentMissing = false; // Flag per player
      roundNumbers.forEach((roundNo) => {
        const squadId = assignments[player.pt_id]?.[roundNo];
        if (squadId) {
          playerAssignmentInserts.push({
            pt_id: player.pt_id,
            squad_id: squadId,
          });
        } else {
          // Should be validated in modal, but handle defensively
          console.error(
            `Missing assignment for player ${player.pt_id} in round ${roundNo}`
          );
          setError(
            `Save Error: Missing assignment for ${player.player.name} in Round ${roundNo}.`
          );
          assignmentMissing = true;
        }
      });
      if (assignmentMissing) return; // Stop processing this player if assignment missing
    });

    // If an error was set due to missing assignment, stop before DB calls
    if (error) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Insert into session_attendees
      const { error: attendeeError } = await supabase
        .from("session_attendees")
        .insert(attendeeInserts);
      if (attendeeError)
        throw new Error(`Failed to add attendees: ${attendeeError.message}`);

      // 2. Insert into squad_players
      if (playerAssignmentInserts.length > 0) {
        const { error: squadPlayerError } = await supabase
          .from("squad_players")
          .insert(playerAssignmentInserts);
        if (squadPlayerError)
          throw new Error(
            `Failed to assign players to squads: ${squadPlayerError.message}`
          );
      }

      // Success
      onAttendeesUpdated(); // Refresh parent state
      handleCloseAssignModal(); // Close the assignment modal
      setPlayersToAdd([]); // Clear selected players after successful save
    } catch (err) {
      console.error("Error saving added players:", err);
      setError(`Save failed: ${err}`);
      // Re-throw error to be caught by modal's handler if needed
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove Player Handlers
  const handleOpenRemoveModal = (player: PlayerTeamType) => {
    if (!isAdmin || !isActive) return;
    setPlayerToRemove(player);
    setIsRemoveModalOpen(true);
  };
  const handleCloseRemoveModal = () => {
    setIsRemoveModalOpen(false);
    setPlayerToRemove(null);
  };
  const handleConfirmRemove = async () => {
    if (!playerToRemove || !isAdmin || !isActive) return;
    setIsLoading(true);
    setError(null);
    const playerToRemoveId = playerToRemove.pt_id;

    try {
      const { error: attendeeDeleteError } = await supabase
        .from("session_attendees")
        .delete()
        .match({ session_id: sessionId, pt_id: playerToRemoveId });
      if (attendeeDeleteError)
        throw new Error(
          `Failed to remove attendee: ${attendeeDeleteError.message}`
        );

      // 2. Delete from squad_players for all squads in this session
      const sessionSquadIds = squads.map((s) => s.id);
      if (sessionSquadIds.length > 0) {
        const { error: squadPlayerDeleteError } = await supabase
          .from("squad_players")
          .delete()
          .eq("pt_id", playerToRemoveId)
          .in("squad_id", sessionSquadIds);
        if (squadPlayerDeleteError)
          console.warn(
            `Issue removing player from squads (might not have been assigned): ${squadPlayerDeleteError.message}`
          );
      }

      // Success
      onAttendeesUpdated(); // Refresh parent state
    } catch (err) {
      console.error("Error removing attendee:", err);
      setError(`Removal failed: ${err}`);
    } finally {
      setIsLoading(false);
      handleCloseRemoveModal(); // Close modal regardless
    }
  };

  // --- Render Logic ---
  return (
    <Box p={2}>
      {/* Header & Edit/Done Buttons */}
      <Box
        display="flex"
        justifyContent={isEditing ? "center" : "space-between"}
        alignItems={isEditing ? "normal" : "center"}
        mb={isEditing ? 1 : 2}
        flexDirection={isEditing ? "column" : "row"}
        gap={isEditing ? 1 : 0}
      >
        <Typography variant="h5" fontWeight={"bold"}>
          Session Attendees ({attendees.length})
        </Typography>
        {isAdmin && (
          <Box display="flex" gap={1}>
            {isEditing && (
              <Button
                onClick={toggleEditMode}
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<CancelIcon />}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              variant={isEditing ? "contained" : "outlined"}
              color="primary"
              startIcon={isEditing ? <CheckCircleOutlineIcon /> : <EditIcon />}
              onClick={toggleEditMode}
              size="small"
              disabled={isLoading && isEditing}
            >
              {isEditing ? "Save" : "Edit"}
            </Button>
          </Box>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* --- Editing UI --- */}
      {isEditing && isAdmin && isActive && (
        <Paper elevation={2} sx={{ p: 2, mb: 3, mt: 2 }}>
          <Typography
            variant="body1"
            gutterBottom
            fontWeight={"bold"}
            mb={2}
            color="primary"
          >
            Add Players to Session
          </Typography>
          <Autocomplete
            multiple
            id="add-attendees-select"
            options={availablePlayersToAdd}
            getOptionLabel={(option) => option.player?.name ?? "Unknown"}
            value={playersToAdd}
            onChange={(_event, newValue) => setPlayersToAdd(newValue)}
            isOptionEqualToValue={(option, value) =>
              option.pt_id === value.pt_id
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Players to Add"
                placeholder="Search players..."
                size="small"
              />
            )}
            disabled={isLoading}
            loading={isLoading && allTeamPlayers.length === 0} // Show loading indicator on Autocomplete
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleOpenAssignModal} // Open the assignment modal
            disabled={playersToAdd.length === 0 || isLoading}
            startIcon={<PersonAddIcon />}
          >
            Assign Squads for Selected ({playersToAdd.length})
          </Button>
        </Paper>
      )}
      <List dense disablePadding>
        {attendees.length === 0 && (
          <ListItem>
            <ListItemText
              primary="No attendees currently in this session."
              sx={{ fontStyle: "italic" }}
            />
          </ListItem>
        )}
      </List>
      <SquadPlayerList
        players={attendees}
        handleOpenModal={handleOpenRemoveModal}
        isEditing={isEditing}
        disablePlayerClick={isEditing}
        noEloChange={true}
      />
      <ConfirmRemoveAttendeeModal
        open={isRemoveModalOpen}
        onClose={handleCloseRemoveModal}
        onConfirmRemove={handleConfirmRemove}
        player={playerToRemove}
      />
      {/* Assign New Players Modal */}
      <AssignNewPlayersModal
        open={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        playersToAssign={playersToAdd}
        squadsByRound={squadsByRound}
        roundNumbers={roundNumbers}
        onConfirmAssignments={handleConfirmAssignments} // Pass the save handler
        isLoading={isLoading}
        attendees={attendees}
      />
    </Box>
  );
};

export default SessionAttendeesList;
