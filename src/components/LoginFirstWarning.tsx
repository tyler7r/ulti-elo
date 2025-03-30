import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
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
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle fontWeight={"bold"}>Login Required</DialogTitle>
      <DialogContent>
        <Typography>
          You must be logged in before you can {requestedAction}!
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClick} variant="outlined">
          Login
        </Button>
        <Button onClick={handleClose} variant="text" color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginFirstWarning;
