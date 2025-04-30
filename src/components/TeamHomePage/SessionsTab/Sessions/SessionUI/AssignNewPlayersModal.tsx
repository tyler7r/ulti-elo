// /components/Sessions/Modals/AssignNewPlayersModal.tsx (Adjust path)

import { PlayerTeamType, SquadWithPlayerDetails } from "@/lib/types"; // Adjust path
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import {
  Alert,
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
  Typography,
  useTheme,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
// Import types and colors from CreateSquads
import { calculateAverageElo } from "@/lib/getAverageElo"; // Adjust path
import { ColoredSquad, squadColors } from "../CreateSession/CreateSquads";

// Type for the assignment data passed back on confirm
export type NewPlayerAssignmentData = {
  [playerId: string]: {
    // Key is PlayerTeamType['pt_id']
    [roundNumber: number]: string | null; // Key is round number (1-based), value is squadId or null
  };
};

interface AssignNewPlayersModalProps {
  open: boolean;
  onClose: () => void;
  playersToAssign: PlayerTeamType[]; // The players needing assignment
  attendees: PlayerTeamType[]; // Pass the full CURRENT attendee list
  squadsByRound: Record<number, SquadWithPlayerDetails[]>; // Pre-grouped squads from parent
  roundNumbers: number[]; // Sorted array of round numbers
  onConfirmAssignments: (assignments: NewPlayerAssignmentData) => Promise<void>; // Async handler to save
  isLoading: boolean; // Receive loading state from parent
}

const AssignNewPlayersModal = ({
  open,
  onClose,
  playersToAssign,
  attendees, // Use this for max player calculation
  squadsByRound,
  roundNumbers,
  onConfirmAssignments,
  isLoading, // Use parent's loading state
}: AssignNewPlayersModalProps) => {
  const theme = useTheme();
  // State to track assignments within this modal: { [playerId]: { [roundNumber]: squadIndex | null } }
  const [assignments, setAssignments] = useState<
    Record<string, Record<number, number | null>>
  >({});
  // State to control collapse state of individual squad details within the reference section
  const [openReferenceSquads, setOpenReferenceSquads] = useState<
    Record<string, boolean>
  >({});
  // State to control collapse state of each ROUND within the reference section
  const [openReferenceRounds, setOpenReferenceRounds] = useState<
    Record<number, boolean>
  >({});
  const [error, setError] = useState<string | null>(null); // For general errors
  const [warning, setWarning] = useState<string | null>(null); // For non-blocking warnings

  // --- Memoized Calculations ---
  // Map round numbers to the actual squad data for easier access (includes color)
  const roundDataMap = useMemo(() => {
    const map: Record<number, ColoredSquad[]> = {};
    roundNumbers.forEach((roundNo) => {
      map[roundNo] = (squadsByRound[roundNo] ?? []).map((squad, index) => ({
        id: squad.id,
        name: squad.name,
        players:
          (squad.squad_players
            ?.map((sp) => sp.player_teams)
            .filter((pt) => pt !== null) as PlayerTeamType[]) ?? [],
        color: squadColors[index % squadColors.length],
      }));
    });
    return map;
  }, [roundNumbers, squadsByRound]);

  // Calculate "ideal" max players per squad for each round based on FINAL expected player count
  const idealMaxPlayersMap = useMemo(() => {
    const map: { [roundIndex: number]: number } = {};
    // Calculate total players *after* adding the new ones
    const finalTotalAttendeesCount = attendees.length + playersToAssign.length;

    roundNumbers.forEach((roundNo) => {
      const squadsInRound = squadsByRound[roundNo] ?? [];
      const numSquadsInRound = squadsInRound.length;
      if (numSquadsInRound > 0 && finalTotalAttendeesCount > 0) {
        // This is the calculated ideal max size
        map[roundNo] = Math.ceil(finalTotalAttendeesCount / numSquadsInRound);
      } else {
        map[roundNo] = Infinity; // No limit if calculation fails
      }
    });
    return map;
  }, [roundNumbers, squadsByRound, attendees.length, playersToAssign.length]); // Depend on attendee and playersToAdd length

  // Check if all assignments are complete for all players and all rounds
  const canConfirm = useMemo(() => {
    if (playersToAssign.length === 0) return false;
    return playersToAssign.every((player) =>
      roundNumbers.every(
        (roundNo) =>
          assignments[player.pt_id]?.[roundNo] !== null &&
          assignments[player.pt_id]?.[roundNo] !== undefined
      )
    );
  }, [playersToAssign, roundNumbers, assignments]);

  // --- Effects ---
  // Initialize assignment state when modal opens or players change
  useEffect(() => {
    if (open) {
      const initialAssignments: Record<
        string,
        Record<number, number | null>
      > = {};
      playersToAssign.forEach((player) => {
        initialAssignments[player.pt_id] = {};
        roundNumbers.forEach((roundNo) => {
          initialAssignments[player.pt_id][roundNo] = null; // Start unassigned
        });
      });
      setAssignments(initialAssignments);
      setError(null);
      setWarning(null); // Clear warning
      setOpenReferenceRounds({});
      setOpenReferenceSquads({});
    }
  }, [open, playersToAssign, roundNumbers]);

  // --- Handlers ---
  // Handles clicking a color box for a specific player and round
  const handleAssignPlayer = useCallback(
    (
      e: React.MouseEvent,
      player: PlayerTeamType,
      roundNo: number,
      targetSquadIndex: number
    ) => {
      e.stopPropagation();
      setError(null); // Clear general errors on interaction
      setWarning(null); // Clear warnings on interaction

      const currentAssignmentIndex = assignments[player.pt_id]?.[roundNo];
      const squadsInThisRound = roundDataMap[roundNo] ?? [];
      const targetSquad = squadsInThisRound[targetSquadIndex];
      if (!targetSquad) return;

      const idealMaxPlayers = idealMaxPlayersMap[roundNo];
      // Estimate final count in target squad *after* this potential assignment
      const currentPlayersInTarget = targetSquad.players.length;
      const newlyAssignedToTarget = playersToAssign.filter(
        (p) => assignments[p.pt_id]?.[roundNo] === targetSquadIndex
      ).length;
      // Calculate size *if* this player is assigned (or stays assigned)
      let estimatedFinalSize = currentPlayersInTarget + newlyAssignedToTarget;
      if (currentAssignmentIndex !== targetSquadIndex) {
        // If moving *to* this squad
        estimatedFinalSize++;
      }

      const newRoundAssignments = { ...(assignments[player.pt_id] || {}) };

      // Case 1: Clicking the box of the currently assigned squad -> Unassign for this round
      if (currentAssignmentIndex === targetSquadIndex) {
        newRoundAssignments[roundNo] = null;
      }
      // Case 2: Clicking a different squad's box (assign)
      else {
        // Show warning if assigning exceeds ideal max, but don't block
        if (estimatedFinalSize > idealMaxPlayers) {
          setWarning(
            `${targetSquad.name} will exceed the ideal max of ${idealMaxPlayers} players for Round ${roundNo}.`
          );
        }
        newRoundAssignments[roundNo] = targetSquadIndex; // Assign to new index
      }

      // Update the state for this player
      setAssignments((prev) => ({
        ...prev,
        [player.pt_id]: newRoundAssignments,
      }));
    },
    [assignments, roundDataMap, idealMaxPlayersMap, playersToAssign] // Added attendees.length
  );

  // Handle confirm button click
  const handleConfirmClick = async () => {
    // ... (logic remains the same as previous step: check canConfirm, map index to ID, call onConfirmAssignments) ...
    if (!canConfirm) {
      setError("Please assign each new player to a squad for every round.");
      return;
    }
    setError(null);
    setWarning(null); // Clear messages on save attempt
    const finalAssignmentsData: NewPlayerAssignmentData = {};
    let mappingError = false;
    try {
      playersToAssign.forEach((player) => {
        finalAssignmentsData[player.pt_id] = {};
        roundNumbers.forEach((roundNo) => {
          const assignedIndex = assignments[player.pt_id]?.[roundNo];
          if (assignedIndex !== null && assignedIndex !== undefined) {
            const squadId = roundDataMap[roundNo]?.[assignedIndex]?.id;
            if (!squadId) {
              mappingError = true;
              throw new Error(
                `Internal mapping error for ${player.player.name}, Round ${roundNo}`
              );
            }
            finalAssignmentsData[player.pt_id][roundNo] = squadId;
          } else {
            mappingError = true;
            throw new Error(
              `Assignment missing for ${player.player.name}, Round ${roundNo}`
            );
          }
        });
      });
      if (mappingError) return;
      await onConfirmAssignments(finalAssignmentsData);
    } catch (err) {
      console.error("Error confirming assignments:", err);
      setError(`Failed to save assignments: ${err}`);
    }
  };

  const toggleReferenceSquadDetails = (squadId: string) => {
    setOpenReferenceSquads((prev) => ({ ...prev, [squadId]: !prev[squadId] }));
  };

  const toggleReferenceRound = (roundNo: number) => {
    setOpenReferenceRounds((prev) => ({ ...prev, [roundNo]: !prev[roundNo] }));
  };

  // --- Helper to Render Assignment Boxes ---
  const renderAssignmentBoxes = (player: PlayerTeamType, roundNo: number) => {
    const squadsInThisRound = roundDataMap[roundNo] ?? [];

    return (
      <Box
        display="flex"
        alignItems="center"
        flexWrap="wrap"
        gap={0.5}
        mt={0.5}
      >
        {squadsInThisRound.map((squad, index) => {
          const isAssignedToThis =
            assignments[player.pt_id]?.[roundNo] === index;
          // Removed isDisabled check based on fullness

          return (
            <Box
              key={`${player.pt_id}-r${roundNo}-box-${index}`}
              onClick={(e) => handleAssignPlayer(e, player, roundNo, index)} // Assign always allowed now
              sx={{
                width: 20,
                height: 20,
                borderRadius: "4px",
                backgroundColor: squad.color,
                cursor: "pointer", // Always pointer
                border: isAssignedToThis
                  ? `2px solid ${theme.palette.text.primary}`
                  : "none",
                // Removed opacity change based on disabled state
                transition:
                  "border 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": { boxShadow: `0 0 4px ${squad.color}` }, // Hover always active
              }}
              title={`Assign to ${squad.name}`} // Simplified title
            />
          );
        })}
      </Box>
    );
  };

  // --- Render Modal ---
  return (
    <Modal open={open} onClose={onClose} /* ... other modal props ... */>
      <Fade in={open}>
        <Box
          sx={{
            /* ... modal box styles ... */ position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", md: "750px" },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 2,
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box>
            <Typography
              id="assign-new-players-modal-title"
              variant="h6"
              component="h2"
              fontWeight="bold"
              color="primary"
              mb={1}
            >
              Assign New Players to Squads
            </Typography>
            <IconButton
              onClick={onClose}
              aria-label="close modal"
              disabled={isLoading}
              sx={{ position: "absolute", top: 10, right: 10 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {warning && (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
              onClose={() => setWarning(null)}
            >
              {warning}
            </Alert>
          )}
          <Alert severity="info" sx={{ fontSize: "0.8rem", mb: 2 }}>
            Assign each newly added player to a squad for every round.
          </Alert>

          <Box sx={{ overflowY: "auto", flexGrow: 1, pr: 1 }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 2,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <PersonIcon color="action" fontSize="small" />
                <Typography variant="body1" fontWeight="bold">
                  Assign Players ({playersToAssign.length})
                </Typography>
              </Box>
              <List dense disablePadding>
                {playersToAssign.map((player) => (
                  <ListItem
                    key={player.pt_id}
                    disableGutters
                    sx={{
                      display: "block",
                      mb: 1.5,
                      borderBottom: `1px dashed ${theme.palette.divider}`,
                      pb: 1,
                    }}
                  >
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        {player.player.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontStyle: "italic" }}
                      >
                        (ELO: {player.elo})
                      </Typography>
                    </Box>
                    {roundNumbers.map((roundNo) => (
                      <Box
                        key={`assign-${player.pt_id}-r${roundNo}`}
                        display="flex"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Typography variant="body2" sx={{ minWidth: "70px" }}>
                          Round {roundNo}:
                        </Typography>
                        {renderAssignmentBoxes(player, roundNo)}
                      </Box>
                    ))}
                  </ListItem>
                ))}
              </List>
            </Paper>
            <Paper
              elevation={0}
              sx={{ p: 1.5, border: `1px solid ${theme.palette.divider}` }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <GroupsIcon color="action" fontSize="small" />{" "}
                <Typography variant="body1" fontWeight="bold">
                  Existing Squads (Reference)
                </Typography>
              </Box>
              {roundNumbers.map((roundNo) => (
                <Box key={`display-round-${roundNo}`} sx={{ mb: 1 }}>
                  {/* Round Header - Clickable */}
                  <Box
                    onClick={() => toggleReferenceRound(roundNo)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      p: 1,
                      px: 2,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      Round {roundNo}
                    </Typography>
                    <IconButton>
                      {openReferenceRounds[roundNo] ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </Box>
                  {/* Collapsible Squad List for the Round */}
                  <Collapse
                    in={openReferenceRounds[roundNo] ?? false}
                    timeout="auto"
                    unmountOnExit
                  >
                    <Box
                      display="grid"
                      gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
                      gap={1}
                      pl={1}
                    >
                      {(roundDataMap[roundNo] ?? []).map((squad, index) => {
                        // Use index from map
                        const avgElo = calculateAverageElo(squad.players);
                        const idealMaxPlayers = idealMaxPlayersMap[roundNo];
                        // Calculate ESTIMATED final count for display
                        const currentPlayersInTarget = squad.players.length;
                        const newlyAssignedToTarget = playersToAssign.filter(
                          (p) => assignments[p.pt_id]?.[roundNo] === index
                        );
                        const estimatedFinalPlayerCount =
                          currentPlayersInTarget + newlyAssignedToTarget.length;
                        const isOverIdealMax =
                          estimatedFinalPlayerCount > idealMaxPlayers;
                        const isAtIdealMax =
                          estimatedFinalPlayerCount === idealMaxPlayers;
                        const estimatedFinalTeam = [
                          ...squad.players,
                          ...newlyAssignedToTarget,
                        ];

                        return (
                          <Paper
                            key={`display-${squad.id}`}
                            elevation={0}
                            variant="outlined"
                            sx={{
                              borderLeft: `3px solid ${squad.color}`,
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                p: 1,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                              onClick={() =>
                                toggleReferenceSquadDetails(squad.id)
                              }
                              style={{ cursor: "pointer" }}
                            >
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                noWrap
                                title={squad.name}
                              >
                                {squad.name}
                              </Typography>
                              <Box display="flex" gap={0.5}>
                                <Chip
                                  label={`Avg: ${avgElo}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    height: "auto",
                                    "& .MuiChip-label": { py: 0.2, px: 0.8 },
                                  }}
                                />
                                {/* Updated Player Count Chip */}
                                <Chip
                                  label={`${estimatedFinalPlayerCount}/${idealMaxPlayers} P`} // Show estimated count vs ideal max
                                  size="small"
                                  variant="outlined"
                                  color={
                                    isOverIdealMax
                                      ? "error"
                                      : isAtIdealMax
                                      ? "warning"
                                      : "default"
                                  } // Use warning color if over
                                  sx={{
                                    height: "auto",
                                    "& .MuiChip-label": { py: 0.2, px: 0.8 },
                                  }}
                                  title={
                                    isOverIdealMax
                                      ? `Exceeds ideal max of ${idealMaxPlayers}`
                                      : `Players / Ideal Max`
                                  }
                                />
                              </Box>
                              <IconButton
                                size="small"
                                sx={{ p: 0 }}
                                aria-label="show players"
                              >
                                {openReferenceSquads[squad.id] ? (
                                  <ExpandLessIcon fontSize="small" />
                                ) : (
                                  <ExpandMoreIcon fontSize="small" />
                                )}
                              </IconButton>
                            </Box>
                            <Collapse
                              in={openReferenceSquads[squad.id] ?? false}
                            >
                              <List
                                dense
                                disablePadding
                                sx={{
                                  px: 1,
                                  pb: 0.5,
                                  pt: 0.5,
                                  overflowY: "auto",
                                  borderTop: `1px solid ${theme.palette.divider}`,
                                }}
                              >
                                {estimatedFinalTeam.length === 0 ? (
                                  <ListItemText
                                    secondary="Empty"
                                    sx={{
                                      fontStyle: "italic",
                                      textAlign: "center",
                                    }}
                                  />
                                ) : (
                                  estimatedFinalTeam.map((p) => (
                                    <ListItemText
                                      key={p.pt_id}
                                      primary={
                                        <Box
                                          display={"flex"}
                                          gap={1}
                                          alignItems={"center"}
                                        >
                                          {playersToAssign.includes(p) && (
                                            <Typography
                                              fontWeight={"bold"}
                                              variant="body2"
                                              color="success"
                                            >
                                              +
                                            </Typography>
                                          )}
                                          <Typography variant="body2">
                                            {p.player.name}
                                          </Typography>
                                          <Typography
                                            fontWeight={"bold"}
                                            variant="caption"
                                          >
                                            (ELO: {p.elo})
                                          </Typography>
                                        </Box>
                                      }
                                    />
                                  ))
                                )}
                              </List>
                            </Collapse>
                          </Paper>
                        );
                      })}
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Paper>
          </Box>

          {/* Modal Footer Actions */}
          <Box display="flex" justifyContent="flex-end" gap={1.5} mt={1} pt={1}>
            <Button
              onClick={onClose}
              disabled={isLoading}
              variant="outlined"
              color="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmClick}
              variant="contained"
              color="primary"
              disabled={isLoading || !canConfirm}
              startIcon={<CheckCircleOutlineIcon />}
            >
              {isLoading ? "Saving..." : "Confirm"}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AssignNewPlayersModal;
