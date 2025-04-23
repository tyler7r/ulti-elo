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

type ResetSquadsConfirmationProps = {
  isResetSquadsConfirmationOpen: boolean;
  handleCloseResetSquadsConfirmation: () => void;
  handleConfirmResetSquads: () => void;
};

const ResetSquadsConfirmation = ({
  isResetSquadsConfirmationOpen,
  handleCloseResetSquadsConfirmation,
  handleConfirmResetSquads,
}: ResetSquadsConfirmationProps) => {
  return (
    <Modal
      open={isResetSquadsConfirmationOpen}
      onClose={handleCloseResetSquadsConfirmation}
      aria-labelledby="reset-squads-confirmation-title"
      aria-describedby="reset-squads-confirmation-description"
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
    >
      <Fade in={isResetSquadsConfirmationOpen}>
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
            overflow: "scroll",
            maxHeight: "80vh",
          }}
        >
          <IconButton
            onClick={handleCloseResetSquadsConfirmation}
            sx={{ position: "absolute", top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            id="reset-squads-confirmation-title"
            variant="h6"
            fontWeight={"bold"}
            gutterBottom
          >
            Confirm Attendee Change
          </Typography>
          <Typography id="reset-squads-confirmation-description" sx={{ mb: 2 }}>
            Going back to change the attendees will reset all the squad
            configurations you have saved for this session. Are you sure you
            want to proceed?
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Button
              onClick={handleConfirmResetSquads}
              color="secondary"
              variant="contained"
            >
              Confirm Reset
            </Button>
            <Button
              onClick={handleCloseResetSquadsConfirmation}
              variant="outlined"
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default ResetSquadsConfirmation;
