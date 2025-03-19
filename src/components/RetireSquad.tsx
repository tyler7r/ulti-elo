import { supabase } from "@/lib/supabase";
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
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      const { error } = await supabase
        .from("squads")
        .update({ active: false })
        .eq("id", squadId);

      if (error) throw error;

      setSuccess("Squad retired successfully!");
      setLoading(false);
      updateSquads();
    } catch (error) {
      console.error("Error retiring squad:", error);
      setError("An error occurred while retiring the squad.");
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
                <Typography variant="h5" color="primary">
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

            {error && (
              <Typography
                variant="overline"
                sx={{ fontWeight: "bold" }}
                color="error"
              >
                {error}
              </Typography>
            )}
            {success && (
              <Typography
                variant="overline"
                sx={{ fontWeight: "bold" }}
                color="success"
              >
                {success}
              </Typography>
            )}

            <form
              onSubmit={handleRetireSquad}
              className="space-y-4 flex flex-col gap-2"
            >
              <Typography>
                Are you sure you want to retire {squadName}?
              </Typography>
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
