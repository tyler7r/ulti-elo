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

interface ConfirmDeleteRoundModalProps {
  open: boolean;
  onClose: () => void; // Function to close the modal
  onConfirmDelete: () => void; // Function to execute when deletion is confirmed
  roundNumber: number; // The user-facing round number (e.g., 2 for roundIndex 1)
}

const ConfirmDeleteRoundModal = ({
  open,
  onClose,
  onConfirmDelete,
  roundNumber,
}: ConfirmDeleteRoundModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose} // Close when clicking backdrop
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
      aria-labelledby="confirm-delete-round-modal-title"
      aria-describedby="confirm-delete-round-modal-description"
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "85%", md: "450px" }, // Style similar to Skip modal
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            // Removed scroll properties as content is short
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
            id="confirm-delete-round-modal-title"
            variant="h6"
            fontWeight={"bold"}
            color="error"
            component="h2"
          >
            Confirm Delete Round
          </Typography>

          {/* Modal Description */}
          <Typography
            id="confirm-delete-round-modal-description"
            sx={{ mt: 1 }}
          >
            Are you sure you want to permanently delete Round {roundNumber} and
            all its squad assignments? This action cannot be undone.
          </Typography>

          {/* Action Buttons */}
          <Box
            mt={3} // Increased margin slightly
            display="flex"
            justifyContent="flex-end" // Align buttons to the right
            gap={1.5} // Add gap between buttons
          >
            <Button
              variant="outlined" // Use outlined for cancel
              onClick={onClose}
              size="small"
            >
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

export default ConfirmDeleteRoundModal;
