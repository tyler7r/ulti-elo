import { GameScheduleWithPlayerDetails } from "@/lib/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete"; // Keep delete if needed
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditNoteIcon from "@mui/icons-material/EditNote";
import KeyboardDoubleArrowDown from "@mui/icons-material/KeyboardDoubleArrowDown";
import KeyboardDoubleArrowUp from "@mui/icons-material/KeyboardDoubleArrowUp";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import ConfirmDeleteScheduledGameModal from "./HelperModals/ConfirmDeleteScheduledGame";
import SquadPlayerList from "./SquadPlayerList";

type PendingGameCardProps = {
  id: string;
  game: GameScheduleWithPlayerDetails; // Use detailed type
  onRecordScore: () => void;
  onDelete: () => void; // Keep delete functionality
  isAdmin: boolean; // Receive admin status
};

const PendingGameCard = ({
  id,
  game,
  onRecordScore,
  onDelete,
  isAdmin,
}: PendingGameCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id, disabled: !isAdmin });

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const headerBackgroundColor = isDarkMode ? "grey.700" : "grey.300";
  const [expanded, setExpanded] = useState(false);
  const [isDeleteGameOpen, setIsDeleteGameOpen] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 100 : "auto",
    border: `1px solid ${theme.palette.divider}`, // Add border similar to Game.tsx
  };

  const squadAName = game.squad_a?.name ?? "Squad A";
  const squadBName = game.squad_b?.name ?? "Squad B";

  const squadAPlayers = game.squad_a.squad_players ?? [];
  const squadBPlayers = game.squad_b.squad_players ?? [];

  const handleOpenDeleteGameModal = () => {
    if (!isAdmin) return; // Ensure only admin can open
    setIsDeleteGameOpen(true);
  };

  const handleCloseDeleteGameModal = () => {
    setIsDeleteGameOpen(false);
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={2}
      className="rounded-sm w-full"
    >
      <div className="flex gap-1">
        {isAdmin && (
          <Box
            {...attributes}
            {...listeners}
            sx={{
              cursor: "grab",
              display: "flex",
              alignItems: "center",
              touchAction: "none",
              color: "text.secondary",
              backgroundColor: headerBackgroundColor,
            }}
            aria-label="Drag to reorder"
          >
            <DragIndicatorIcon />
          </Box>
        )}
        <div className="flex flex-col w-full">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={1}
            py={2}
          >
            <div className="flex flex-col gap-1">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "start", sm: "center" },
                  gap: { xs: 0.5, sm: 2 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    height={15}
                    width={15}
                    sx={{ backgroundColor: theme.palette.primary.main }}
                  />
                  <Typography variant="body1" fontWeight={"bold"} noWrap>
                    {squadAName}
                  </Typography>
                </Box>
                <Typography
                  fontWeight={"italic"}
                  variant="body2"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
                  vs.
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    height={15}
                    width={15}
                    sx={{ backgroundColor: theme.palette.secondary.main }}
                  />
                  <Typography variant="body1" fontWeight={"bold"} noWrap>
                    {squadBName}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Game {game.game_number} (Pending)
              </Typography>
            </div>
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                variant="contained"
                size="small"
                onClick={onRecordScore}
                startIcon={<EditNoteIcon />}
                disabled={!isAdmin}
                color="primary"
              >
                Record Score
              </Button>
            </Box>
          </Box>
          {/* Action Buttons (Expand/Delete) */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            pb={1}
            pt={0.5}
            px={1}
          >
            <Button
              onClick={() => setExpanded(!expanded)}
              color="inherit"
              variant="text"
              size="small"
              sx={{ fontWeight: "bold", p: 0.5 }}
            >
              {expanded ? "Hide Players" : "See Players"}
              {expanded ? (
                <KeyboardDoubleArrowUp fontSize="small" sx={{ ml: 0.5 }} />
              ) : (
                <KeyboardDoubleArrowDown fontSize="small" sx={{ ml: 0.5 }} />
              )}
            </Button>
            {isAdmin && (
              <IconButton
                size="small"
                onClick={handleOpenDeleteGameModal}
                color="error"
                aria-label="Delete game from schedule"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </div>
      </div>

      {/* Expanded Player List */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 1,
            p: 1.5,
          }}
        >
          <Box flex={1}>
            <SquadPlayerList
              players={squadAPlayers}
              squadName={squadAName}
              squadA={true}
              noEloChange={true}
            />
          </Box>
          <Box flex={1}>
            <SquadPlayerList
              players={squadBPlayers}
              squadName={squadBName}
              squadA={false}
              noEloChange={true}
            />
          </Box>
        </Box>
      </Collapse>

      {isDeleteGameOpen && (
        <ConfirmDeleteScheduledGameModal
          open={isDeleteGameOpen}
          onConfirmDelete={onDelete}
          onClose={handleCloseDeleteGameModal}
          gameDescription={`Game ${game.game_number}: ${
            game.squad_a?.name ?? "Squad A"
          } vs ${game.squad_b?.name ?? "Squad B"}`}
        />
      )}
    </Paper>
  );
};

export default PendingGameCard;
