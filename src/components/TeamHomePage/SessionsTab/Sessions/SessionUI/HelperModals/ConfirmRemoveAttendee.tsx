import { PlayerTeamType } from "@/lib/types"; // Adjust path
import CloseIcon from "@mui/icons-material/Close";
import {
  Backdrop,
  Box,
  Button,
  Fade,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";

interface ConfirmRemoveAttendeeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmRemove: () => void;
  player: PlayerTeamType | null; // Player to be removed
}

const ConfirmRemoveAttendeeModal = ({
  open,
  onClose,
  onConfirmRemove,
  player,
}: ConfirmRemoveAttendeeModalProps) => {
  if (!player) return null; // Don't render if no player selected

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
      aria-labelledby="confirm-remove-attendee-modal-title"
      aria-describedby="confirm-remove-attendee-modal-description"
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "85%", md: "450px" },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", top: 10, right: 10 }}
            aria-label="Close confirmation"
          >
            <CloseIcon />
          </IconButton>

          <Typography
            id="confirm-remove-attendee-modal-title"
            variant="h6"
            fontWeight={"bold"}
            color="error" // Use warning color
          >
            Confirm Remove Attendee
          </Typography>

          <Typography
            id="confirm-remove-attendee-modal-description"
            sx={{ mt: 2 }}
            component="div" // Use div to allow nesting if needed later
          >
            Are you sure you want to remove{" "}
            <Typography component="span" fontWeight="bold">
              {player.player.name}
            </Typography>{" "}
            from this session?
            <br /> <br />
            <Typography component="span" color="text.secondary">
              They will also be removed from any squads they are currently
              assigned to within this session. This action cannot be undone.
            </Typography>
          </Typography>

          <Box mt={3} display="flex" justifyContent="flex-end" gap={1.5}>
            <Button
              variant="outlined"
              onClick={onClose}
              size="small"
              color="primary"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error" // Use warning color for the action button
              onClick={onConfirmRemove}
              size="small"
            >
              Confirm Remove
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default ConfirmRemoveAttendeeModal;
