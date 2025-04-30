import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AlertType, TeamType } from "@/lib/types";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useState } from "react";

type NoAccessPageProps = {
  team: TeamType;
  isAdmin: boolean;
  ownerName: string | undefined;
};

const NoAccessPage = ({ team, isAdmin, ownerName }: NoAccessPageProps) => {
  const { user } = useAuth();
  const [openRequestAdminDialog, setOpenRequestAdminDialog] = useState(false);
  const [requestAdminLoading, setRequestAdminLoading] = useState(false);
  const [requestAdminMessage, setRequestAdminMessage] = useState<AlertType>({
    message: null,
    severity: "error",
  });
  const router = useRouter();

  const handleRequestAdmin = async () => {
    setRequestAdminLoading(true);
    if (team.id && user) {
      const { error } = await supabase
        .from("admin_requests")
        .insert([{ user_id: user.id, team_id: team.id }]);
      if (error) {
        if (error.code === "23505") {
          setRequestAdminMessage({
            message:
              "You have already submitted a request to be an admin for this team!",
            severity: "info",
          });
        }
        setRequestAdminMessage({
          message: `Error sending admin request: ${error.message}`,
          severity: "error",
        });
        setRequestAdminLoading(false);
      } else {
        setRequestAdminMessage({
          message: "Request sent to the team owner.",
          severity: "success",
        });

        try {
          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              teamId: team.id,
            }),
          });

          if (response.ok) {
            setRequestAdminMessage({
              message: "Email sent successfully",
              severity: "success",
            });
          } else {
            setRequestAdminMessage({
              message: "Failed to send email notification to team owner.",
              severity: "error",
            });
          }
        } catch (error) {
          console.error("Error calling send-email API", error);
        }
        setTimeout(() => {
          handleRequestDialogClose();
        }, 1000);
      }
    } else {
      setRequestAdminLoading(false);
      setRequestAdminMessage({ message: null, severity: "error" });
      void router.push("/auth/login");
    }
  };

  const handleRequestDialogClose = () => {
    setRequestAdminLoading(false);
    setOpenRequestAdminDialog(false);
    setRequestAdminMessage({ message: null, severity: "error" });
  };

  return (
    <Box
      sx={{ px: 2, py: 4 }}
      display={"flex"}
      flexDirection={"column"}
      justifyContent={"center"}
      alignItems={"center"}
      textAlign={"center"}
      gap={2}
    >
      <LockIcon sx={{ fontSize: "64px" }} color="disabled" />
      <Typography fontWeight={"bold"} variant="h5" color="error">
        Access Denied
      </Typography>
      <Typography fontWeight={"bold"}>
        You must be a verified user and a team admin to access the contents of
        this page.
      </Typography>
      {user && !isAdmin && (
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          onClick={() => setOpenRequestAdminDialog(true)}
        >
          Request Admin Access
        </Button>
      )}
      {!user && (
        <Button
          variant="outlined"
          onClick={() => void router.push("/auth/login")}
        >
          Login
        </Button>
      )}
      <Modal
        open={openRequestAdminDialog}
        onClose={handleRequestDialogClose}
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
            onClick={handleRequestDialogClose}
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
            Request Admin Access
          </Typography>
          <Typography>
            {user
              ? `You must be a team admin for ${
                  team?.name ? team.name : "this team"
                } to record games. Request admin access to
              this team. The team owner (${ownerName}) will be notified.`
              : `You must have a registered account and be a team admin for ${
                  team?.name ? team.name : "this team"
                } before you can record games.`}
          </Typography>
          {requestAdminMessage.message && (
            <Alert severity={requestAdminMessage.severity}>
              {requestAdminMessage.message}
            </Alert>
          )}
          <Box
            display={"flex"}
            width={"100%"}
            justifyContent={"flex-end"}
            gap={1}
            mt={2}
          >
            <Button
              onClick={handleRequestDialogClose}
              color="secondary"
              size="small"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              disabled={requestAdminLoading}
              variant="contained"
              onClick={handleRequestAdmin}
              size="small"
            >
              {requestAdminLoading
                ? "Loading..."
                : user
                ? "Send Request"
                : "Login"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default NoAccessPage;
