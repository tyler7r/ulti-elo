// /components/Session/ConfirmSquadsStep.tsx (Adjust path as needed)
import { RoundType } from "@/components/TeamHomePage/SessionsTab/Sessions/CreateSession/CreateSession";
import ConfirmDeleteRoundModal from "@/components/TeamHomePage/SessionsTab/Sessions/CreateSession/CreateSessionModals/ConfirmDeleteRoundModal";
import {
  ColoredSquad,
  squadColors,
} from "@/components/TeamHomePage/SessionsTab/Sessions/CreateSession/CreateSquads";
import SquadPlayerList from "@/components/TeamHomePage/SessionsTab/Sessions/SessionUI/SquadPlayerList";
import { PlayerTeamType } from "@/lib/types"; // Assuming path is correct
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  List, // Keep List import for structure, but maybe remove ListItemText
  Paper, // Import Paper
  Typography,
} from "@mui/material";
import { useState } from "react"; // Assuming path is correct

interface ConfirmSquadsStepProps {
  squads: RoundType[];
  onEditRound: (roundIndex: number) => void;
  onDeleteRound: (roundIndex: number) => void;
  onAddRound: (roundIndex: number) => void;
}

const ConfirmSquadsStep = ({
  squads,
  onEditRound,
  onDeleteRound,
  onAddRound,
}: ConfirmSquadsStepProps) => {
  const [openRounds, setOpenRounds] = useState<boolean[]>([true, false, false]);
  const [openSquadDetails, setOpenSquadDetails] = useState<{
    [squadId: string]: boolean;
  }>({}); // Use squadId as key
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [roundToDeleteIndex, setRoundToDeleteIndex] = useState<number | null>(
    null
  );

  // --- Toggle Functions ---
  const toggleRoundCollapse = (roundIndex: number) => {
    const updatedOpenRounds = [...openRounds];
    updatedOpenRounds[roundIndex] = !updatedOpenRounds[roundIndex];
    setOpenRounds(updatedOpenRounds);
  };

  const toggleSquadDetails = (squadId: string) => {
    setOpenSquadDetails((prev) => ({ ...prev, [squadId]: !prev[squadId] }));
  };

  // --- Helper Functions ---
  const getColoredSquads = (roundSquads: RoundType): ColoredSquad[] => {
    if (!roundSquads) return [];
    return roundSquads.map((squad, index) => ({
      ...squad,
      color: squadColors[index % squadColors.length],
    }));
  };

  const calculateAverageElo = (players: PlayerTeamType[]) => {
    if (!players || players.length === 0) return 0;
    return Math.round(
      players.reduce((acc, p) => acc + (p.elo ?? 0), 0) / players.length
    );
  };

  // --- Delete Modal Handlers ---
  const handleOpenDeleteModal = (roundIndex: number) => {
    setRoundToDeleteIndex(roundIndex);
    setIsDeleteModalOpen(true);
  };
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRoundToDeleteIndex(null);
  };
  const handleConfirmDelete = () => {
    if (roundToDeleteIndex !== null) {
      onDeleteRound(roundToDeleteIndex);
    }
    handleCloseDeleteModal();
  };

  // --- Render Logic ---
  return (
    <Box>
      <Typography variant="h6" fontWeight={"bold"} fontStyle={"italic"} mb={1}>
        Confirm Squads
      </Typography>

      {squads.map((roundSquads, roundIndex) =>
        roundSquads !== null ? (
          <Box
            key={roundIndex}
            mb={1}
            component={Paper}
            elevation={openRounds[roundIndex] ? 0 : 2}
            sx={{
              overflow: "hidden",
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              onClick={() => toggleRoundCollapse(roundIndex)}
              sx={{ cursor: "pointer", p: 1 }} // Subtle background for header
            >
              <Typography variant="body1" fontWeight="bold">
                Round {roundIndex + 1}
              </Typography>
              <Box>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRound(roundIndex);
                  }}
                  size="small"
                  color="primary"
                  title={`Edit Round ${roundIndex + 1}`}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                {roundIndex > 0 && (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDeleteModal(roundIndex);
                    }}
                    size="small"
                    color="error"
                    title={`Delete Round ${roundIndex + 1}`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
                {/* Collapse/Expand Icon */}
                <IconButton
                  aria-expanded={openRounds[roundIndex]}
                  aria-label="show round details"
                  size="small"
                >
                  {openRounds[roundIndex] ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
              </Box>
            </Box>

            {/* Collapsible Round Content */}
            <Collapse in={openRounds[roundIndex]}>
              <Box>
                {getColoredSquads(roundSquads).map((squad) => (
                  // Use Paper with borderLeft for each squad
                  <Paper
                    key={squad.id}
                    elevation={1}
                    sx={{
                      mb: 1.5,
                      borderLeft: `4px solid ${squad.color}`, // Colored border styling
                      overflow: "hidden", // Ensure border radius works with collapse
                    }}
                  >
                    {/* Squad Header (Clickable to toggle player list) */}
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      onClick={() => toggleSquadDetails(squad.id)}
                      sx={{
                        cursor: "pointer",
                        p: 1,
                        bgcolor: "action.hover",
                        // Removed background color from here
                      }}
                    >
                      {/* Squad Name and Stats */}
                      <Box
                        display={"flex"}
                        alignItems={"center"}
                        gap={1}
                        width={"100%"}
                        justifyContent={"space-around"}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          color="text.primary"
                        >
                          {squad.name}
                        </Typography>
                        <Box
                          display={"flex"}
                          flexDirection={"column"}
                          gap={0.5}
                        >
                          <Chip
                            label={`Avg ELO: ${calculateAverageElo(
                              squad.players
                            )}`}
                            size="small"
                          />
                          <Chip
                            label={`${squad.players.length} players`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      {/* Squad Collapse/Expand Icon */}
                      <IconButton
                        aria-expanded={openSquadDetails[squad.id] ?? false}
                        aria-label="show players"
                        size="small"
                        color="inherit" // Inherit color
                      >
                        {openSquadDetails[squad.id] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </Box>

                    {/* Collapsible Player List */}
                    <Collapse in={openSquadDetails[squad.id] ?? false}>
                      {/* Use List for structure, but simple Typography for items */}
                      <List dense sx={{ p: 1, pt: 0.5 }}>
                        {squad.players.length === 0 ? (
                          <Typography
                            variant="body2"
                            sx={{
                              fontStyle: "italic",
                              textAlign: "center",
                              py: 1,
                            }}
                          >
                            No players assigned.
                          </Typography>
                        ) : (
                          <SquadPlayerList
                            players={squad.players}
                            squadName={squad.name}
                            color={squad.color}
                            disablePlayerClick={true}
                          />
                        )}
                      </List>
                    </Collapse>
                  </Paper>
                ))}
              </Box>
            </Collapse>
          </Box>
        ) : (
          // Render "Add Round" button
          roundIndex > 0 &&
          Array.isArray(squads[roundIndex - 1]) && (
            <Box key={`add-round-${roundIndex}`} sx={{ px: 2 }}>
              <Button
                startIcon={<AddIcon />}
                onClick={() => onAddRound(roundIndex)}
                variant="outlined"
                size="small"
              >
                Add Round {roundIndex + 1}
              </Button>
            </Box>
          )
        )
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteRoundModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirmDelete={handleConfirmDelete}
        roundNumber={roundToDeleteIndex !== null ? roundToDeleteIndex + 1 : 0}
      />
    </Box>
  );
};

export default ConfirmSquadsStep;
