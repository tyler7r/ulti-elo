import GameWeightModal from "@/components/Utils/GameWeightModal";
import { supabase } from "@/lib/supabase";
import {
  AlertType,
  GameFormSquadType,
  GameScheduleWithPlayerDetails,
  GameType,
  SquadWithPlayerDetails,
} from "@/lib/types";
import { submitGame } from "@/pages/api/submitGame";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"; // Import the info icon
import {
  Alert,
  Backdrop,
  Box,
  Button,
  ButtonGroup,
  Fade,
  FormControl,
  FormLabel,
  IconButton,
  Modal,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
// import OverlappingPlayers from "./OverlappingPlayers";

type RecordScoreModalProps = {
  teamId: string;
  onClose: () => void;
  open: boolean;
  // updateSquads: () => void;
  gameSchedule: GameScheduleWithPlayerDetails;
  onSuccess: () => void;
  sessionId: string;
};

const RecordScoreModal = ({
  teamId,
  onClose,
  open,
  sessionId,
  onSuccess,
  gameSchedule,
}: RecordScoreModalProps) => {
  // const [squads, setSquads] = useState<GameFormSquadType[]>([]);
  const [squadA, setSquadA] = useState<GameFormSquadType | null>(null);
  const [squadB, setSquadB] = useState<GameFormSquadType | null>(null);
  // const [overlappingPlayers, setOverlappingPlayers] = useState<Player[]>([]);
  const [formData, setFormData] = useState<GameType>({
    id: "",
    team_id: teamId,
    match_date: new Date().toDateString(),
    squad_a_score: 0,
    squad_b_score: 0,
    squad_a_id: squadA?.id || "",
    squad_b_id: squadB?.id || "",
    game_weight: "standard",
    session_id: sessionId,
  });
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const formattedSquads = (squad: SquadWithPlayerDetails) => {
      return {
        id: squad.id,
        name: squad.name,
        score: 0,
        players: squad.squad_players.map((sp) => ({
          pt_id: sp.pt_id,
          name: sp.player_teams.player.name,
          elo: sp.player_teams.elo,
        })),
      };
    };
    const formattedA = formattedSquads(gameSchedule.squad_a);
    const formattedB = formattedSquads(gameSchedule.squad_b);
    setSquadA(formattedA);
    setSquadB(formattedB);
  }, [gameSchedule]);

  useEffect(() => {
    const { squad_a_score, squad_b_score } = formData;
    const totalScore = squad_a_score + squad_b_score;
    if (!squadA || !squadB || totalScore <= 0 || loading) {
      setDisabled(true);
    } else setDisabled(false);
  }, [formData, squadA, squadB, loading]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("score") ? parseInt(value) || 0 : value,
    }));
  };

  const handleWeightChange = (
    gameType: "casual" | "standard" | "competitive"
  ) => {
    setFormData((prev) => ({
      ...prev,
      game_weight: gameType,
    }));
  };

  const handleOpenInfoModal = () => {
    setIsInfoModalOpen(true);
  };

  const handleCloseInfoModal = () => {
    setIsInfoModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!squadA || !squadB) {
      setAlert({ message: "Please select both squads!", severity: "error" });
      return;
    }

    const squadAPlayers = squadA.players;
    const squadBPlayers = squadB.players;

    const scoreA = formData.squad_a_score;
    const scoreB = formData.squad_b_score;
    const gameWeight = formData.game_weight;

    const sqA = {
      id: squadA.id,
      name: squadA.name,
      players: squadAPlayers,
      score: scoreA,
    };
    const sqB = {
      id: squadB.id,
      name: squadB.name,
      players: squadBPlayers,
      score: scoreB,
    };
    const success = await submitGame({
      teamId,
      sqA,
      sqB,
      gameWeight,
      sessionId: sessionId,
    });
    if (success) {
      setAlert({ message: "Game Recorded!", severity: "success" });
      const { error: gameScheduleUpdateError } = await supabase
        .from("game_schedule")
        .update({
          status: "completed",
          squad_a_score: formData.squad_a_score,
          squad_b_score: formData.squad_b_score,
          game_id: success,
        })
        .eq("id", gameSchedule.id);
      if (gameScheduleUpdateError) {
        setAlert({
          message: "Error updating game schedule!",
          severity: "error",
        });
      } else {
        onSuccess();
      }
    } else {
      setAlert({ message: "Error submitting game.", severity: "error" });
    }
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
      sx={{ overflow: "scroll" }}
    >
      <Fade in={open}>
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
            overflow: "scroll",
            maxHeight: "80vh",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h5" color="primary" fontWeight={"bold"}>
                Score Report
              </Typography>
              <IconButton
                onClick={onClose}
                sx={{ position: "absolute", top: 10, right: 10 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <form onSubmit={handleSubmit} className="flex flex-col">
              {/* Scores */}
              <div
                className={`${
                  isMobile ? "flex-col" : "flex-row justify-between"
                } flex w-full`}
              >
                <Box display={"flex"} alignItems={"center"} gap={1}>
                  <Box
                    height={25}
                    width={25}
                    sx={{ backgroundColor: theme.palette.primary.main }}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label={`${
                      squadA?.name ? `${squadA.name} Score` : "Squad A Score"
                    }`}
                    type="number"
                    name="squad_a_score"
                    onChange={handleInputChange}
                    required
                    size="small"
                  />
                </Box>
                <Box display={"flex"} alignItems={"center"} gap={1}>
                  <Box
                    height={25}
                    width={25}
                    sx={{ backgroundColor: theme.palette.secondary.main }}
                  />
                  <TextField
                    required
                    fullWidth
                    margin="normal"
                    label={`${
                      squadB?.name ? `${squadB.name} Score` : "Squad B Score"
                    }`}
                    type="number"
                    name="squad_b_score"
                    onChange={handleInputChange}
                    size="small"
                  />
                </Box>
              </div>
              <FormControl component="fieldset" sx={{ marginBottom: 2 }}>
                <div className="flex w-full items-center">
                  <FormLabel sx={{ fontWeight: "bold", paddingY: 1 }}>
                    Game Weight
                  </FormLabel>
                  <IconButton
                    onClick={handleOpenInfoModal}
                    size="small"
                    aria-label="game type info"
                  >
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </div>
                <ButtonGroup
                  variant="outlined"
                  aria-label="game type button group"
                  fullWidth
                  sx={{ marginTop: 1 }}
                >
                  <Button
                    onClick={() => handleWeightChange("casual")}
                    color={
                      formData.game_weight === "casual"
                        ? "secondary"
                        : "inherit"
                    }
                    variant={
                      formData.game_weight === "casual" ? "contained" : "text"
                    }
                    size="small"
                    sx={{ fontWeight: "bold" }}
                  >
                    0.75x
                  </Button>
                  <Button
                    onClick={() => handleWeightChange("standard")}
                    color={
                      formData.game_weight === "standard"
                        ? "secondary"
                        : "inherit"
                    }
                    variant={
                      formData.game_weight === "standard" ? "contained" : "text"
                    }
                    size="small"
                    sx={{ fontWeight: "bold" }}
                  >
                    1x
                  </Button>
                  <Button
                    onClick={() => handleWeightChange("competitive")}
                    color={
                      formData.game_weight === "competitive"
                        ? "secondary"
                        : "inherit"
                    }
                    variant={
                      formData.game_weight === "competitive"
                        ? "contained"
                        : "text"
                    }
                    size="small"
                    sx={{ fontWeight: "bold" }}
                  >
                    1.25x
                  </Button>
                </ButtonGroup>
              </FormControl>
              {/* Info Modal */}
              <GameWeightModal
                open={isInfoModalOpen}
                onClose={handleCloseInfoModal}
              />
              {alert.message && (
                <Alert severity={alert.severity} sx={{ fontWeight: "bold" }}>
                  {alert.message}
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={disabled}
              >
                {loading ? "Loading..." : "Submit Game"}
              </Button>
            </form>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default RecordScoreModal;
