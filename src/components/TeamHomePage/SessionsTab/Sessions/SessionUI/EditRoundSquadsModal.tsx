import { calculateAverageElo } from "@/lib/getAverageElo";
import { PlayerTeamType } from "@/lib/types"; // Adjust path
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit"; // Import Edit icon
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupsIcon from "@mui/icons-material/Groups";
import UndoIcon from "@mui/icons-material/Undo";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Chip,
  Collapse,
  Fade,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Modal,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import AutoAssignConfirmationModal from "../CreateSession/CreateSessionModals/AutoAssignConfirmationModal";
import {
  AttendeeAssignment,
  ColoredSquad,
  SessionSquad,
  squadColors,
} from "../CreateSession/CreateSquads";

// Props for the modal
interface EditRoundSquadsModalProps {
  open: boolean;
  onClose: () => void;
  attendees: PlayerTeamType[];
  roundNumber: number; // The 1-based round number being added/edited
  initialData: SessionSquad[] | null; // Existing squads for editing, null for adding
  onSave: (roundNumber: number, updatedSquads: SessionSquad[]) => Promise<void>; // Async save handler
  teamId: string; // Needed for auto-assign logic maybe?
}

const minSquads = 2;
const maxSquads = 8;

const EditRoundSquadsModal = ({
  open,
  onClose,
  attendees,
  roundNumber,
  initialData,
  onSave,
}: EditRoundSquadsModalProps) => {
  const theme = useTheme();
  const [numSquads, setNumSquads] = useState<number | "">("");
  const [localSquads, setLocalSquads] = useState<ColoredSquad[]>([]);
  const [attendeeAssignments, setAttendeeAssignments] =
    useState<AttendeeAssignment>({});
  const [alert, setAlert] = useState<{
    message: string | null;
    severity: "error" | "success" | "info";
  }>({ message: null, severity: "error" });
  const [openSquadsUI, setOpenSquadsUI] = useState<{
    [squadId: string]: boolean;
  }>({}); // Renamed to avoid clash
  const [isSaving, setIsSaving] = useState(false);
  const [initialStateForUndo, setInitialStateForUndo] = useState<{
    squads: ColoredSquad[];
    assignments: AttendeeAssignment;
  } | null>(null);
  const [isAutoAssignConfirmationOpen, setIsAutoAssignConfirmationOpen] =
    useState(false);
  const [autoAssignType, setAutoAssignType] = useState<
    "balanced" | "random" | null
  >(null);
  const [editingSquadId, setEditingSquadId] = useState<string | null>(null);

  // --- Memoized Calculations ---
  const numberOfSquads = useMemo(
    () => parseInt(numSquads.toString() || "0", 10),
    [numSquads]
  );

  const calculateMaxPlayersPerSquad = useCallback(() => {
    return attendees.length > 0 && numberOfSquads >= minSquads
      ? Math.ceil(attendees.length / numberOfSquads)
      : 0;
  }, [attendees.length, numberOfSquads]);

  const { unassignedAttendees } = useMemo(() => {
    const unassigned = attendees.filter(
      (attendee) => attendeeAssignments[attendee.pt_id] == null
    );
    unassigned.sort((a, b) => a.player.name.localeCompare(b.player.name));
    return { unassignedAttendees: unassigned };
  }, [attendees, attendeeAssignments]);

  const allPlayersAssigned = useMemo(() => {
    if (attendees.length === 0) return true;
    return attendees.every(
      (attendee) => attendeeAssignments[attendee.pt_id] != null
    );
  }, [attendees, attendeeAssignments]);

  // --- Effects ---
  // Initialize state when modal opens or initialData changes
  useEffect(() => {
    if (open) {
      let loadedSquads: ColoredSquad[] = [];
      const initialAssignments: AttendeeAssignment = attendees.reduce(
        (acc, att) => ({ ...acc, [att.pt_id]: null }),
        {}
      );
      let initialNumSquads: number | "" = "";
      const initialOpenState: { [squadId: string]: boolean } = {};

      if (initialData) {
        // Editing existing round
        initialNumSquads = initialData.length;
        loadedSquads = initialData.map((squad, index) => ({
          ...squad,
          color: squadColors[index % squadColors.length],
        }));
        loadedSquads.forEach((squad, index) => {
          initialOpenState[squad.id] = true; // Default open
          squad.players.forEach((player) => {
            if (attendees.some((att) => att.pt_id === player.pt_id)) {
              initialAssignments[player.pt_id] = index;
            }
          });
        });
      } else {
        // Adding new round - keep defaults (empty squads, null assignments)
        initialNumSquads = ""; // Prompt user to enter number
      }

      setNumSquads(initialNumSquads);
      setLocalSquads(loadedSquads);
      setAttendeeAssignments(initialAssignments);
      setOpenSquadsUI(initialOpenState);
      setAlert({ message: null, severity: "error" }); // Clear alerts
      setIsSaving(false);
      // Store initial state for undo
      setInitialStateForUndo({
        squads: JSON.parse(JSON.stringify(loadedSquads)),
        assignments: JSON.parse(JSON.stringify(initialAssignments)),
      });
    }
  }, [open, initialData, attendees]); // Rerun if modal opens or initial data changes

  // Initialize new squads when numSquads changes (only if NOT editing existing)
  useEffect(() => {
    if (
      open &&
      !initialData &&
      typeof numberOfSquads === "number" &&
      numberOfSquads >= minSquads &&
      numberOfSquads <= maxSquads
    ) {
      const newInitialSquads = Array.from(
        { length: numberOfSquads },
        (_, i) => ({
          id: uuidv4(), // Generate new IDs for new squads
          name: `R${roundNumber} Team${i + 1}`,
          players: [],
          color: squadColors[i % squadColors.length],
        })
      );
      setLocalSquads(newInitialSquads);
      setAttendeeAssignments(
        attendees.reduce((acc, att) => ({ ...acc, [att.pt_id]: null }), {})
      );
      const initialOpenState: { [squadId: string]: boolean } = {};
      newInitialSquads.forEach((s) => (initialOpenState[s.id] = true));
      setOpenSquadsUI(initialOpenState);
    } else if (open && !initialData && numSquads === "") {
      setLocalSquads([]);
      setAttendeeAssignments(
        attendees.reduce((acc, att) => ({ ...acc, [att.pt_id]: null }), {})
      );
      setOpenSquadsUI({});
    }
  }, [open, numSquads, initialData, attendees, numberOfSquads, roundNumber]);

  // --- Handlers ---
  const handleNumSquadsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    const newNumSquadsValue = value === "" ? "" : parseInt(value, 10);
    // Basic validation within input range limits
    if (
      value === "" ||
      (Number(newNumSquadsValue) >= minSquads &&
        Number(newNumSquadsValue) <= maxSquads)
    ) {
      setNumSquads(newNumSquadsValue);
      setAlert({ message: null, severity: "error" }); // Clear alert on valid change
    } else {
      // Optionally provide immediate feedback if number is out of range
      setAlert({
        message: `Number of squads must be between ${minSquads} and ${maxSquads}.`,
        severity: "error",
      });
    }
  };

  const handleAssignPlayer = useCallback(
    /* ... (same as in CreateSquadsStep) ... */
    (e: React.MouseEvent, player: PlayerTeamType, targetSquadIndex: number) => {
      e.stopPropagation();
      if (!numSquads || localSquads.length === 0) return;
      const maxPlayers = calculateMaxPlayersPerSquad();
      const currentAssignmentIndex = attendeeAssignments[player.pt_id];
      const updatedSquads = localSquads.map((squad) => ({
        ...squad,
        players: [...squad.players],
      }));
      const newAssignments = { ...attendeeAssignments };
      if (currentAssignmentIndex === targetSquadIndex) {
        newAssignments[player.pt_id] = null;
        const playerIndex = updatedSquads[targetSquadIndex].players.findIndex(
          (p) => p.pt_id === player.pt_id
        );
        if (playerIndex > -1)
          updatedSquads[targetSquadIndex].players.splice(playerIndex, 1);
      } else {
        const targetSquad = updatedSquads[targetSquadIndex];
        if (targetSquad.players.length >= maxPlayers) {
          setAlert({
            message: `${targetSquad.name} is full (${maxPlayers} players max).`,
            severity: "error",
          });
          return;
        }
        if (
          currentAssignmentIndex !== null &&
          updatedSquads[currentAssignmentIndex]
        ) {
          const oldSquad = updatedSquads[currentAssignmentIndex];
          const oldPlayerIndex = oldSquad.players.findIndex(
            (p) => p.pt_id === player.pt_id
          );
          if (oldPlayerIndex > -1) oldSquad.players.splice(oldPlayerIndex, 1);
        }
        targetSquad.players.push(player);
        newAssignments[player.pt_id] = targetSquadIndex;
      }
      setLocalSquads(updatedSquads);
      setAttendeeAssignments(newAssignments);
      setAlert({ message: null, severity: "error" });
    },
    [
      numSquads,
      localSquads,
      attendeeAssignments,
      calculateMaxPlayersPerSquad,
      setAlert,
      setLocalSquads,
      setAttendeeAssignments,
    ]
  );

  const performAutoAssign = useCallback(
    (type: "balanced" | "random", scope: "all" | "unassigned") => {
      // ... (Implementation from previous step - Greedy Balanced for both scopes) ...
      if (!numSquads || !attendees || attendees.length === 0) {
        console.warn("Auto-assign prerequisites not met.");
        return;
      }
      const numSquadsInt = parseInt(numSquads.toString(), 10);
      if (numSquadsInt < 2) {
        console.warn("Auto-assign requires at least 2 squads.");
        return;
      }
      const maxPlayers = calculateMaxPlayersPerSquad();

      // --- Determine Players to Assign ---
      const attendeesToAssign =
        scope === "all"
          ? [...attendees]
          : attendees.filter(
              (attendee) => attendeeAssignments[attendee.pt_id] == null
            );
      if (attendeesToAssign.length === 0) {
        return;
      }

      // --- Initialize Squads and Assignments ---
      let newSquads: ColoredSquad[];
      let newAssignments: AttendeeAssignment;
      if (scope === "all") {
        newSquads = Array.from({ length: numSquadsInt }, (_, index) => ({
          id: uuidv4(),
          name: `R${roundNumber} Team${index + 1}`,
          players: [],
          color: squadColors[index % squadColors.length],
        }));
        newAssignments = {};
      } else {
        newSquads = localSquads.map((squad) => ({
          ...squad,
          players: [...squad.players],
        }));
        newAssignments = { ...attendeeAssignments };
      }

      // --- Perform Assignment ---
      if (type === "random") {
        const shuffledAttendees = [...attendeesToAssign].sort(
          () => Math.random() - 0.5
        );
        let assignmentCounter = 0;
        let totalPlayersAssigned =
          scope === "unassigned"
            ? newSquads.reduce((sum, squad) => sum + squad.players.length, 0)
            : 0;
        const totalCapacity = numSquadsInt * maxPlayers;
        shuffledAttendees.forEach((attendee) => {
          if (totalPlayersAssigned >= totalCapacity) {
            console.warn(
              `Capacity reached, cannot assign ${attendee.player.name}`
            );
            return;
          }
          let assigned = false;
          const startIndex = assignmentCounter % numSquadsInt;
          for (let i = 0; i < numSquadsInt; i++) {
            const squadIndex = (startIndex + i) % numSquadsInt;
            if (newSquads[squadIndex].players.length < maxPlayers) {
              newSquads[squadIndex].players.push(attendee);
              newAssignments[attendee.pt_id] = squadIndex;
              assigned = true;
              assignmentCounter++;
              totalPlayersAssigned++;
              break;
            }
          }
          if (!assigned) {
            console.warn(
              `Could not assign random attendee ${attendee.player.name} - all squads might be full.`
            );
          }
        });
      } else if (type === "balanced") {
        // Greedy Lowest Total ELO First
        const sortedAttendees = [...attendeesToAssign].sort(
          (a, b) => b.elo - a.elo
        );
        const calculateTotalElo = (squad: ColoredSquad): number =>
          squad.players.reduce((sum, player) => sum + (player.elo ?? 0), 0);
        sortedAttendees.forEach((attendee) => {
          let bestSquadIndex = -1;
          let minElo = Infinity;
          for (let i = 0; i < numSquadsInt; i++) {
            if (newSquads[i].players.length < maxPlayers) {
              const currentElo = calculateTotalElo(newSquads[i]);
              if (currentElo < minElo) {
                minElo = currentElo;
                bestSquadIndex = i;
              }
            }
          }
          if (bestSquadIndex !== -1) {
            newSquads[bestSquadIndex].players.push(attendee);
            newAssignments[attendee.pt_id] = bestSquadIndex;
          } else {
            console.warn(
              `Could not assign balanced attendee ${attendee.player.name} - all squads might be full.`
            );
          }
        });
      }

      // --- Update State ---
      setLocalSquads(newSquads);
      setAttendeeAssignments(newAssignments);
      // Auto-open all squad details after auto-assign to show results
      const finalOpenState: { [squadId: string]: boolean } = {};
      newSquads.forEach((s) => (finalOpenState[s.id] = true));
      setOpenSquadsUI(finalOpenState);
    },
    [
      numSquads,
      localSquads,
      attendees,
      calculateMaxPlayersPerSquad,
      attendeeAssignments,
      setLocalSquads,
      setAttendeeAssignments,
      roundNumber,
    ] // Dependencies
  );

  const handleAutoAssign = (type: "balanced" | "random") => {
    // Check if *any* player currently has a non-null assignment
    const anyAssigned = Object.values(attendeeAssignments).some(
      (assignment) => assignment !== null
    );
    if (anyAssigned) {
      setAutoAssignType(type);
      setIsAutoAssignConfirmationOpen(true);
    } else {
      // If no one is assigned, proceed directly
      performAutoAssign(type, "all");
    }
  };

  // Performs auto-assignment after confirmation
  const handleConfirmAutoAssign = (overwrite: boolean) => {
    performAutoAssign(autoAssignType!, overwrite ? "all" : "unassigned");
    setIsAutoAssignConfirmationOpen(false);
    setAutoAssignType(null);
  };

  // Closes the auto-assign confirmation modal
  const handleCloseAutoAssignConfirmation = () => {
    setIsAutoAssignConfirmationOpen(false);
    setAutoAssignType(null);
  };

  // Reverts changes made in this modal back to the initial state passed in props
  const handleUndoChanges = useCallback(() => {
    if (initialStateForUndo) {
      setLocalSquads(initialStateForUndo.squads);
      setAttendeeAssignments(initialStateForUndo.assignments);
      setNumSquads(initialStateForUndo.squads.length);
      setOpenSquadsUI(
        initialStateForUndo.squads.reduce(
          (acc, s) => ({ ...acc, [s.id]: true }),
          {}
        )
      );
    }
    setAlert({ message: null, severity: "error" });
  }, [initialStateForUndo]);

  const squadsHaveChanged = useMemo(() => {
    if (!initialStateForUndo) return false;
    const currentAssignmentsString = JSON.stringify(
      Object.entries(attendeeAssignments).sort()
    );
    const initialAssignmentsString = JSON.stringify(
      Object.entries(initialStateForUndo.assignments).sort()
    );
    if (currentAssignmentsString !== initialAssignmentsString) return true;
    if (localSquads.length !== initialStateForUndo.squads.length) return true;
    for (let i = 0; i < localSquads.length; i++) {
      const currentSquad = localSquads[i];
      const initialSquad = initialStateForUndo.squads.find(
        (s) => s.id === currentSquad.id
      ); // Find by ID
      if (!initialSquad) return true; // Squad added/removed
      if (currentSquad.name !== initialSquad.name) return true; // Name changed
      const currentPlayers = currentSquad.players
        .map((p) => p.pt_id)
        .sort()
        .join(",");
      const initialPlayers = initialSquad.players
        .map((p) => p.pt_id)
        .sort()
        .join(",");
      if (currentPlayers !== initialPlayers) return true;
    }
    return false;
  }, [localSquads, attendeeAssignments, initialStateForUndo]);

  const canUndo = squadsHaveChanged;

  // Handles final save action
  const handleSaveClick = async () => {
    if (!allPlayersAssigned) {
      setAlert({
        message: "Please assign all attendees to squads.",
        severity: "error",
      });
      return;
    }
    if (localSquads.length < minSquads) {
      setAlert({
        message: `You need at least ${minSquads} squads.`,
        severity: "error",
      });
      return;
    }

    setIsSaving(true);
    setAlert({ message: null, severity: "error" });

    // Prepare data (remove color)
    const finalSquadsData: SessionSquad[] = localSquads.map((squad) => ({
      ...squad,
      // Ensure players array is up-to-date based on final assignments
      players: attendees.filter(
        (att) =>
          attendeeAssignments[att.pt_id] ===
          localSquads.findIndex((ls) => ls.id === squad.id)
      ),
    }));

    try {
      await onSave(roundNumber, finalSquadsData);
      // onClose(); // Parent calls onClose after successful save via onSquadsUpdated
    } catch (error) {
      console.error("Error saving round squads:", error);
      setAlert({
        message: `Error saving: ${error}`,
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Helper to Render Assignment Boxes ---
  const renderAssignmentBoxes = (
    player: PlayerTeamType /* ... (same as in CreateSquadsStep) ... */
  ) => (
    <div className="flex items-center">
      {" "}
      {Array.from({ length: numberOfSquads }, (_, index) => {
        const squad = localSquads[index];
        if (!squad) return null;
        const isAssignedToThis = attendeeAssignments[player.pt_id] === index;
        const isSquadFull =
          squad.players.length >= calculateMaxPlayersPerSquad();
        const isDisabled = isSquadFull && !isAssignedToThis;
        return (
          <Box
            key={`${player.pt_id}-box-${index}`}
            onClick={(e) =>
              !isDisabled ? handleAssignPlayer(e, player, index) : undefined
            }
            sx={{
              width: 20,
              height: 20,
              borderRadius: "4px",
              backgroundColor: squad.color,
              ml: 1,
              cursor: isDisabled ? "not-allowed" : "pointer",
              border: isAssignedToThis
                ? `2px solid ${theme.palette.text.primary}`
                : "none",
              opacity: isDisabled ? 0.4 : 1,
              transition: "opacity 0.2s ease-in-out, border 0.2s ease-in-out",
              "&:hover": {
                boxShadow: !isDisabled ? `0 0 5px ${squad.color}` : "none",
              },
            }}
            title={
              isDisabled ? `${squad.name} is full` : `Assign to ${squad.name}`
            }
          />
        );
      })}{" "}
    </div>
  );

  const handleSquadNameChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    squadId: string
  ) => {
    const newName = event.target.value;
    setLocalSquads((prevSquads) =>
      prevSquads.map((squad) =>
        squad.id === squadId ? { ...squad, name: newName } : squad
      )
    );
  };

  const handleStartEditingSquadName = (
    e: React.MouseEvent,
    squadId: string
  ) => {
    e.stopPropagation(); // Prevent collapse toggle
    setEditingSquadId(squadId);
  };

  const handleFinishEditingSquadName = (squadId: string) => {
    const squad = localSquads.find((s) => s.id === squadId);
    if (squad && squad.name.trim() === "") {
      setAlert({ message: "Squad name cannot be empty.", severity: "error" });
      // Revert name change if invalid
      if (initialStateForUndo) {
        const initialSquad = initialStateForUndo.squads.find(
          (s) => s.id === squadId
        );
        if (initialSquad) {
          setLocalSquads((prev) =>
            prev.map((sq) =>
              sq.id === squadId ? { ...sq, name: initialSquad.name } : sq
            )
          );
        }
      }
      // Keep editing mode active to force correction
      return;
    }
    setEditingSquadId(null); // Exit editing mode
  };

  const handleKeyDownOnNameInput = (
    event: React.KeyboardEvent<HTMLDivElement>,
    squadId: string
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleFinishEditingSquadName(squadId);
    } else if (event.key === "Escape") {
      // Revert changes on Escape and finish editing
      if (initialStateForUndo) {
        const initialSquad = initialStateForUndo.squads.find(
          (s) => s.id === squadId
        );
        if (initialSquad) {
          setLocalSquads((prev) =>
            prev.map((sq) =>
              sq.id === squadId ? { ...sq, name: initialSquad.name } : sq
            )
          );
        }
      }
      setEditingSquadId(null);
    }
  };

  // --- Render Modal ---
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
      aria-labelledby="edit-round-squads-modal-title"
    >
      <Fade in={open}>
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
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Modal Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              id="edit-round-squads-modal-title"
              variant="h6"
              component="h2"
              fontWeight="bold"
              color="primary"
            >
              {initialData
                ? `Edit Round ${roundNumber} Squads`
                : `Add Round ${roundNumber} Squads`}
            </Typography>
            <IconButton onClick={onClose} aria-label="close modal">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Alert Display Area */}
          {alert.message && (
            <Alert
              severity={alert.severity}
              sx={{ mb: 2 }}
              onClose={() => setAlert({ message: null, severity: "error" })}
            >
              {alert.message}
            </Alert>
          )}

          {/* Scrollable Content Area */}
          <Box sx={{ overflowY: "auto", flexGrow: 1, pr: 1 }}>
            <TextField
              label="Number of Squads for this Round"
              type="number"
              value={numSquads}
              onChange={handleNumSquadsChange}
              margin="normal"
              size="small"
              fullWidth
              required
              helperText={`Min ${minSquads}, Max ${maxSquads}`}
              disabled={isSaving || !!initialData} // Disable if editing existing (can't change # squads easily)
              title={
                initialData
                  ? "Number of squads cannot be changed when editing."
                  : ""
              }
            />
            {initialData && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Number of squads cannot be changed when editing an existing
                round.
              </Alert>
            )}
            {/* Auto Assign Buttons */}
            {numberOfSquads >= minSquads && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  my: 1,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="body1" fontWeight={"bold"} sx={{ mb: 1 }}>
                  Auto Assign
                </Typography>
                <Box display={"flex"} gap={2} justifyContent="center">
                  <Button
                    variant="contained"
                    onClick={() => handleAutoAssign("random")}
                    size="small"
                    color="secondary"
                    disabled={isSaving}
                  >
                    Random
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleAutoAssign("balanced")}
                    size="small"
                    color="primary"
                    disabled={isSaving}
                  >
                    Balanced (ELO)
                  </Button>
                </Box>
              </Paper>
            )}
            {/* Manual Assignment Section */}
            {numberOfSquads >= minSquads && numberOfSquads <= maxSquads ? (
              <>
                {unassignedAttendees.length > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      my: 1,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight={"bold"}>
                          Unassigned Attendees ({unassignedAttendees.length})
                        </Typography>
                      </Box>
                    </Box>
                    <List dense disablePadding>
                      {" "}
                      {unassignedAttendees.map((attendee) => (
                        <ListItem
                          key={attendee.pt_id}
                          disableGutters
                          sx={{
                            py: 0.5,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <div className="text-sm">
                              {attendee.player.name}
                            </div>
                            <div className="text-xs font-bold italic">
                              ELO: {attendee.elo}
                            </div>
                          </div>
                          {renderAssignmentBoxes(attendee)}{" "}
                        </ListItem>
                      ))}{" "}
                    </List>
                  </Paper>
                )}

                {/* Squads List */}
                <Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent={"space-between"}
                    gap={1}
                    mb={1}
                    mt={2}
                  >
                    <Box display={"flex"} alignItems={"center"} gap={1}>
                      <GroupsIcon color="action" />
                      <Typography variant="body1" fontWeight={"bold"}>
                        Squads ({localSquads.length})
                      </Typography>
                    </Box>
                    {initialData && (
                      <IconButton
                        aria-label="Undo Changes"
                        onClick={handleUndoChanges}
                        disabled={!canUndo || isSaving}
                        size="small"
                        color="secondary"
                        title="Undo changes made in this modal"
                      >
                        <UndoIcon />
                      </IconButton>
                    )}
                  </Box>
                  {localSquads.map((squad) => {
                    const averageElo = calculateAverageElo(squad.players);
                    const maxPlayers = calculateMaxPlayersPerSquad();
                    const isEditingName = editingSquadId === squad.id;
                    return (
                      /* ... (Render squad Paper with borderLeft, header with Chips, Collapse, and player list with assignment boxes - same as CreateSquadsStep) ... */
                      <Paper
                        key={squad.id}
                        elevation={1}
                        sx={{ mb: 1.5, borderLeft: `4px solid ${squad.color}` }}
                      >
                        <Box
                          sx={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 1,
                            bgcolor: "action.hover",
                          }}
                          onClick={
                            !isEditingName
                              ? () =>
                                  setOpenSquadsUI((prev) => ({
                                    ...prev,
                                    [squad.id]: !prev[squad.id],
                                  }))
                              : undefined
                          }
                          style={{
                            cursor: isEditingName ? "default" : "pointer",
                          }}
                        >
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            width={"100%"}
                            justifyContent={"space-around"}
                          >
                            {isEditingName ? (
                              <TextField
                                value={squad.name}
                                onChange={(e) =>
                                  handleSquadNameChange(e, squad.id)
                                }
                                onBlur={() =>
                                  handleFinishEditingSquadName(squad.id)
                                }
                                onKeyDown={(e) =>
                                  handleKeyDownOnNameInput(e, squad.id)
                                }
                                variant="standard"
                                size="small"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                slotProps={{ htmlInput: { maxLength: 20 } }}
                                sx={{
                                  flexGrow: 1,
                                  mr: 1,
                                  "& .MuiInput-input": {
                                    fontWeight: "bold",
                                    fontSize: "1rem",
                                  },
                                }}
                              />
                            ) : (
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={0.5}
                                onClick={(e) =>
                                  handleStartEditingSquadName(e, squad.id)
                                }
                                sx={{ cursor: "text", flexGrow: 1, mr: 1 }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                  noWrap
                                  title={squad.name}
                                >
                                  {squad.name}
                                </Typography>
                                <EditIcon
                                  fontSize="small"
                                  color="action"
                                  sx={{ opacity: 0.6 }}
                                />
                              </Box>
                            )}
                            <Box
                              display={"flex"}
                              flexDirection={"column"}
                              gap={0.5}
                            >
                              <Chip
                                label={`Avg ELO: ${averageElo}`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={`${squad.players.length}/${maxPlayers} P`}
                                size="small"
                                variant="outlined"
                                color={
                                  squad.players.length >= maxPlayers
                                    ? "error"
                                    : "default"
                                }
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
                        <Collapse
                          in={openSquadsUI[squad.id] ?? false}
                          sx={{
                            borderTop: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <List dense disablePadding sx={{ p: 1 }}>
                            {squad.players.length === 0 ? (
                              <ListItem>
                                <ListItemText
                                  secondary="No players assigned"
                                  sx={{ fontStyle: "italic" }}
                                />
                              </ListItem>
                            ) : (
                              squad.players
                                .sort((a, b) => b.elo - a.elo)
                                .map((attendee) => (
                                  <ListItem
                                    key={attendee.pt_id}
                                    disableGutters
                                    sx={{
                                      py: 0.5,
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <div>
                                      <div className="text-sm">
                                        {attendee.player.name}
                                      </div>
                                      <div className="text-xs font-bold italic">
                                        ELO: {attendee.elo}
                                      </div>
                                    </div>
                                    {renderAssignmentBoxes(attendee)}{" "}
                                  </ListItem>
                                ))
                            )}
                          </List>
                        </Collapse>
                      </Paper>
                    );
                  })}
                </Box>
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please enter the number of squads for this round above.
              </Alert>
            )}
          </Box>

          {/* Modal Footer Actions */}
          <Box display="flex" justifyContent="flex-end" gap={1.5} mt={1} pt={1}>
            <Button
              onClick={onClose}
              disabled={isSaving}
              variant="outlined"
              color="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveClick}
              variant="contained"
              color="primary"
              disabled={
                isSaving ||
                !allPlayersAssigned ||
                localSquads.length < minSquads ||
                !canUndo
              }
            >
              {isSaving ? "Saving..." : "Save Round Squads"}
            </Button>
          </Box>
          <AutoAssignConfirmationModal
            open={isAutoAssignConfirmationOpen}
            onClose={handleCloseAutoAssignConfirmation}
            onConfirm={handleConfirmAutoAssign}
            assignType={autoAssignType}
          />
        </Box>
      </Fade>
    </Modal>
  );
};

export default EditRoundSquadsModal;
