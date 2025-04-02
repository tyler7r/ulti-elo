import { supabase } from "@/lib/supabase";
import { AlertType } from "@/lib/types";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Fade,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

type RetireSquadProps = {
  squadId: string;
  teamId: string;
  onClose: () => void;
  openRetireSquadModal: boolean;
  updateSquads: () => void;
};

const RetireSquad = ({
  squadId,
  teamId,
  onClose,
  openRetireSquadModal,
  updateSquads,
}: RetireSquadProps) => {
  const [squadName, setSquadName] = useState("");
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const getSquadName = async () => {
      // Fetch existing squad details
      const { data: squadData, error: squadError } = await supabase
        .from("squads")
        .select("name")
        .eq("id", squadId)
        .single();
      if (squadError) {
        console.error("Error fetching squad:", squadError);
        return;
      }

      setSquadName(squadData?.name || "");
    };

    if (teamId && squadId) {
      getSquadName();
    }
  }, [teamId, squadId]);

  const handleRetireSquad = async () => {
    setLoading(true);
    try {
      // 1. Update the squad to inactive
      const { error: squadError } = await supabase
        .from("squads")
        .update({ active: false })
        .eq("id", squadId);

      if (squadError) throw squadError;

      // 2. Update all associated squad_players to inactive
      const { error: squadPlayersError } = await supabase
        .from("squad_players")
        .update({ active: false })
        .eq("squad_id", squadId);

      if (squadPlayersError) {
        console.error(
          "Error making squad players inactive:",
          squadPlayersError
        );
        // Optionally, you might want to revert the squad status here or handle the error differently
        setAlert({
          message:
            "Squad retired, but there was an error making squad players inactive.",
          severity: "error",
        });
        setLoading(false);
        updateSquads();
        return;
      }

      setAlert({ message: "Squad retired successfully!", severity: "success" });
      setLoading(false);
      updateSquads();
    } catch (error) {
      console.error("Error retiring squad:", error);
      setLoading(false);
    }
  };

  return (
    <Modal
      open={openRetireSquadModal}
      onClose={onClose}
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
    >
      <Fade in={openRetireSquadModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", md: "500px" },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="flex flex-col w-full">
                <Typography variant="h5" color="primary" fontWeight={"bold"}>
                  Retire {squadName}
                </Typography>
              </div>
              <IconButton
                onClick={onClose}
                sx={{ position: "absolute", top: 10, right: 10 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <form
              onSubmit={handleRetireSquad}
              className="space-y-4 flex flex-col gap-2"
            >
              <Typography>
                Are you sure you want to retire {squadName}? This will also make
                all players in this squad inactive.
              </Typography>
              {alert.message && (
                <Alert severity={alert.severity}>{alert.message}</Alert>
              )}
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleRetireSquad}
                disabled={loading}
              >
                {loading ? "Retiring..." : "Retire Squad"}
              </Button>
            </form>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default RetireSquad;
