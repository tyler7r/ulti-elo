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

interface NavigateBackConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateBackWithoutSave: () => void;
  canSave: boolean;
  onSaveAndNavigateBack?: () => void;
  currentRoundIndex: number;
}

const NavigateBackConfirmationModal = ({
  open,
  onClose,
  onNavigateBackWithoutSave,
  canSave,
  onSaveAndNavigateBack,
  currentRoundIndex,
}: NavigateBackConfirmationModalProps) => {
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
            component="h2"
            fontWeight={"bold"}
            color="primary"
          >
            Confirm Navigation
          </Typography>
          <Typography id="modal-description" sx={{ mt: 1 }}>
            You are navigating away from Round {currentRoundIndex + 1}.
          </Typography>
          {canSave ? (
            <Typography id="modal-description-assigned" sx={{ mt: 1 }}>
              All players in this round are currently assigned. What would you
              like to do?
            </Typography>
          ) : (
            <Typography id="modal-description-unassigned" sx={{ mt: 1 }}>
              Any unsaved squad assignments in this round will be lost.
            </Typography>
          )}
          <Box
            mt={2}
            display="flex"
            flexDirection="column"
            gap={1}
            width={"100%"}
          >
            {canSave && onSaveAndNavigateBack && (
              <Button
                onClick={onSaveAndNavigateBack}
                variant="contained"
                color="primary"
                size="small"
              >
                Save & Go Back
              </Button>
            )}
            <Box
              display={"flex"}
              width={"100%"}
              flexDirection={canSave ? "row" : "column"}
              alignItems={canSave ? "center" : "flex-start"}
              justifyContent={"space-between"}
              gap={1}
            >
              <Button
                onClick={onClose}
                color="primary"
                variant={canSave ? "outlined" : "contained"}
                size={"small"}
                fullWidth
              >
                Continue Working
              </Button>
              <Button
                onClick={onNavigateBackWithoutSave}
                variant="outlined"
                color="secondary"
                size={"small"}
                fullWidth
              >
                Don&rsquo;t Save & Go Back
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default NavigateBackConfirmationModal;
