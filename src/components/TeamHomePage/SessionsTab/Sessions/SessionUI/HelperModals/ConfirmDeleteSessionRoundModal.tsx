// /components/Sessions/Modals/ConfirmDeleteSessionRoundModal.tsx (Adjust path)

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

interface ConfirmDeleteSessionRoundModalProps {
  open: boolean;
  onClose: () => void; // Function to close the modal
  onConfirmDelete: () => void; // Function to execute when deletion is confirmed
  roundNumber: number; // The user-facing round number (e.g., 2)
  isLoading: boolean; // To disable buttons during deletion
}

const ConfirmDeleteSessionRoundModal = ({
  open,
  onClose,
  onConfirmDelete,
  roundNumber,
  isLoading,
}: ConfirmDeleteSessionRoundModalProps) => {
  return (
    <Modal
      open={open}
      onClose={isLoading ? undefined : onClose} // Prevent closing during loading
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
      aria-labelledby="confirm-delete-session-round-modal-title"
      aria-describedby="confirm-delete-session-round-modal-description"
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
            disabled={isLoading}
          >
            <CloseIcon />
          </IconButton>

          {/* Modal Title */}
          <Typography
            id="confirm-delete-session-round-modal-title"
            variant="h6"
            fontWeight={"bold"}
            color="error"
          >
            Confirm Delete Round {roundNumber}
          </Typography>

          {/* Modal Description */}
          <Typography
            id="confirm-delete-session-round-modal-description"
            sx={{ mt: 2 }}
            component="div"
          >
            Are you sure you want to permanently delete Round {roundNumber}?
            <br /> <br />
            <Typography component="span" color="text.secondary" variant="body2">
              This will delete **all squads** created for this round and **all
              associated pending games** from the schedule. This action cannot
              be undone.
            </Typography>
          </Typography>

          {/* Action Buttons */}
          <Box mt={3} display="flex" justifyContent="flex-end" gap={1.5}>
            <Button
              variant="outlined"
              onClick={onClose}
              size="small"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={onConfirmDelete}
              size="small"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Confirm Delete"}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default ConfirmDeleteSessionRoundModal;
