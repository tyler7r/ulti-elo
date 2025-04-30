// /components/Session/AddManualGameModal.tsx
import { supabase } from "@/lib/supabase";
import { GameScheduleType, SquadType } from "@/lib/types";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Fade,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

type AddManualGameModalProps = {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  teamId: string; // Optional, if needed
  squads: SquadType[];
  currentSchedule: GameScheduleType[]; // To determine next game number
  roundNo: number;
  onSuccess: () => void;
};

const AddManualGameModal = ({
  open,
  onClose,
  sessionId,
  squads,
  currentSchedule,
  onSuccess,
  roundNo,
}: AddManualGameModalProps) => {
  const [squadAId, setSquadAId] = useState<string>("");
  const [squadBId, setSquadBId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!squadAId || !squadBId) {
      setError("Please select both squads.");
      return;
    }
    if (squadAId === squadBId) {
      setError("Squads cannot play against themselves.");
      return;
    }

    setLoading(true);
    const maxGameNumber = Math.max(
      0,
      ...currentSchedule.map((g) => g.game_number)
    );
    const nextGameNumber = maxGameNumber + 1;

    try {
      const { error: insertError } = await supabase
        .from("game_schedule")
        .insert({
          squad_a_id: squadAId,
          squad_b_id: squadBId,
          status: "pending",
          session_id: sessionId,
          game_number: nextGameNumber,
          round_no: roundNo,
        });

      if (insertError) {
        throw insertError;
      }

      setLoading(false);
      setSquadAId(""); // Reset form
      setSquadBId("");
      onSuccess(); // Call parent callback
    } catch (err) {
      console.error("Error adding manual game:", err);
      setLoading(false);
    }
  };

  // Reset form state when modal closes or opens
  useEffect(() => {
    if (!open) {
      setSquadAId("");
      setSquadBId("");
      setError(null);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
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
          <Typography
            variant="h6"
            component="h2"
            fontWeight={"bold"}
            color="primary"
            mb={2}
          >
            Add Game to Schedule
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ position: "absolute", top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            display={"flex"}
            flexDirection={"column"}
            width={"100%"}
            gap={1}
            mb={2}
          >
            <Box>
              <FormControl fullWidth>
                <InputLabel id="squad-a-select-label">Squad A</InputLabel>
                <Select
                  labelId="squad-a-select-label"
                  id="squad-a-select"
                  value={squadAId}
                  label="Squad A"
                  onChange={(e) => setSquadAId(e.target.value)}
                  disabled={loading}
                >
                  {squads.map((squad) => (
                    <MenuItem
                      key={squad.id}
                      value={squad.id}
                      disabled={squad.id === squadBId}
                    >
                      {squad.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth>
                <InputLabel id="squad-b-select-label">Squad B</InputLabel>
                <Select
                  labelId="squad-b-select-label"
                  id="squad-b-select"
                  value={squadBId}
                  label="Squad B"
                  onChange={(e) => setSquadBId(e.target.value)}
                  disabled={loading}
                >
                  {squads.map((squad) => (
                    <MenuItem
                      key={squad.id}
                      value={squad.id}
                      disabled={squad.id === squadAId}
                    >
                      {squad.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={
                loading || !squadAId || !squadBId || squadAId === squadBId
              }
            >
              {loading ? <CircularProgress size={24} /> : "Add Game"}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default AddManualGameModal;
