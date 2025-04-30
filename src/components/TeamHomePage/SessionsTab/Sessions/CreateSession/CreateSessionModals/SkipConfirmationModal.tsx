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

interface SkipConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmSkip: () => void;
  canSave: boolean;
  onSaveAndSkip?: () => void;
  currentRoundIndex: number;
}

const SkipConfirmationModal = ({
  open,
  onClose,
  onConfirmSkip,
  canSave,
  onSaveAndSkip,
  currentRoundIndex,
}: SkipConfirmationModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
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
            width: { xs: "85%", md: "500px" }, // Similar width
            p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
            borderRadius: 2,
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            id="modal-title"
            variant="h6"
            fontWeight={"bold"}
            color="secondary"
          >
            Confirm Skip
          </Typography>
          <Typography id="modal-description" sx={{ mt: 1 }}>
            You are skipping Round {currentRoundIndex + 1}. Any unsaved squad
            assignments will be lost. Are you sure?
          </Typography>
          <Box
            mt={2}
            display="flex"
            flexDirection={"column"}
            width={"100%"}
            justifyContent="flex-end"
            gap={1}
          >
            <Button
              variant="contained"
              color="secondary"
              onClick={onConfirmSkip}
              size="small"
            >
              Yes, Skip & Discard
            </Button>
            {canSave && onSaveAndSkip ? (
              <Button
                variant="contained"
                color="primary"
                onClick={onSaveAndSkip}
                size="small"
              >
                Save & Skip
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                onClick={onClose}
                size="small"
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default SkipConfirmationModal;
