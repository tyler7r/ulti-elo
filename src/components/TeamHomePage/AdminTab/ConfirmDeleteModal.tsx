// components/ConfirmDeleteModal.tsx (Suggested path)
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Backdrop,
  Box,
  Button,
  Fade,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  teamName: string;
  onConfirmDelete: () => void;
}

const ConfirmDeleteModal = ({
  open,
  onClose,
  teamName,
  onConfirmDelete,
}: ConfirmDeleteModalProps) => {
  const [confirmInput, setConfirmInput] = useState("");
  const isConfirmed = confirmInput === teamName;

  const handleConfirmAction = () => {
    if (isConfirmed) {
      onConfirmDelete();
      // Reset input on successful confirmation (optional, but clean)
      setConfirmInput("");
    }
  };

  const handleClose = () => {
    // Reset input when closing
    setConfirmInput("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
      aria-labelledby="confirm-delete-modal-title"
      aria-describedby="confirm-delete-modal-description"
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
            width: { xs: "90%", md: "500px" },
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 2,
            border: "2px solid", // Add a subtle border to match the danger theme
            borderColor: "error.main",
          }}
        >
          <IconButton
            size="small"
            sx={{ position: "absolute", top: 10, right: 10 }}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
          <Box display={"flex"} flexDirection={"column"}>
            <Typography variant="h6" fontWeight={"bold"} color="error">
              Permanently Delete Team
            </Typography>

            <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
              Are you absolutely sure you want to permanently delete the team
              &lsquo;{teamName}&rsquo;?
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This action cannot be undone and will remove all associated
              records.
              <br />
              Please type the team name &lsquo;{teamName}&rsquo; to confirm.
            </Typography>

            <TextField
              size="small"
              label={`Type "${teamName}" to confirm`}
              variant="outlined"
              fullWidth
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              error={confirmInput.length > 0 && !isConfirmed}
              helperText={
                confirmInput.length > 0 && !isConfirmed
                  ? "Input does not match the team name."
                  : ""
              }
            />

            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 1,
                mt: 3,
              }}
            >
              <Button
                color="secondary"
                size="small"
                variant="outlined"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleConfirmAction}
                disabled={!isConfirmed}
                size="small"
              >
                Delete Team
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default ConfirmDeleteModal;
