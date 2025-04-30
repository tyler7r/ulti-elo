// /components/Session/EditAttendeesModal.tsx
import { supabase } from "@/lib/supabase";
import { PlayerTeamType, SquadType } from "@/lib/types";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Autocomplete,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Fade,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Modal,
  Radio,
  RadioGroup,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type EditAttendeesModalProps = {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  teamId: string;
  currentAttendees: PlayerTeamType[];
  sessionSquads: SquadType[]; // Current squads in the session
  onSaveSuccess: () => void;
};

// Style for the modal content
const style = {
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
};

// Step definitions for the modal flow when adding players
const steps = ["Select Attendees", "Assign New Attendees"];

const EditAttendeesModal = ({
  open,
  onClose,
  sessionId,
  teamId,
  currentAttendees,
  sessionSquads,
  onSaveSuccess,
}: EditAttendeesModalProps) => {
  const [allTeamPlayers, setAllTeamPlayers] = useState<PlayerTeamType[]>([]);
  const [selectedAttendees, setSelectedAttendees] =
    useState<PlayerTeamType[]>(currentAttendees);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const [attendeesToRemove, setAttendeesToRemove] = useState<PlayerTeamType[]>(
    []
  );
  const [attendeesToAdd, setAttendeesToAdd] = useState<PlayerTeamType[]>([]);
  const [activeStep, setActiveStep] = useState(0); // For add flow
  // State to hold assignments for new players: { [playerId: string]: { [roundIndex: number]: squadId } }
  const [newAttendeeAssignments, setNewAttendeeAssignments] = useState<
    Record<string, Record<number, string>>
  >({});

  // Fetch all players for the team when the modal opens
  useEffect(() => {
    if (open && teamId) {
      const fetchTeamPlayers = async () => {
        setLoading(true);
        setFetchError(null);
        const { data, error } = await supabase
          .from("player_teams")
          .select("*, player:players(name)") // Adjust select as needed
          .eq("team_id", teamId);

        if (error) {
          console.error("Error fetching team players:", error);
          setFetchError("Could not load team players. Please try again.");
        } else {
          setAllTeamPlayers(data || []);
        }
        setLoading(false);
      };
      fetchTeamPlayers();
    } else {
      // Reset state on close
      setAllTeamPlayers([]);
      setSelectedAttendees(currentAttendees);
      setFetchError(null);
      setSaveError(null);
      setActiveStep(0);
      setNewAttendeeAssignments({});
      setAttendeesToAdd([]);
      setAttendeesToRemove([]);
    }
  }, [open, teamId, currentAttendees]); // Add currentAttendees dependency to reset selection on reopen if needed

  const currentAttendeeIds = useMemo(
    () => new Set(currentAttendees.map((p) => p.pt_id)),
    [currentAttendees]
  );
  const selectedAttendeeIds = useMemo(
    () => new Set(selectedAttendees.map((p) => p.pt_id)),
    [selectedAttendees]
  );

  // Calculate diff only when needed
  const calculateDiffs = useCallback(() => {
    const toAdd = selectedAttendees.filter(
      (p) => !currentAttendeeIds.has(p.pt_id)
    );
    const toRemove = currentAttendees.filter(
      (p) => !selectedAttendeeIds.has(p.pt_id)
    );
    return { toAdd, toRemove };
  }, [
    selectedAttendees,
    currentAttendees,
    currentAttendeeIds,
    selectedAttendeeIds,
  ]);

  // Group squads by round (assuming naming convention like "R1 Team1", "R2 TeamA")
  // OR requires adding 'round_number' to squads table for reliable grouping
  const squadsByRound = useMemo(() => {
    const grouped: Record<number, SquadType[]> = {};
    sessionSquads.forEach((squad) => {
      // Basic check for "R<number>" prefix - MAKE THIS ROBUST
      const match = squad.name.match(/^R(\d+)/);
      const roundIndex = match ? parseInt(match[1], 10) - 1 : 0; // Default to round 0 if no match
      if (!grouped[roundIndex]) {
        grouped[roundIndex] = [];
      }
      grouped[roundIndex].push(squad);
    });
    return grouped;
  }, [sessionSquads]);
  const roundIndices = useMemo(
    () =>
      Object.keys(squadsByRound)
        .map(Number)
        .sort((a, b) => a - b),
    [squadsByRound]
  );

  const handleSelectionChange = (
    _event: React.SyntheticEvent,
    newValue: PlayerTeamType[]
  ) => {
    setSelectedAttendees(newValue);
    setSaveError(null); // Clear error on change
  };

  const handleNextStep = () => {
    const { toAdd, toRemove } = calculateDiffs();

    if (toRemove.length > 0 && !isConfirmRemoveOpen) {
      // If players are being removed, show confirmation first
      setAttendeesToRemove(toRemove);
      setIsConfirmRemoveOpen(true);
    } else if (toAdd.length > 0) {
      // If adding players, move to assignment step
      setAttendeesToAdd(toAdd);
      // Initialize assignment state for new players
      const initialAssignments: Record<string, Record<number, string>> = {};
      toAdd.forEach((player) => {
        initialAssignments[player.pt_id] = {};
      });
      setNewAttendeeAssignments(initialAssignments);
      setActiveStep(1);
    } else {
      // Only removals confirmed, or no changes / only additions with no assignment step needed (unlikely)
      handleSave();
    }
  };

  const handleConfirmRemove = () => {
    setIsConfirmRemoveOpen(false);
    const { toAdd } = calculateDiffs();
    if (toAdd.length > 0) {
      // Still need to add players, go to assignment step
      handleNextStep();
    } else {
      // Only removals, proceed to save
      handleSave();
    }
  };

  const handleCancelRemove = () => {
    setIsConfirmRemoveOpen(false);
  };

  const handleAssignmentChange = (
    playerId: string,
    roundIndex: number,
    squadId: string
  ) => {
    setNewAttendeeAssignments((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [roundIndex]: squadId,
      },
    }));
  };

  const canCompleteAssignment = useMemo(() => {
    if (activeStep !== 1) return true; // Not on assignment step
    if (attendeesToAdd.length === 0) return true; // No one to assign

    return attendeesToAdd.every((player) =>
      roundIndices.every(
        (roundIndex) => newAttendeeAssignments[player.pt_id]?.[roundIndex] // Check if a squad is selected for every round
      )
    );
  }, [activeStep, attendeesToAdd, roundIndices, newAttendeeAssignments]);

  const handleSave = async () => {
    // Final save logic after removals confirmed and additions assigned
    setLoading(true);
    setSaveError(null);

    const { toAdd } = calculateDiffs(); // Recalculate just in case, or use state attendeesToAdd/ToRemove
    const toRemove = attendeesToRemove; // Use the confirmed list

    try {
      // --- Handle Removals ---
      if (toRemove.length > 0) {
        const removedPtIds = toRemove.map((p) => p.pt_id);

        // 1. Delete from session_attendees
        const { error: attendeeDeleteError } = await supabase
          .from("session_attendees")
          .delete()
          .eq("session_id", sessionId)
          .in("pt_id", removedPtIds);
        if (attendeeDeleteError)
          throw new Error(
            `Failed to remove attendees: ${attendeeDeleteError.message}`
          );

        // 2. Delete from squad_players for this session
        // Get all squad IDs for the session first
        const sessionSquadIds = sessionSquads.map((s) => s.id);
        if (sessionSquadIds.length > 0) {
          const { error: squadPlayerDeleteError } = await supabase
            .from("squad_players")
            .delete()
            .in("pt_id", removedPtIds)
            .in("squad_id", sessionSquadIds); // Only remove from squads in this session
          if (squadPlayerDeleteError)
            throw new Error(
              `Failed to remove players from squads: ${squadPlayerDeleteError.message}`
            );
        }
      }

      // --- Handle Additions ---
      if (toAdd.length > 0) {
        const { data: allTeamPlayersData, error: rankError } = await supabase
          .from("player_teams")
          .select("pt_id, elo")
          .eq("team_id", teamId)
          .or("wins.gt.0, losses.gt.0")
          .order("elo", { ascending: false });

        if (rankError)
          return {
            sessionId: sessionId,
            error: `Failed to fetch team players for ranking: ${rankError.message}`,
          };

        const rankMap = new Map<string, number>();
        allTeamPlayersData?.forEach((p, index) => {
          rankMap.set(p.pt_id, index + 1);
        });
        // 1. Insert into session_attendees
        const attendeeInserts = toAdd.map((p) => ({
          session_id: sessionId,
          pt_id: p.pt_id,
          rank_before: rankMap.get(p.pt_id) ?? 1,
        }));

        const { error: attendeeInsertError } = await supabase
          .from("session_attendees")
          .insert(attendeeInserts);
        if (attendeeInsertError)
          throw new Error(
            `Failed to add new attendees: ${attendeeInsertError.message}`
          );

        // 2. Insert into squad_players based on assignments
        const squadPlayerInserts: { pt_id: string; squad_id: string }[] = [];
        toAdd.forEach((player) => {
          roundIndices.forEach((roundIndex) => {
            const assignedSquadId =
              newAttendeeAssignments[player.pt_id]?.[roundIndex];
            if (assignedSquadId) {
              squadPlayerInserts.push({
                pt_id: player.pt_id,
                squad_id: assignedSquadId,
              });
            } else {
              // This shouldn't happen if canCompleteAssignment is checked
              console.error(
                `Missing squad assignment for player ${player.pt_id} in round ${
                  roundIndex + 1
                }`
              );
            }
          });
        });

        if (squadPlayerInserts.length > 0) {
          const { error: squadPlayerInsertError } = await supabase
            .from("squad_players")
            .insert(squadPlayerInserts);
          if (squadPlayerInsertError)
            throw new Error(
              `Failed to assign players to squads: ${squadPlayerInsertError.message}`
            );
        }
      }

      setLoading(false);
      onSaveSuccess(); // Call parent callback
    } catch (err) {
      console.error("Error saving attendee changes:", err);
      //   setSaveError(err.message || "An unknown error occurred during save.");
      setLoading(false);
      // Keep modal open on error
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <Typography variant="h6" component="h2" gutterBottom>
              Edit Session Attendees
            </Typography>

            {fetchError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {fetchError}
              </Alert>
            )}
            {saveError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {saveError}
              </Alert>
            )}
            {activeStep === 1 && attendeesToAdd.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Adding players mid-session will not affect games already
                completed.
              </Alert>
            )}

            {loading && activeStep === 0 && <CircularProgress sx={{ mb: 2 }} />}

            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step 0: Select Attendees */}
            {activeStep === 0 && !loading && !fetchError && (
              <Autocomplete
                multiple
                id="attendees-select"
                options={allTeamPlayers}
                getOptionLabel={(option) =>
                  option.player?.name ?? "Unknown Player"
                }
                value={selectedAttendees}
                onChange={handleSelectionChange}
                isOptionEqualToValue={(option, value) =>
                  option.pt_id === value.pt_id
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Select Attendees"
                    placeholder="Add or remove players..."
                  />
                )}
                sx={{ mb: 3 }}
              />
            )}

            {/* Step 1: Assign New Attendees */}
            {activeStep === 1 && attendeesToAdd.length > 0 && (
              <Box>
                {attendeesToAdd.map((player) => (
                  <Box
                    key={player.pt_id}
                    mb={3}
                    p={2}
                    border={1}
                    borderColor="divider"
                    borderRadius={1}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      Assign {player.player?.name ?? "New Player"} to Squads:
                    </Typography>
                    {roundIndices.map((roundIndex) => (
                      <Box key={roundIndex} mb={1}>
                        <Typography variant="body2" gutterBottom>
                          Round {roundIndex + 1}
                        </Typography>
                        {/* Check if squads exist for this round */}
                        {!squadsByRound[roundIndex] ||
                        squadsByRound[roundIndex].length === 0 ? (
                          <Typography variant="caption" color="textSecondary">
                            No squads defined for this round.
                          </Typography>
                        ) : (
                          <RadioGroup
                            row
                            value={
                              newAttendeeAssignments[player.pt_id]?.[
                                roundIndex
                              ] || ""
                            }
                            onChange={(e) =>
                              handleAssignmentChange(
                                player.pt_id,
                                roundIndex,
                                e.target.value
                              )
                            }
                          >
                            {squadsByRound[roundIndex].map((squad) => (
                              <FormControlLabel
                                key={squad.id}
                                value={squad.id}
                                control={<Radio size="small" />}
                                label={squad.name}
                              />
                            ))}
                          </RadioGroup>
                        )}
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            )}

            {/* Action Buttons */}
            <Box
              sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}
            >
              <Button onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Box>
                {activeStep === 0 && (
                  <Button
                    variant="contained"
                    onClick={handleNextStep}
                    disabled={loading}
                  >
                    {/* Logic to determine button text */}
                    {calculateDiffs().toAdd.length > 0
                      ? "Next: Assign New Players"
                      : "Save Changes"}
                  </Button>
                )}
                {activeStep === 1 && (
                  <Button
                    variant="contained"
                    onClick={handleSave} // Final save after assignments
                    disabled={loading || !canCompleteAssignment}
                  >
                    {loading ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Confirm Assignments & Save"
                    )}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Confirmation Dialog for Removing Players */}
      <Modal
        open={isConfirmRemoveOpen}
        onClose={handleCancelRemove}
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
            onClick={handleCancelRemove}
            sx={{ position: "absolute", top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            id="rank-info-modal-title"
            variant="h5"
            component="h2"
            fontWeight={"bold"}
            color="error"
            mb={1}
          >
            Confirm Attendee Removal
          </Typography>
          <Box>
            You are about to remove the following player(s) :
            <List dense>
              {attendeesToRemove.map((p) => (
                <ListItem key={p.pt_id}>
                  <ListItemText primary={p.player?.name ?? "Unknown"} />
                </ListItem>
              ))}
            </List>
            Removing them will also remove them from **all squads** they are
            currently assigned to within this session. Are you sure you want to
            proceed?
          </Box>
          <Box
            display={"flex"}
            width={"100%"}
            justifyContent={"flex-end"}
            gap={1}
            mt={2}
            alignItems={"center"}
          >
            <Button
              onClick={handleCancelRemove}
              color="primary"
              variant="outlined"
              size="small"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRemove}
              color="error"
              variant="contained"
              size="small"
              autoFocus
            >
              Remove
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default EditAttendeesModal;
