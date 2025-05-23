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

interface AutoAssignConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (overwrite: boolean) => void;
  assignType: "balanced" | "random" | null;
}

const AutoAssignConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  assignType,
}: AutoAssignConfirmationModalProps) => {
  const formattedType = assignType && assignType.charAt(0).toLocaleUpperCase();

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
          <div className="flex items-center gap-0.5">
            <Typography fontWeight={"bold"} variant="h6" color="primary">
              Confirm Auto-Assign
            </Typography>
            <Typography
              variant="subtitle2"
              fontStyle={"italic"}
            >{`(${formattedType})`}</Typography>
          </div>
          <Typography id="modal-description" sx={{ mt: 1 }}>
            You have already manually assigned some players. Do you want to:
          </Typography>
          <Box
            mt={2}
            display="flex"
            flexDirection={"column"}
            justifyContent="flex-end"
            gap={1}
          >
            <Button
              onClick={() => onConfirm(false)}
              variant="contained"
              size="small"
            >
              Auto-assign Unassigned Players
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => onConfirm(true)}
              size="small"
            >
              Overwrite All Assignments
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AutoAssignConfirmationModal;
