import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Fade,
  IconButton,
  Modal,
  Typography,
  useTheme,
} from "@mui/material";

interface GameWeightModalProps {
  open: boolean;
  onClose: () => void;
}

const GameWeightModal = ({ open, onClose }: GameWeightModalProps) => {
  const theme = useTheme();
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="game-weight-info-modal-title"
      aria-describedby="game-weight-info-modal-description"
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
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            id="game-weight-info-modal-title"
            variant="h6"
            component="h2"
            fontWeight={"bold"}
            color="primary"
          >
            Game Weight Information
          </Typography>
          <Typography id="game-weight-info-modal-description" sx={{ mt: 2 }}>
            The game weight affects how much your ELO rating changes after a
            match:
          </Typography>
          <Typography component="div" sx={{ mt: 1 }}>
            <ul>
              <li>
                <strong>Casual</strong> (
                <span
                  style={{
                    color: theme.palette.secondary.main,
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  0.75x
                </span>
                ): Results in smaller ELO changes, suitable for less serious
                games.
              </li>
              <li>
                <strong>Standard</strong> (
                <span
                  style={{
                    color: theme.palette.secondary.main,
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  1x
                </span>
                ): Applies a standard amount of ELO change.
              </li>
              <li>
                <strong>Competitive</strong> (
                <span
                  style={{
                    color: theme.palette.secondary.main,
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  1.25x
                </span>
                ): Leads to larger ELO changes, reflecting higher stakes.
              </li>
            </ul>
          </Typography>
          <Button onClick={onClose} sx={{ mt: 2 }}>
            Close
          </Button>
        </Box>
      </Fade>
    </Modal>
  );
};

export default GameWeightModal;
