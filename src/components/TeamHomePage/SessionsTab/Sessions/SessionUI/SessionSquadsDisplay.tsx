import { calculateAverageElo } from "@/lib/getAverageElo"; // Import helper
import { supabase } from "@/lib/supabase"; // Import supabase client
import { PlayerTeamType, SquadWithPlayerDetails } from "@/lib/types"; // Assuming base SquadType is sufficient here unless session_round needed
import { generateAndSaveGameSchedule } from "@/pages/api/create-session";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever"; // Icon for round delete
import EditIcon from "@mui/icons-material/Edit"; // Import Edit icon
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  List,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { SessionSquad, squadColors } from "../CreateSession/CreateSquads";
import EditRoundSquadsModal from "./EditRoundSquadsModal";
import ConfirmDeleteSessionRoundModal from "./HelperModals/ConfirmDeleteSessionRoundModal";
import SquadPlayerList from "./SquadPlayerList";

type SessionSquadsDisplayProps = {
  squads: SquadWithPlayerDetails[]; // Expect detailed squads with session_round
  sessionId: string;
  teamId: string;
  attendees: PlayerTeamType[];
  onSquadsUpdated: () => void; // Callback to refresh parent state
  isAdmin: boolean;
  isActive: boolean;
};

const SessionSquadsDisplay = ({
  squads,
  sessionId,
  teamId,
  attendees,
  onSquadsUpdated,
  isAdmin,
  isActive,
}: SessionSquadsDisplayProps) => {
  const theme = useTheme();
  // State for modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoundData, setEditingRoundData] = useState<{
    roundNumber: number;
    initialData: SessionSquad[] | null;
  } | null>(null);
  // State for expanding/collapsing individual squads
  const [openSquadsUI, setOpenSquadsUI] = useState<Record<string, boolean>>({});
  const [isDeleteRoundModalOpen, setIsDeleteRoundModalOpen] =
    useState<boolean>(false);
  const [roundToDelete, setRoundToDelete] = useState<number | null>(null);
  // State for loading/error during delete/save operations
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Grouping Logic (Using session_round) ---
  const squadsByRound = useMemo(() => {
    const grouped: Record<number, SquadWithPlayerDetails[]> = {};
    squads.forEach((squad) => {
      const roundNo = squad.session_round; // Use the actual column value
      if (roundNo === null || roundNo === undefined) {
        console.warn(`Squad ${squad.id} missing session_round.`);
        return; // Skip squads without a round number
      }
      if (!grouped[roundNo]) {
        grouped[roundNo] = [];
      }
      grouped[roundNo].push(squad);
    });
    // Ensure rounds are sorted numerically
    const sortedGrouped: Record<number, SquadWithPlayerDetails[]> = {};
    Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((index) => {
        sortedGrouped[index] = grouped[index];
      });
    return sortedGrouped;
  }, [squads]);
  // --- End Grouping Logic ---

  // Toggle collapse state for individual squad details
  const toggleSquadDetails = (squadId: string) => {
    setOpenSquadsUI((prev) => ({ ...prev, [squadId]: !prev[squadId] }));
  };

  // --- Modal Handlers ---
  const handleOpenAddRoundModal = () => {
    if (!isAdmin) return;
    const nextRoundNumber =
      (Object.keys(squadsByRound).length > 0
        ? Math.max(...Object.keys(squadsByRound).map(Number))
        : 0) + 1;
    setEditingRoundData({ roundNumber: nextRoundNumber, initialData: null }); // Null initialData signifies 'add' mode
    setIsEditModalOpen(true);
  };

  const handleOpenEditRoundModal = (roundNumber: number) => {
    if (!isAdmin) return;
    const roundData = squadsByRound[roundNumber];
    if (!roundData) return; // Should exist if button is shown

    // Map detailed data to basic SessionSquad for the modal if needed, or adjust modal props
    const initialModalData: SessionSquad[] = roundData.map((sq) => ({
      id: sq.id,
      name: sq.name,
      // Map players correctly - assuming FetchedSquadPlayer structure
      players:
        (sq.squad_players
          ?.map((sp) => sp.player_teams)
          .filter((pt) => pt !== null) as PlayerTeamType[]) ?? [],
    }));

    setEditingRoundData({
      roundNumber: roundNumber,
      initialData: initialModalData,
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRoundData(null);
  };

  // --- Save Logic (Handles Add/Edit) ---
  const handleSaveRound = async (
    roundNumber: number,
    updatedSquads: SessionSquad[]
  ) => {
    if (!isAdmin) {
      throw new Error("Permission denied."); // Should not happen if buttons disabled
    }

    const isEditing = editingRoundData?.initialData !== null;
    setError(null);
    setIsLoading(false);

    try {
      if (isEditing) {
        const editedSquadIds = updatedSquads.map((s) => s.id);
        // 2. Delete existing squad_players for these squads in this session
        const { error: deleteError } = await supabase
          .from("squad_players")
          .delete()
          .in("squad_id", editedSquadIds);
        if (deleteError)
          throw new Error(
            `Failed to clear old players: ${deleteError.message}`
          );
        // 3. Prepare new squad_player inserts
        const newPlayerInserts: { pt_id: string; squad_id: string }[] = [];
        updatedSquads.forEach((squad) => {
          squad.players.forEach((player) => {
            newPlayerInserts.push({ pt_id: player.pt_id, squad_id: squad.id });
          });
        });
        // 4. Insert new player assignments
        if (newPlayerInserts.length > 0) {
          const { error: insertError } = await supabase
            .from("squad_players")
            .insert(newPlayerInserts);
          if (insertError)
            throw new Error(
              `Failed to insert new players: ${insertError.message}`
            );
        }
        const nameUpdates = updatedSquads
          .filter(
            (newSq) =>
              editingRoundData?.initialData?.find(
                (oldSq) => oldSq.id === newSq.id
              )?.name !== newSq.name
          )
          .map((sq) => ({ id: sq.id, name: sq.name, session_id: sessionId }));
        if (nameUpdates.length > 0) {
          const { error: nameUpdateError } = await supabase
            .from("squads")
            .upsert(nameUpdates);
          if (nameUpdateError)
            console.warn(
              "Failed to update squad names:",
              nameUpdateError.message
            );
        }
      } else {
        // 1. Prepare squad inserts
        const squadInserts = updatedSquads.map((squad) => ({
          id: squad.id, // Use ID generated in modal
          name: squad.name,
          session_id: sessionId,
          team_id: teamId,
          session_round: roundNumber, // Assign round number
        }));
        const { error: squadInsertError } = await supabase
          .from("squads")
          .insert(squadInserts);
        if (squadInsertError)
          throw new Error(
            `Failed to insert squads: ${squadInsertError.message}`
          );
        // 2. Prepare player inserts
        const playerInserts: { pt_id: string; squad_id: string }[] = [];
        updatedSquads.forEach((squad) => {
          squad.players.forEach((player) => {
            playerInserts.push({ pt_id: player.pt_id, squad_id: squad.id });
          });
        });
        // 3. Insert players
        if (playerInserts.length > 0) {
          const { error: playerInsertError } = await supabase
            .from("squad_players")
            .insert(playerInserts);
          if (playerInsertError) {
            // Attempt to roll back squad insertion? Complex. Log error for now.
            setError('"Player insert failed after squad insert!",');
            throw new Error(
              `Failed to insert players: ${playerInsertError.message}`
            );
          }
        }

        const { data: maxGameNumData, error: maxGameNumError } = await supabase
          .from("game_schedule")
          .select("game_number")
          .eq("session_id", sessionId)
          .order("game_number", { ascending: false })
          .limit(1)
          .maybeSingle(); // Use maybeSingle to handle sessions with no games yet

        if (maxGameNumError) {
          setError(`Error fetching max game number: ${maxGameNumError}`);
        }

        const startingGameNumber = (maxGameNumData?.game_number ?? 0) + 1;

        // Prepare data for the schedule generation function (only the new round)
        const newRoundData = [
          { round: updatedSquads, roundIndex: roundNumber - 1 },
        ];

        // Call the schedule generation function
        const { error: scheduleError } = await generateAndSaveGameSchedule(
          sessionId,
          newRoundData,
          startingGameNumber
        );

        if (scheduleError) {
          // Log warning, but don't fail the whole save since squads were added
          console.warn(
            "Failed to generate game schedule for the new round:",
            scheduleError
          );
        }
      }
      // If successful:
      onSquadsUpdated(); // Refresh parent state
      handleCloseEditModal(); // Close modal
    } catch (error) {
      setError(`Error in handleSaveRound: ${error}`);
      throw error;
    }
  };

  const handleOpenDeleteRoundModal = (roundNo: number) => {
    if (!isAdmin) return;
    setRoundToDelete(roundNo);
    setIsDeleteRoundModalOpen(true);
    setError(null); // Clear previous errors
  };

  const handleCloseDeleteRoundModal = () => {
    setIsDeleteRoundModalOpen(false);
    setRoundToDelete(null);
  };

  // --- Delete Round Logic ---
  const handleConfirmRoundDelete = async () => {
    if (roundToDelete === null || !isAdmin) return;
    setIsLoading(true);
    setError(null);
    const squadsInRoundToDelete = squadsByRound[roundToDelete] ?? [];
    const squadIdsToDelete = squadsInRoundToDelete.map((s) => s.id);

    try {
      // 1. Delete Game Schedule entries for this round
      if (squadIdsToDelete.length > 0) {
        // Only delete schedule if squads existed
        const { error: scheduleDeleteError } = await supabase
          .from("game_schedule")
          .delete()
          .eq("session_id", sessionId)
          .eq("round_no", roundToDelete); // Target the round number
        if (scheduleDeleteError)
          throw new Error(
            `Failed to delete schedule: ${scheduleDeleteError.message}`
          );
      }

      // 2. Delete Squad Players for the squads in this round
      if (squadIdsToDelete.length > 0) {
        const { error: playerDeleteError } = await supabase
          .from("squad_players")
          .delete()
          .in("squad_id", squadIdsToDelete);
        if (playerDeleteError)
          throw new Error(
            `Failed to delete squad players: ${playerDeleteError.message}`
          );
      }

      // 3. Delete the Squads themselves
      if (squadIdsToDelete.length > 0) {
        const { error: squadDeleteError } = await supabase
          .from("squads")
          .delete()
          .in("id", squadIdsToDelete);
        if (squadDeleteError)
          throw new Error(
            `Failed to delete squads: ${squadDeleteError.message}`
          );
      }
      onSquadsUpdated(); // Refresh parent state
      handleCloseDeleteRoundModal(); // Close modal on success
    } catch (error) {
      console.error(`Error deleting round ${roundToDelete}:`, error);
      // Keep modal open on error? Or close? Let's close it.
      handleCloseDeleteRoundModal();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={2}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
        mb={1}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" fontWeight={"bold"}>
            Session Squads
          </Typography>
          {isAdmin && isActive && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddCircleOutlineIcon fontSize="small" />}
              onClick={handleOpenAddRoundModal}
            >
              New Squads
            </Button>
          )}
        </Box>
        {isAdmin && isActive && (
          <Typography
            variant="caption"
            color="secondary"
            fontWeight={"bold"}
            fontStyle={"italic"}
          >
            Squad edits only effect future games played. Retroactive squad edits
            must be made on individual games.
          </Typography>
        )}
      </Box>

      {/* Display Squads by Round */}
      {Object.keys(squadsByRound).length === 0 ? (
        <Typography sx={{ fontStyle: "italic", textAlign: "center", my: 3 }}>
          No squads have been created for this session yet.
        </Typography>
      ) : (
        Object.entries(squadsByRound).map(([roundStr, roundSquads]) => {
          const roundNo = parseInt(roundStr);
          return (
            <Box key={`round-${roundNo}`} mb={3}>
              {/* Round Header with Edit Button */}
              <Box
                display={"flex"}
                width={"100%"}
                alignItems={"center"}
                gap={1}
                p={1}
                mb={1}
              >
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Round {roundNo} Squads
                </Typography>
                {isAdmin && isActive && (
                  <Box>
                    <IconButton
                      onClick={() => handleOpenEditRoundModal(roundNo)}
                      size="small"
                      color="primary"
                      title={`Edit Round ${roundNo} Squads`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleOpenDeleteRoundModal(roundNo)}
                      size="small"
                      color="error"
                      title={`Delete Round ${roundNo}`}
                      disabled={isLoading}
                    >
                      <DeleteForeverIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Squads Grid */}
              <Box
                display="grid"
                gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
                gap={2}
                px={2}
              >
                {roundSquads.map((squad) => {
                  const averageElo = calculateAverageElo(
                    (squad.squad_players
                      ?.map((sp) => sp.player_teams)
                      .filter((pt) => pt !== null) as PlayerTeamType[]) ?? []
                  );
                  const playerCount = squad.squad_players?.length ?? 0;
                  // Find color based on index within *this specific round*
                  const squadIndexInRound = roundSquads.findIndex(
                    (rs) => rs.id === squad.id
                  );
                  const squadColor =
                    squadColors[squadIndexInRound % squadColors.length];

                  return (
                    // Squad Paper with colored border
                    <Paper
                      key={squad.id}
                      sx={{
                        borderLeft: `6px solid ${squadColor}`,
                        overflow: "hidden",
                      }}
                    >
                      {/* Squad Header */}
                      <Box
                        sx={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.5,
                        }}
                        onClick={() => toggleSquadDetails(squad.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent={"space-around"}
                          width={"100%"}
                        >
                          <Typography variant="h6" fontWeight="bold">
                            {squad.name}
                          </Typography>
                          <Box
                            display={"flex"}
                            flexDirection={"column"}
                            gap={1}
                          >
                            <Chip
                              label={`Avg ELO: ${averageElo}`}
                              size="small"
                              variant="filled"
                            />
                            <Chip
                              label={`${playerCount} Players`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        <IconButton size="small" aria-label="show players">
                          {openSquadsUI[squad.id] ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </IconButton>
                      </Box>
                      {/* Collapsible Player List */}
                      <Collapse
                        in={openSquadsUI[squad.id] ?? false}
                        sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
                      >
                        <List dense sx={{ p: 1.5, pt: 1 }}>
                          {(squad.squad_players ?? []).length === 0 ? (
                            <Typography
                              variant="body2"
                              sx={{ fontStyle: "italic", textAlign: "center" }}
                            >
                              No players assigned.
                            </Typography>
                          ) : (
                            <SquadPlayerList
                              players={squad.squad_players}
                              squadName={squad.name}
                              color={squadColor}
                              noEloChange={true}
                            />
                          )}
                        </List>
                      </Collapse>
                    </Paper>
                  );
                })}
              </Box>
              <Divider sx={{ my: 3 }} />
            </Box>
          );
        })
      )}

      {/* Render the Edit/Add Modal */}
      {editingRoundData && (
        <EditRoundSquadsModal
          open={isEditModalOpen}
          onClose={handleCloseEditModal}
          attendees={attendees}
          roundNumber={editingRoundData.roundNumber}
          initialData={editingRoundData.initialData}
          onSave={handleSaveRound}
          teamId={teamId}
        />
      )}
      <ConfirmDeleteSessionRoundModal
        open={isDeleteRoundModalOpen}
        onClose={handleCloseDeleteRoundModal}
        onConfirmDelete={handleConfirmRoundDelete}
        roundNumber={roundToDelete ?? 0}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default SessionSquadsDisplay;
