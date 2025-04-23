import { calculateAverageElo } from "@/lib/getAverageElo";
import { PlayerTeamType } from "@/lib/types"; // Assuming path is correct
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EditIcon from "@mui/icons-material/Edit"; // Import Edit icon
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupsIcon from "@mui/icons-material/Groups"; // Icon for assigned squads
import UndoIcon from "@mui/icons-material/Undo";
import {
  Alert,
  Box,
  Button,
  Chip, // Import Chip
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper, // Use Paper for better visual grouping
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react"; // Added useMemo
import { v4 as uuidv4 } from "uuid";
import AutoAssignConfirmationModal from "./CreateSessionModals/AutoAssignConfirmationModal";
import NavigateBackConfirmationModal from "./CreateSessionModals/NavigateBackConfirmationModal";
import SkipConfirmationModal from "./CreateSessionModals/SkipConfirmationModal";
// Assuming modals are in a subfolder

// --- Type Definitions ---
export type SessionSquad = {
  id: string;
  name: string;
  players: PlayerTeamType[];
};

export type ColoredSquad = SessionSquad & { color: string };

export type AttendeeAssignment = {
  [attendeeId: string]: number | null; // squadIndex or null if unassigned
};

export type SquadState = SessionSquad[] | null; // A single round's state
export type SetSquadState = React.Dispatch<React.SetStateAction<SquadState[]>>; // Setter for all rounds

// --- Component Props ---
interface CreateSquadsStepProps {
  attendees: PlayerTeamType[];
  squads: SquadState[]; // Array representing all rounds
  setSquads: (squads: SquadState[]) => void; // Update parent state for all rounds
  onSkipToSchedule: () => void;
  handleBack: () => void; // Go back to previous step/modal
  currentRoundIndex: number;
  onRoundIndexChange: (index: number) => void; // Navigate between rounds
}

// --- Constants ---
export const squadColors = [
  // Export if needed elsewhere, otherwise keep local
  "#FF0000",
  "#0000FF",
  "#008000",
  "#FFA500",
  "#800080",
  "#00FFFF",
  "#FF00FF",
  "#4682B4",
];
const minSquads = 2;
const maxSquads = 8;

// --- Component ---
const CreateSquadsStep = ({
  attendees,
  squads,
  setSquads,
  onSkipToSchedule,
  handleBack,
  currentRoundIndex,
  onRoundIndexChange,
}: CreateSquadsStepProps) => {
  // --- State ---
  const [numSquads, setNumSquads] = useState<number | "">(""); // Number of squads for the current round
  const [localSquads, setLocalSquads] = useState<ColoredSquad[]>([]); // Squads being edited in this step
  const [attendeeAssignments, setAttendeeAssignments] =
    useState<AttendeeAssignment>({}); // Tracks which squad index each pt_id is assigned to
  const [alert, setAlert] = useState<{
    message: string | null;
    severity: "error" | "success";
  }>({ message: null, severity: "error" });
  const [openSquads, setOpenSquads] = useState<{ [squadId: string]: boolean }>(
    {}
  ); // Track collapse state by squad ID
  const [isAutoAssignConfirmationOpen, setIsAutoAssignConfirmationOpen] =
    useState(false);
  const [autoAssignType, setAutoAssignType] = useState<
    "balanced" | "random" | null
  >(null);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [skipConfirmationOpen, setSkipConfirmationOpen] = useState(false);
  const [navigateBackConfirmationOpen, setNavigateBackConfirmationOpen] =
    useState(false);
  const [initialRoundState, setInitialRoundState] = useState<
    SessionSquad[] | null
  >(null); // For Undo functionality
  const [editingSquadId, setEditingSquadId] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // --- Memoized Derived State ---
  // Get the number of squads safely
  const numberOfSquads = useMemo(
    () => parseInt(numSquads.toString() || "0", 10),
    [numSquads]
  );

  // Filter attendees into assigned and unassigned lists
  const { unassignedAttendees } = useMemo(() => {
    const unassigned: PlayerTeamType[] = [];
    const assignedMap: { [squadIndex: number]: PlayerTeamType[] } = {};
    attendees.forEach((attendee) => {
      const assignmentIndex = attendeeAssignments[attendee.pt_id];
      if (assignmentIndex === null || assignmentIndex === undefined) {
        unassigned.push(attendee);
      } else {
        if (!assignedMap[assignmentIndex]) {
          assignedMap[assignmentIndex] = [];
        }
        assignedMap[assignmentIndex].push(attendee);
      }
    });
    // Sort unassigned players alphabetically for consistent display
    unassigned.sort((a, b) => a.player.name.localeCompare(b.player.name));
    return {
      unassignedAttendees: unassigned,
      assignedAttendeesMap: assignedMap,
    };
  }, [attendees, attendeeAssignments]);

  // Calculate max players allowed per squad
  const calculateMaxPlayersPerSquad = useCallback(() => {
    return attendees.length > 0 && numberOfSquads >= minSquads
      ? Math.ceil(attendees.length / numberOfSquads)
      : 0;
  }, [attendees.length, numberOfSquads]);

  // Check if all players are assigned
  const allPlayersAssigned = useMemo(() => {
    if (attendees.length === 0) return true; // Or false if attendees are required?
    return attendees.every(
      (attendee) => attendeeAssignments[attendee.pt_id] != null
    );
  }, [attendees, attendeeAssignments]);

  // Deep comparison function (if not imported)
  const deepCompareSquads = useCallback(
    (squadA: SessionSquad[] | null, squadB: SessionSquad[] | null): boolean => {
      // ... (Use the implementation from the previous step or ensure it's available) ...
      if (squadA === null && squadB === null) return true;
      if (squadA?.length === 0 && squadB === null) return true;
      if (squadA === null || squadB === null) return false;
      if (squadA.length !== squadB.length) return false;
      const sortedA = [...squadA].sort((a, b) => a.id.localeCompare(b.id));
      const sortedB = [...squadB].sort((a, b) => a.id.localeCompare(b.id));
      for (let i = 0; i < sortedA.length; i++) {
        const sqA = sortedA[i];
        const sqB = sortedB[i];
        if (
          sqA.id !== sqB.id ||
          sqA.name !== sqB.name ||
          sqA.players.length !== sqB.players.length
        )
          return false;
        const sqAPlayerIds = sqA.players.map((p) => p.pt_id).sort();
        const sqBPlayerIds = sqB.players.map((p) => p.pt_id).sort();
        if (sqAPlayerIds.join(",") !== sqBPlayerIds.join(",")) return false;
      }
      return true;
    },
    []
  );

  // Check if current local squads differ from the initial state for this round
  const squadsHaveChanged = useMemo(() => {
    return !deepCompareSquads(localSquads, initialRoundState);
  }, [localSquads, initialRoundState, deepCompareSquads]);

  const canUndo = squadsHaveChanged; // Enable undo if changes were made

  // Load existing round data or reset when roundIndex/squads prop changes
  useEffect(() => {
    const currentRoundData = squads[currentRoundIndex];
    setInitialRoundState(
      currentRoundData ? JSON.parse(JSON.stringify(currentRoundData)) : null
    ); // Store initial state copy

    if (currentRoundData) {
      const coloredLoadedRound = currentRoundData.map((squad, index) => ({
        ...squad,
        color: squadColors[index % squadColors.length],
      }));
      setLocalSquads(coloredLoadedRound);
      setNumSquads(coloredLoadedRound.length);
      // Rebuild assignments based on the loaded players in squads
      const initialAssignments: AttendeeAssignment = {};
      attendees.forEach((att) => (initialAssignments[att.pt_id] = null)); // Default all to null
      coloredLoadedRound.forEach((squad, index) => {
        squad.players.forEach((player) => {
          // Ensure player exists in attendees list before assigning
          if (attendees.some((att) => att.pt_id === player.pt_id)) {
            initialAssignments[player.pt_id] = index;
          } else {
            console.warn(
              `Player ${player.pt_id} found in saved squad but not in current attendees list.`
            );
          }
        });
      });
      setAttendeeAssignments(initialAssignments);
      // Set initial open state for squads
      const initialOpenState: { [squadId: string]: boolean } = {};
      coloredLoadedRound.forEach((s) => (initialOpenState[s.id] = true)); // Default open
      setOpenSquads(initialOpenState);
    } else {
      // Reset if no data for this round
      setLocalSquads([]);
      setAttendeeAssignments(
        attendees.reduce((acc, att) => ({ ...acc, [att.pt_id]: null }), {})
      );
      setNumSquads("");
      setOpenSquads({});
    }
  }, [currentRoundIndex, squads, attendees]); // Rerun if round changes or parent squads/attendees change

  // Initialize new squads when numSquads changes (and is valid) AND there's no existing data
  useEffect(() => {
    // Only run if numSquads is a valid number AND we don't have loaded data
    if (
      typeof numberOfSquads === "number" &&
      numberOfSquads >= minSquads &&
      numberOfSquads <= maxSquads &&
      !squads[currentRoundIndex] // Check parent prop here
    ) {
      const initialSquads = Array.from({ length: numberOfSquads }, (_, i) => ({
        id: uuidv4(),
        name: `R${currentRoundIndex + 1} Team${i + 1}`,
        players: [],
        color: squadColors[i % squadColors.length],
      }));
      setLocalSquads(initialSquads);
      // Reset assignments when number of squads changes
      setAttendeeAssignments(
        attendees.reduce((acc, att) => ({ ...acc, [att.pt_id]: null }), {})
      );
      // Set initial open state
      const initialOpenState: { [squadId: string]: boolean } = {};
      initialSquads.forEach((s) => (initialOpenState[s.id] = true)); // Default open
      setOpenSquads(initialOpenState);
    } else if (numSquads === "" && !squads[currentRoundIndex]) {
      // Clear local state if numSquads is cleared and no initial data
      setLocalSquads([]);
      setAttendeeAssignments(
        attendees.reduce((acc, att) => ({ ...acc, [att.pt_id]: null }), {})
      );
      setOpenSquads({});
    }
  }, [numSquads, currentRoundIndex, squads, attendees, numberOfSquads]); // Added numberOfSquads dependency

  // Update Next button disabled state
  useEffect(() => {
    setNextBtnDisabled(!allPlayersAssigned);
  }, [allPlayersAssigned]);

  // Handles changing the number of squads input
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

  // Handles assigning/unassigning a player by clicking a color box
  const handleAssignPlayer = useCallback(
    (e: React.MouseEvent, player: PlayerTeamType, targetSquadIndex: number) => {
      e.stopPropagation(); // Prevent clicks bubbling up (e.g., closing collapses)
      if (!numSquads || localSquads.length === 0) return; // Need squads defined

      const maxPlayers = calculateMaxPlayersPerSquad();
      const currentAssignmentIndex = attendeeAssignments[player.pt_id];

      // --- Create deep copies to avoid mutation ---
      const updatedSquads = localSquads.map((squad) => ({
        ...squad,
        players: [...squad.players],
      }));
      const newAssignments = { ...attendeeAssignments };

      // Case 1: Clicking the box of the currently assigned squad -> Unassign
      if (currentAssignmentIndex === targetSquadIndex) {
        newAssignments[player.pt_id] = null; // Set assignment to null
        // Remove player from the squad's player list
        const playerIndex = updatedSquads[targetSquadIndex].players.findIndex(
          (p) => p.pt_id === player.pt_id
        );
        if (playerIndex > -1) {
          updatedSquads[targetSquadIndex].players.splice(playerIndex, 1);
        }
      }
      // Case 2: Clicking a *different* squad's box
      else {
        const targetSquad = updatedSquads[targetSquadIndex];
        // Check if target squad is full
        if (targetSquad.players.length >= maxPlayers) {
          setAlert({
            message: `${targetSquad.name} is full (${maxPlayers} players max).`,
            severity: "error",
          });
          return; // Stop if target is full
        }
        // If player was previously assigned, remove from old squad first
        if (
          currentAssignmentIndex !== null &&
          updatedSquads[currentAssignmentIndex]
        ) {
          const oldSquad = updatedSquads[currentAssignmentIndex];
          const oldPlayerIndex = oldSquad.players.findIndex(
            (p) => p.pt_id === player.pt_id
          );
          if (oldPlayerIndex > -1) {
            oldSquad.players.splice(oldPlayerIndex, 1);
          }
        }
        targetSquad.players.push(player);
        // Update the assignment state
        newAssignments[player.pt_id] = targetSquadIndex;
      }
      setLocalSquads(updatedSquads);
      setAttendeeAssignments(newAssignments);
      setAlert({ message: null, severity: "error" }); // Clear any previous alerts
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

  // Opens the confirmation modal for auto-assign if players are already assigned
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

  // The actual auto-assignment logic (Random or Balanced Greedy)
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
        console.log("No attendees to assign.");
        return;
      }

      // --- Initialize Squads and Assignments ---
      let newSquads: ColoredSquad[];
      let newAssignments: AttendeeAssignment;
      if (scope === "all") {
        newSquads = Array.from({ length: numSquadsInt }, (_, index) => ({
          id: uuidv4(),
          name: `R${currentRoundIndex + 1} Team${index + 1}`,
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
      setOpenSquads(finalOpenState);
    },
    [
      numSquads,
      localSquads,
      attendees,
      calculateMaxPlayersPerSquad,
      currentRoundIndex,
      attendeeAssignments,
      setLocalSquads,
      setAttendeeAssignments,
      setOpenSquads,
    ] // Dependencies
  );

  // Reverts changes made in this step back to the initial state for the round
  const handleUndoChanges = useCallback(() => {
    if (initialRoundState) {
      // Check if initial state exists
      const coloredLoadedRound = initialRoundState.map((squad, index) => ({
        ...squad,
        color: squadColors[index % squadColors.length],
      }));
      setLocalSquads(coloredLoadedRound);
      setNumSquads(coloredLoadedRound.length);
      // Rebuild assignments from the initial state's player lists
      const initialAssignments: AttendeeAssignment = {};
      attendees.forEach((att) => (initialAssignments[att.pt_id] = null)); // Default all
      coloredLoadedRound.forEach((squad, index) => {
        squad.players.forEach((player) => {
          if (attendees.some((att) => att.pt_id === player.pt_id)) {
            initialAssignments[player.pt_id] = index;
          }
        });
      });
      setAttendeeAssignments(initialAssignments);
      setOpenSquads(
        coloredLoadedRound.reduce((acc, s) => ({ ...acc, [s.id]: true }), {})
      ); // Open all
    } else {
      // If no initial state, reset completely
      setNumSquads("");
      setLocalSquads([]);
      setAttendeeAssignments(
        attendees.reduce((acc, att) => ({ ...acc, [att.pt_id]: null }), {})
      );
      setOpenSquads({});
    }
    setAlert({ message: null, severity: "error" }); // Clear alerts
  }, [
    initialRoundState,
    attendees,
    setLocalSquads,
    setAttendeeAssignments,
    setNumSquads,
    setOpenSquads,
    setAlert,
  ]);

  // --- Navigation and Saving ---
  const handleProceed = () => {
    if (!allPlayersAssigned) {
      setAlert({
        message: "Please assign all attendees to squads before proceeding.",
        severity: "error",
      });
      return;
    }

    // Update the parent state
    const updatedFullSquads = [...squads];
    updatedFullSquads[currentRoundIndex] = localSquads;
    setSquads(updatedFullSquads);

    // Navigate
    if (currentRoundIndex < 2) {
      onRoundIndexChange(currentRoundIndex + 1); // Go to next round
    } else {
      onSkipToSchedule(); // Go to confirmation step
    }
  };

  // Saves current state and goes directly to confirmation step
  const handleGoToSchedule = () => {
    if (!allPlayersAssigned) {
      setAlert({
        message: "All attendees must be assigned a squad before continuing!",
        severity: "error",
      });
      return;
    }
    // Update the parent state
    const updatedFullSquads = [...squads];
    updatedFullSquads[currentRoundIndex] = localSquads;
    setSquads(updatedFullSquads);
    // Navigate to confirmation
    onSkipToSchedule();
    onRoundIndexChange(0);
  };

  // Handles confirming skipping the current round (discarding changes)
  const handleConfirmSkip = () => {
    const updatedFullSquads = [...squads];
    updatedFullSquads[currentRoundIndex] = null; // Set round to null
    setSquads(updatedFullSquads);
    onSkipToSchedule(); // Go to confirmation
    setSkipConfirmationOpen(false);
    onRoundIndexChange(0);
  };
  const handleCloseSkipConfirmation = () => setSkipConfirmationOpen(false);

  // Handles saving current state AND skipping the round
  const handleSaveAndSkip = () => {
    if (!allPlayersAssigned) {
      // Should ideally not happen if button is enabled correctly
      setAlert({
        message: "Cannot save - assign all players first.",
        severity: "error",
      });
      return;
    }
    const updatedFullSquads = [...squads];
    updatedFullSquads[currentRoundIndex] = localSquads; // Save current state
    // Mark subsequent rounds as null? Or just skip this one? Assuming just skip this one for now
    // updatedFullSquads[currentRoundIndex] = null; // Then mark as null? No, parent handles skip logic.
    setSquads(updatedFullSquads);
    onSkipToSchedule(); // Go to confirmation
    setSkipConfirmationOpen(false);
    // onRoundIndexChange(0);
  };

  // Handles navigating back (potentially with confirmation)
  const goBack = useCallback(() => {
    if (currentRoundIndex > 0) {
      // If squads haven't changed OR if they have changed but are assignable, allow direct back
      if (!squadsHaveChanged || allPlayersAssigned) {
        // If changes were made and assignable, save them before going back
        if (squadsHaveChanged && allPlayersAssigned) {
          const updatedFullSquads = [...squads];
          updatedFullSquads[currentRoundIndex] = localSquads;
          setSquads(updatedFullSquads);
        }
        onRoundIndexChange(currentRoundIndex - 1); // Go back a round
      } else {
        // Changes were made, but not all players assigned - ask confirmation
        setNavigateBackConfirmationOpen(true);
      }
    } else {
      handleBack(); // Call parent's back handler (likely closes modal step)
    }
  }, [
    currentRoundIndex,
    squadsHaveChanged,
    allPlayersAssigned,
    localSquads,
    squads,
    setSquads,
    onRoundIndexChange,
    handleBack,
  ]);

  // Handles confirming navigation back without saving changes
  const handleConfirmNavigateBackWithoutSave = () => {
    setNavigateBackConfirmationOpen(false);
    // Don't save changes, just navigate back
    onRoundIndexChange(currentRoundIndex - 1);
  };
  const handleCloseNavigateBackConfirmation = () =>
    setNavigateBackConfirmationOpen(false);

  // Handles saving changes AND navigating back
  const handleSaveAndNavigateBack = () => {
    if (!allPlayersAssigned) {
      // Should be disabled, but double check
      setAlert({
        message: "Assign all players before saving.",
        severity: "error",
      });
      return;
    }
    const updatedFullSquads = [...squads];
    updatedFullSquads[currentRoundIndex] = localSquads;
    setSquads(updatedFullSquads);
    onRoundIndexChange(currentRoundIndex - 1); // Navigate back
    setNavigateBackConfirmationOpen(false);
  };

  const renderAssignmentBoxes = (player: PlayerTeamType) => (
    <div className="flex items-center">
      {Array.from({ length: numberOfSquads }, (_, index) => {
        const squad = localSquads[index];
        if (!squad) return null; // Should not happen if localSquads is synced with numSquads
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
                : "none", // Use theme color for border
              opacity: isDisabled ? 0.4 : 1,
              transition: "opacity 0.2s ease-in-out, border 0.2s ease-in-out",
              "&:hover": {
                boxShadow: !isDisabled ? `0 0 5px ${squad.color}` : "none", // Subtle glow on hover if enabled
              },
            }}
            title={
              isDisabled ? `${squad.name} is full` : `Assign to ${squad.name}`
            }
          />
        );
      })}
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
    // Optional: Add validation (e.g., prevent empty name)
    const squad = localSquads.find((s) => s.id === squadId);
    if (squad && squad.name.trim() === "") {
      setAlert({ message: "Squad name cannot be empty.", severity: "error" });
      // Optionally revert to previous name or default name here
      handleUndoChanges(); // Revert might be too drastic, maybe just reset the specific name?
      // Or force focus back? For now, just show alert and stop edit.
      return; // Keep editing mode active
    }
    setEditingSquadId(null); // Exit editing mode
  };

  const handleKeyDownOnNameInput = (
    event: React.KeyboardEvent<HTMLDivElement>,
    squadId: string
  ) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission if any
      handleFinishEditingSquadName(squadId);
    } else if (event.key === "Escape") {
      // Optional: Revert changes on Escape? Or just finish editing?
      // Reverting requires storing the name before editing started.
      // For simplicity, just finish editing.
      setEditingSquadId(null);
    }
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", width: "100%", gap: 1 }}
    >
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        width={"100%"}
        alignItems="center"
      >
        <Typography variant="h6" fontWeight={"bold"} fontStyle={"italic"}>
          {`Create Squads - ${isMobile ? "R" : "Round "}${
            currentRoundIndex + 1
          }`}
        </Typography>
        <Box display={"flex"} alignItems={"center"} gap={0.25}>
          <IconButton
            aria-label="Undo Changes"
            onClick={handleUndoChanges}
            disabled={!canUndo}
            size="small"
            color="error"
            title="Undo changes for this round"
          >
            <UndoIcon />
          </IconButton>
          {currentRoundIndex > 0 && (
            <IconButton
              onClick={goBack}
              size="small"
              color="secondary"
              title="Previous Round"
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          {/* Show next only if not the last round (assuming 3 rounds max, index 0, 1, 2) */}
          {currentRoundIndex < 2 && (
            <IconButton
              color="primary"
              onClick={handleProceed}
              disabled={nextBtnDisabled}
              size="small"
              title="Next Round"
            >
              <ArrowForwardIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Alert Display Area */}
      {alert.message && (
        <Alert
          severity={alert.severity}
          sx={{ mt: 1 }}
          onClose={() => setAlert({ message: null, severity: "error" })}
        >
          {alert.message}
        </Alert>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxHeight: 450,
          overflowY: "auto",
          gap: 1,
        }}
      >
        {/* Number of Squads Input */}
        <TextField
          label="Number of Squads"
          type="number"
          value={numSquads}
          onChange={handleNumSquadsChange}
          margin="none"
          size="small"
          fullWidth
          required // Use InputProps here
          helperText={`Min ${minSquads}, Max ${maxSquads}`}
          sx={{ mt: 1 }} // Add margin top
        />

        {/* Auto Assign Buttons (only if numSquads is valid) */}
        {numberOfSquads >= minSquads && (
          <Box mb={1}>
            <Typography variant="body1" fontWeight={"bold"} sx={{ mb: 1 }}>
              Auto Assign Squads
            </Typography>
            <Box display={"flex"} gap={2} justifyContent="center">
              <Button
                variant="contained"
                onClick={() => handleAutoAssign("random")}
                size="small"
                color="secondary"
              >
                Random
              </Button>
              <Button
                variant="contained"
                onClick={() => handleAutoAssign("balanced")}
                size="small"
                color="primary"
              >
                Balanced (ELO)
              </Button>
            </Box>
          </Box>
        )}

        {/* Manual Assignment Section (only if numSquads is valid) */}
        {numberOfSquads >= minSquads && numberOfSquads <= maxSquads ? (
          <>
            {unassignedAttendees.length > 0 && (
              <Box>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1" fontWeight={"bold"}>
                      Unassigned Attendees ({unassignedAttendees.length})
                    </Typography>
                  </Box>
                </Box>
                <List dense disablePadding>
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
                        <div className="text-sm">{attendee.player.name}</div>
                        <div className="text-xs font-bold italic">
                          ELO: {attendee.elo}
                        </div>
                      </div>
                      {renderAssignmentBoxes(attendee)}
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 1 }} />
              </Box>
            )}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <GroupsIcon color="action" />
                <Typography variant="body1" fontWeight={"bold"}>
                  Squads ({localSquads.length})
                </Typography>
              </Box>
              {localSquads.map((squad, index) => {
                const assignedPlayersToThisSquad = attendees.filter(
                  (att) => attendeeAssignments[att.pt_id] === index
                );
                const averageElo = calculateAverageElo(
                  assignedPlayersToThisSquad
                );
                const maxPlayers = calculateMaxPlayersPerSquad();
                const isEditingName = editingSquadId === squad.id;

                return (
                  <Paper
                    key={squad.id}
                    elevation={1}
                    sx={{ mb: 1.5, borderLeft: `4px solid ${squad.color}` }}
                  >
                    {/* Squad Header */}
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1,
                        bgcolor: "action.hover",
                      }}
                      // Prevent collapse toggle when clicking edit elements
                      onClick={
                        !isEditingName
                          ? () =>
                              setOpenSquads((prev) => ({
                                ...prev,
                                [squad.id]: !prev[squad.id],
                              }))
                          : undefined
                      }
                      style={{ cursor: isEditingName ? "default" : "pointer" }}
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
                            onChange={(e) => handleSquadNameChange(e, squad.id)}
                            onBlur={() =>
                              handleFinishEditingSquadName(squad.id)
                            }
                            onKeyDown={(e) =>
                              handleKeyDownOnNameInput(e, squad.id)
                            }
                            variant="standard" // Use standard for less intrusive editing
                            size="small"
                            autoFocus // Focus when editing starts
                            onClick={(e) => e.stopPropagation()} // Prevent collapse toggle
                            slotProps={{ htmlInput: { maxLength: 20 } }}
                            sx={{
                              flexGrow: 1,
                              mr: 1,
                              "& .MuiInput-input": {
                                fontWeight: "bold",
                                fontSize: "1rem",
                              },
                            }} // Style to match Typography
                          />
                        ) : (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            onClick={(e) =>
                              handleStartEditingSquadName(e, squad.id)
                            }
                            sx={{ cursor: "text" }}
                          >
                            <Typography variant="subtitle1" fontWeight="bold">
                              {squad.name}
                            </Typography>
                            <EditIcon
                              fontSize="small"
                              color="action"
                              sx={{ opacity: 0.6 }}
                            />
                          </Box>
                        )}
                        {/* <Typography variant="subtitle1" fontWeight="bold">
                          {squad.name}
                        </Typography> */}
                        <Box
                          display={"flex"}
                          flexDirection={"column"}
                          gap={0.5}
                        >
                          <Chip
                            label={`Avg ELO: ${averageElo}`}
                            size="small"
                            // variant="outlined"
                          />
                          <Chip
                            label={`${assignedPlayersToThisSquad.length}/${maxPlayers} Players`}
                            size="small"
                            variant={
                              assignedPlayersToThisSquad.length >= maxPlayers
                                ? "filled"
                                : "outlined"
                            }
                            color={
                              assignedPlayersToThisSquad.length >= maxPlayers
                                ? "error"
                                : "default"
                            }
                          />
                        </Box>
                      </Box>
                      <IconButton size="small" aria-label="show players">
                        {openSquads[squad.id] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </Box>
                    {/* Collapsible Player List for the Squad */}
                    <Collapse in={openSquads[squad.id] ?? false}>
                      <List dense disablePadding sx={{ p: 1 }}>
                        {assignedPlayersToThisSquad.length === 0 ? (
                          <ListItem>
                            <ListItemText
                              secondary="No players assigned"
                              sx={{ fontStyle: "italic" }}
                            />
                          </ListItem>
                        ) : (
                          assignedPlayersToThisSquad
                            .sort((a, b) => b.elo - a.elo) // Sort players within squad
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
                                {renderAssignmentBoxes(attendee)}
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
          // Message if number of squads isn't set yet
          <Alert severity="info" sx={{ mt: 2 }}>
            Please enter the number of squads for this round above to start
            assigning players.
          </Alert>
        )}
      </Box>

      {/* Footer Buttons */}
      <Box
        mt={2}
        display="flex"
        justifyContent="space-between"
        alignItems={"center"}
        width={"100%"}
      >
        <Button onClick={handleBack} variant="text" size="small">
          Back
        </Button>
        <Box display={"flex"} alignItems={"center"} gap={1}>
          {/* Show Skip only if not the first round */}
          {currentRoundIndex > 0 && (
            <Button
              color="secondary"
              onClick={() => setSkipConfirmationOpen(true)}
              variant="outlined"
              size="small"
            >
              Skip Round
            </Button>
          )}
          {/* Show Save & Next if not the last round, else show Save & Finish */}
          <Button
            onClick={handleGoToSchedule}
            variant="contained"
            color="primary"
            disabled={nextBtnDisabled}
            size="small"
          >
            Save & Finish
          </Button>
        </Box>
      </Box>

      {/* Modals */}
      <AutoAssignConfirmationModal
        open={isAutoAssignConfirmationOpen}
        onClose={handleCloseAutoAssignConfirmation}
        onConfirm={handleConfirmAutoAssign}
        assignType={autoAssignType}
      />
      <SkipConfirmationModal
        open={skipConfirmationOpen}
        onClose={handleCloseSkipConfirmation}
        onConfirmSkip={handleConfirmSkip}
        canSave={allPlayersAssigned}
        onSaveAndSkip={allPlayersAssigned ? handleSaveAndSkip : undefined}
        currentRoundIndex={currentRoundIndex}
      />
      <NavigateBackConfirmationModal
        open={navigateBackConfirmationOpen}
        onClose={handleCloseNavigateBackConfirmation}
        onNavigateBackWithoutSave={handleConfirmNavigateBackWithoutSave}
        canSave={allPlayersAssigned}
        onSaveAndNavigateBack={
          allPlayersAssigned ? handleSaveAndNavigateBack : undefined
        }
        currentRoundIndex={currentRoundIndex}
      />
    </Box>
  );
};

export default CreateSquadsStep;
