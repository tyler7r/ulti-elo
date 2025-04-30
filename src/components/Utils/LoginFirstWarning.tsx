import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, IconButton, Modal, Typography } from "@mui/material";
import { useRouter } from "next/router";

type LoginFirstWarningProps = {
  open: boolean;
  handleClose: () => void;
  requestedAction: string;
};

const LoginFirstWarning = ({
  open,
  handleClose,
  requestedAction,
}: LoginFirstWarningProps) => {
  const router = useRouter();

  const handleClick = () => {
    handleClose();
    void router.push("/auth/login");
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="rank-info-modal-title"
      aria-describedby="rank-info-modal-description"
    >
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
          onClick={handleClose}
          sx={{ position: "absolute", top: 10, right: 10 }}
        >
          <CloseIcon />
        </IconButton>
        <Typography
          id="rank-info-modal-title"
          variant="h5"
          component="h2"
          fontWeight={"bold"}
          color="primary"
          mb={1}
        >
          Login Required
        </Typography>
        <Typography>
          You must be logged in before you can {requestedAction}!
        </Typography>
        <Box
          display={"flex"}
          width={"100%"}
          justifyContent={"flex-end"}
          gap={1}
          mt={2}
          alignItems={"center"}
        >
          <Button onClick={handleClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button onClick={handleClick} variant="contained" color="primary">
            Login
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default LoginFirstWarning;
