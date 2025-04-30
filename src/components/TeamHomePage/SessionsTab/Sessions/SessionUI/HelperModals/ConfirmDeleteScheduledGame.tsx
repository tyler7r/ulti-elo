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

interface ConfirmDeleteScheduledGameModalProps {
  open: boolean;
  onClose: () => void; // Function to close the modal
  onConfirmDelete: () => void; // Function to execute when deletion is confirmed
  gameDescription: string; // Text describing the game (e.g., "Game 5: Squad A vs Squad B")
}

const ConfirmDeleteScheduledGameModal = ({
  open,
  onClose,
  onConfirmDelete,
  gameDescription,
}: ConfirmDeleteScheduledGameModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose} // Close when clicking backdrop
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
      aria-labelledby="confirm-delete-game-modal-title"
      aria-describedby="confirm-delete-game-modal-description"
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
          }}
        >
          {/* Close Icon Button */}
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", top: 10, right: 10 }}
            aria-label="Close confirmation"
          >
            <CloseIcon />
          </IconButton>

          {/* Modal Title */}
          <Typography
            id="confirm-delete-game-modal-title"
            variant="h6"
            fontWeight={"bold"}
            color="error" // Use error color for delete confirmation title
          >
            Confirm Delete Game
          </Typography>

          {/* Modal Description */}
          <Typography id="confirm-delete-game-modal-description" sx={{ mt: 1 }}>
            Are you sure you want to remove the following game from the
            schedule?
            <Typography
              component="div"
              sx={{ mt: 1, fontWeight: "medium", fontStyle: "italic" }}
            >
              {gameDescription}
            </Typography>
            This action cannot be undone.
          </Typography>

          {/* Action Buttons */}
          <Box mt={3} display="flex" justifyContent="flex-end" gap={1.5}>
            <Button variant="outlined" onClick={onClose} size="small">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error" // Use error color for delete confirmation
              onClick={onConfirmDelete}
              size="small"
            >
              Confirm Delete
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default ConfirmDeleteScheduledGameModal;
