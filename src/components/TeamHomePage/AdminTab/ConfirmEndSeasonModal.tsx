// /components/TeamSettings/ConfirmEndSeasonModal.tsx (Example path)

import CloseIcon from "@mui/icons-material/Close";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";

interface ConfirmEndSeasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>; // Make confirm async
  currentSeasonNo: number | null;
  nextSeasonNo: number | null;
  isLoading: boolean; // Receive loading state
}

const ConfirmEndSeasonModal = ({
  open,
  onClose,
  onConfirm,
  currentSeasonNo,
  nextSeasonNo,
  isLoading,
}: ConfirmEndSeasonModalProps) => {
  const handleConfirmClick = async () => {
    // The actual async logic is handled by the onConfirm prop passed from parent
    await onConfirm();
    // Parent will handle closing on success/failure if needed
  };

  return (
    <Modal
      open={open}
      onClose={isLoading ? undefined : onClose} // Prevent closing while loading
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
      aria-labelledby="confirm-end-season-modal-title"
      aria-describedby="confirm-end-season-modal-description"
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
          {/* Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              id="confirm-end-season-modal-title"
              variant="h5"
              component="h2"
              fontWeight="bold"
              color="primary"
              display="flex"
              alignItems="center"
              gap={1}
            >
              Confirm Season Transition
            </Typography>
            <IconButton
              onClick={onClose}
              aria-label="close modal"
              disabled={isLoading}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Warning Text */}
          <Typography
            id="confirm-end-season-modal-description"
            sx={{ mt: 1 }}
            component="div"
          >
            Are you sure you want to end{" "}
            <strong>Season {currentSeasonNo ?? "N/A"}</strong> and immediately
            start <strong>Season {nextSeasonNo ?? "N/A"}</strong>?
            <Typography variant="body2" color="text.secondary">
              • Current player stats for Season {currentSeasonNo ?? "N/A"} will
              be archived. <br />
              • Live player stats (ELO, Wins, Losses, Streaks, etc.) will be
              reset to default values for the new season. <br />• This action
              cannot be easily undone.
            </Typography>
          </Typography>

          {/* Action Buttons */}
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
            }}
          >
            <Button
              onClick={onClose}
              disabled={isLoading}
              variant="outlined"
              color="inherit"
              size="small"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary" // Use warning color for this action
              onClick={handleConfirmClick} // Call the passed confirm handler
              disabled={isLoading}
              size="small"
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                `End S${currentSeasonNo ?? ""} & Start S${nextSeasonNo ?? ""}`
              )}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default ConfirmEndSeasonModal;
