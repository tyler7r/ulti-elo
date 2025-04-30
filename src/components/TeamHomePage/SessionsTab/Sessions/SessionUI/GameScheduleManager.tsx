// /components/Sessions/GameScheduleManager.tsx
import { supabase } from "@/lib/supabase";
import {
  GameHistoryType,
  GameScheduleWithPlayerDetails,
  SquadWithPlayerDetails,
} from "@/lib/types";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Divider,
  Typography,
} from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";
import CompactGame from "../../../../GameHistory/CompactGame";
import AddManualGameModal from "./AddManualGameModal";
import PendingGameCard from "./PendingGameCard";
import RecordScoreModal from "./RecordScoreModal";

type GameScheduleManagerProps = {
  pendingSchedule: GameScheduleWithPlayerDetails[];
  setPendingSchedule: React.Dispatch<
    React.SetStateAction<GameScheduleWithPlayerDetails[]>
  >; // For optimistic updates
  sessionId: string;
  teamId: string;
  squads: SquadWithPlayerDetails[]; // Needs session_round
  onScheduleUpdate: () => void; // Callback to refetch schedule from DB
  isAdmin: boolean;
  completedGameHistory: GameHistoryType[];
  isActive: boolean;
};

const GameScheduleManager = ({
  pendingSchedule,
  setPendingSchedule,
  sessionId,
  teamId,
  squads,
  onScheduleUpdate,
  isAdmin,
  completedGameHistory,
  isActive,
}: GameScheduleManagerProps) => {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedGameToRecord, setSelectedGameToRecord] =
    useState<GameScheduleWithPlayerDetails | null>(null);
  const [isAddManualGameModalOpen, setIsAddManualGameModalOpen] =
    useState(false);
  const [selectedRoundForManualAdd, setSelectedRoundForManualAdd] = useState<
    number | null
  >(null);
  const [dndError, setDndError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const squadRoundMap = useMemo(() => {
    const map = new Map<string, number>();
    squads.forEach((s) => map.set(s.id, s.session_round));
    return map;
  }, [squads]);

  // --- Group Schedule Items by Round ---
  const pendingScheduleByRound = useMemo(() => {
    const grouped: Record<number, GameScheduleWithPlayerDetails[]> = {};
    pendingSchedule.forEach((item) => {
      const roundNo = item.round_no;
      if (!grouped[roundNo]) grouped[roundNo] = [];
      grouped[roundNo].push(item);
    });
    return grouped;
  }, [pendingSchedule]);

  // --- Group Completed Games by Round (using squad lookup) ---
  const completedGamesByRound = useMemo(() => {
    const grouped: Record<number, GameHistoryType[]> = {};
    completedGameHistory.forEach((game) => {
      // Determine round based on squad A (or B if A is missing?)
      const roundNo = squadRoundMap.get(game.squad_a_id);
      if (roundNo !== undefined) {
        if (!grouped[roundNo]) grouped[roundNo] = [];
        grouped[roundNo].push(game);
      } else {
        console.warn(`Could not determine round for completed game ${game.id}`);
        // Optionally group these under an "Unknown Round" key
      }
    });
    // Sort games within each round by date (most recent first)
    Object.values(grouped).forEach((gamesInRound) => {
      gamesInRound.sort(
        (a, b) =>
          new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
      );
    });
    return grouped;
  }, [completedGameHistory, squadRoundMap]);

  // --- Determine Round Order (Completed rounds last) ---
  const roundOrder = useMemo(() => {
    const allRoundNumbers = new Set([
      ...Object.keys(pendingScheduleByRound).map(Number),
      ...Object.keys(completedGamesByRound).map(Number),
    ]);

    const pendingRoundNos: number[] = [];
    const completedRoundNos: number[] = [];

    allRoundNumbers.forEach((roundNo) => {
      const hasPending = pendingScheduleByRound[roundNo]?.length > 0;
      if (hasPending) {
        pendingRoundNos.push(roundNo);
      } else {
        // Considered complete if no pending games for this round exist in the state
        completedRoundNos.push(roundNo);
      }
    });

    pendingRoundNos.sort((a, b) => a - b);
    completedRoundNos.sort((a, b) => a - b);
    return [...pendingRoundNos, ...completedRoundNos];
  }, [pendingScheduleByRound, completedGamesByRound]);

  // --- Event Handlers ---
  const handleOpenRecordModal = (game: GameScheduleWithPlayerDetails) => {
    if (!isAdmin || !isActive) return;
    setSelectedGameToRecord(game);
    setIsRecordModalOpen(true);
  };
  const handleCloseRecordModal = () => setSelectedGameToRecord(null);
  const handleGameScoreRecorded = () => {
    handleCloseRecordModal();
    onScheduleUpdate(); // Refetch schedule data
  };

  const handleDeleteGame = useCallback(
    async (scheduleId: string) => {
      if (!isAdmin || !isActive) return;

      const originalItems = [...pendingSchedule];
      setPendingSchedule((prev) => prev.filter((g) => g.id !== scheduleId)); // Optimistic delete

      try {
        const { error } = await supabase
          .from("game_schedule")
          .delete()
          .match({ id: scheduleId });
        if (error) throw error;
        onScheduleUpdate(); // Refresh to ensure consistency
      } catch (error) {
        console.error("Failed to delete game:", error);
        setPendingSchedule(originalItems); // Revert
      }
    },
    [isAdmin, pendingSchedule, setPendingSchedule, onScheduleUpdate, isActive]
  );

  const handleOpenAddManualGameModal = (roundNo: number) => {
    if (!isAdmin || !isActive) return;
    setSelectedRoundForManualAdd(roundNo);
    setIsAddManualGameModalOpen(true);
  };
  const handleCloseAddManualGameModal = () =>
    setSelectedRoundForManualAdd(null);
  const handleManualGameAdded = () => {
    handleCloseAddManualGameModal();
    onScheduleUpdate(); // Refetch schedule data
  };

  // --- Drag and Drop Handler (Scoped within Round) ---
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!isAdmin || !isActive) return;
      const { active, over } = event;
      setDndError(null);

      if (over && active.id !== over.id) {
        const activeItem = pendingSchedule.find(
          (item) => item.id === active.id
        );
        if (!activeItem) return;
        const roundNo = activeItem.round_no;

        const currentRoundPending = pendingSchedule.filter(
          (item) => item.round_no === roundNo
        );
        const oldIndex = currentRoundPending.findIndex(
          (item) => item.id === active.id
        );
        const newIndex = currentRoundPending.findIndex(
          (item) => item.id === over.id
        );
        if (oldIndex === -1 || newIndex === -1) return;

        const reorderedRoundPending = arrayMove(
          currentRoundPending,
          oldIndex,
          newIndex
        );

        // Update the main pendingSchedule state
        setPendingSchedule((prev) => {
          const otherRounds = prev.filter((item) => item.round_no !== roundNo);
          const newState = [...otherRounds, ...reorderedRoundPending];
          // Recalculate game numbers for display? Or rely on DB refresh?
          // Let's recalculate session-wide pending game numbers optimistically
          let pendingCounter = 1;
          return newState
            .sort((a, b) => a.round_no - b.round_no) // Sort first
            .map((item) => ({
              ...item,
              game_number: pendingCounter++,
            }));
        });

        // Persist the new order (update game_number)
        const updates = reorderedRoundPending.map((item, index) => {
          // Calculate the correct absolute game number based on previous rounds' pending games
          const baseGameNumber = pendingSchedule.filter(
            (p) => p.round_no < roundNo
          ).length;
          return {
            id: item.id,
            game_number: baseGameNumber + index + 1, // Renumber within the round context, assuming session-wide pending count
            squad_a_score: item.squad_a_score,
            squad_a_id: item.squad_a_id,
            squad_b_score: item.squad_b_score,
            squad_b_id: item.squad_b_id,
            session_id: item.session_id,
          };
        });

        try {
          if (updates.length > 0) {
            const { error } = await supabase
              .from("game_schedule")
              .upsert(updates);
            if (error) throw error;
            onScheduleUpdate(); // Refresh to get definitive numbers from DB
          }
        } catch (error) {
          console.error("Error updating game order:", error);
          setDndError(`Failed to save order: ${error}. Refreshing...`);
          onScheduleUpdate(); // Revert/resync
        }
      }
    },
    [isAdmin, pendingSchedule, setPendingSchedule, onScheduleUpdate, isActive]
  );

  return (
    <Box p={2} display={"flex"} flexDirection={"column"}>
      {dndError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {dndError}
        </Alert>
      )}

      {roundOrder.map((roundNo) => {
        const pending = pendingScheduleByRound[roundNo] ?? [];
        const completed = completedGamesByRound[roundNo] ?? [];
        const pendingItemIds = pending.map((item) => item.id);
        const isRoundComplete = pending.length === 0 && completed.length > 0;

        return (
          <Box
            key={`round-container-${roundNo}`}
            display={"flex"}
            flexDirection={"column"}
            gap={1}
          >
            <Box
              display={"flex"}
              width={"100%"}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                }}
              >
                Round {roundNo} {isRoundComplete ? "(Completed)" : ""}
              </Typography>
              {isAdmin && isActive && (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddCircleOutlineIcon fontSize="small" />}
                    onClick={() => handleOpenAddManualGameModal(roundNo)}
                  >
                    Add R{roundNo} Game
                  </Button>
                </Box>
              )}
            </Box>
            {/* Completed Games Accordion using Game.tsx */}
            {completed.length > 0 && (
              <Accordion sx={{ borderRadius: "4px" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" fontWeight="bold">
                    Show {completed.length} Completed Game
                    {completed.length > 1 ? "s" : ""}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    p: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                  }}
                >
                  {/* Render Game component for each completed game */}
                  {completed.map((gameHistory) => (
                    <CompactGame
                      game={gameHistory}
                      key={gameHistory.id}
                      isAdmin={isAdmin}
                    />
                  ))}
                </AccordionDetails>
              </Accordion>
            )}
            {pending.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pendingItemIds}
                  strategy={verticalListSortingStrategy}
                  disabled={!isAdmin || !isActive}
                >
                  <Box
                    display="flex"
                    flexDirection="column"
                    gap={1.5}
                    sx={{ px: 1 }}
                  >
                    {pending.map((game) => (
                      <PendingGameCard
                        key={game.id}
                        id={game.id}
                        game={game}
                        onRecordScore={() => handleOpenRecordModal(game)}
                        onDelete={() => handleDeleteGame(game.id)}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </Box>
                </SortableContext>
              </DndContext>
            )}
            {/* Message if no pending games left in an active round */}
            {pending.length === 0 && !isRoundComplete && (
              <Typography sx={{ fontStyle: "italic", px: 1, py: 2 }}>
                No pending games for this round.
              </Typography>
            )}
            {/* Add Manual Game Button */}
            <Divider
              sx={{
                my: 3,
                display:
                  roundNo === roundOrder[roundOrder.length - 1]
                    ? "none"
                    : "block",
              }}
            />{" "}
            {/* Divider between rounds */}
          </Box>
        );
      })}

      {/* --- Modals --- */}
      {selectedGameToRecord && (
        <RecordScoreModal
          teamId={teamId}
          onClose={handleCloseRecordModal}
          open={isRecordModalOpen}
          sessionId={sessionId}
          onSuccess={handleGameScoreRecorded}
          gameSchedule={selectedGameToRecord} /* ... */
        />
      )}
      {isAddManualGameModalOpen && selectedRoundForManualAdd !== null && (
        <AddManualGameModal
          open={isAddManualGameModalOpen}
          onClose={handleCloseAddManualGameModal}
          sessionId={sessionId}
          teamId={teamId}
          squads={squads.filter(
            (s) => s.session_round === selectedRoundForManualAdd
          )}
          currentSchedule={pendingSchedule}
          roundNo={selectedRoundForManualAdd}
          onSuccess={handleManualGameAdded} /* ... */
        />
      )}
    </Box>
  );
};

export default GameScheduleManager;
