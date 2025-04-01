import GameWeightModal from "@/components/Utils/GameWeightModal";
import { getOverlappingPlayers } from "@/lib/getOverlappingPlayers";
import { supabase } from "@/lib/supabase";
import { AlertType, GameFormSquadType, GameType, Player } from "@/lib/types";
import { submitGame } from "@/pages/api/submitGame";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"; // Import the info icon
import {
  Alert,
  Autocomplete,
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
} from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import OverlappingPlayers from "./OverlappingPlayers";

type GameFormProps = {
  teamId: string;
  onClose: () => void;
  openNewGameModal: boolean;
  updateSquads: () => void;
};

const GameForm = ({
  teamId,
  onClose,
  openNewGameModal,
  updateSquads,
}: GameFormProps) => {
  const [squads, setSquads] = useState<GameFormSquadType[]>([]);
  const [squadA, setSquadA] = useState<GameFormSquadType | null>(null);
  const [squadB, setSquadB] = useState<GameFormSquadType | null>(null);
  const [overlappingPlayers, setOverlappingPlayers] = useState<Player[]>([]);
  const [formData, setFormData] = useState<GameType>({
    id: "",
    team_id: teamId,
    match_date: new Date().toDateString(),
    squad_a_score: 0,
    squad_b_score: 0,
    squad_a_id: squadA?.id || "",
    squad_b_id: squadB?.id || "",
    game_weight: "standard",
  });
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    const fetchSquads = async () => {
      const { data, error } = await supabase
        .from("squads")
        .select(
          "id, name, squad_players(player_id, active, players(name, elo))"
        )
        .eq("team_id", teamId)
        .eq("active", true)
        .eq("squad_players.active", true);

      if (error) {
        console.error("Error fetching squads", error);
        return;
      }
      const formattedSquads = data.map((squad) => ({
        id: squad.id,
        name: squad.name,
        score: 0,
        players: squad.squad_players.map((sp) => ({
          id: sp.player_id,
          name: sp.players.name,
          elo: sp.players.elo,
        })),
      }));
      setSquads(formattedSquads);
    };
    fetchSquads();
  }, [teamId, openNewGameModal, overlappingPlayers]);

  useEffect(() => {
    const { squad_a_score, squad_b_score } = formData;
    const totalScore = squad_a_score + squad_b_score;
    const overlap = overlappingPlayers.length > 0;
    if (!squadA || !squadB || totalScore <= 0 || loading || overlap) {
      setDisabled(true);
    } else setDisabled(false);
  }, [formData, squadA, squadB, loading, overlappingPlayers]);

  useEffect(() => {
    const overlapping = getOverlappingPlayers(squadA, squadB);
    setOverlappingPlayers(overlapping);
  }, [squadA, squadB]);

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

    if (overlappingPlayers.length > 0) {
      setAlert({
        message: "Squads have overlapping players. Please resolve them first.",
        severity: "error",
      });
      setLoading(false);
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
    });
    if (success) {
      setAlert({ message: "Game Recorded!", severity: "success" });
      void router.push(`/games/${success}`);
    } else {
      setAlert({ message: "Error submitting game.", severity: "error" });
    }
    setLoading(false);
  };

  return (
    <Modal
      open={openNewGameModal}
      onClose={onClose}
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
      sx={{ overflow: "scroll" }}
    >
      <Fade in={openNewGameModal}>
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h5" color="primary" fontWeight={"bold"}>
                New Game
              </Typography>
              <IconButton
                onClick={onClose}
                sx={{ position: "absolute", top: 10, right: 10 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <form onSubmit={handleSubmit} className="flex flex-col">
              {squads.length > 0 && (
                <div className="flex flex-col gap-4">
                  {/* Squad A Selection */}
                  <div>
                    <FormControl fullWidth>
                      <Autocomplete
                        options={squads.filter((s) => s.id !== squadB?.id)} // Exclude Squad B
                        getOptionLabel={(option) => option.name}
                        renderOption={(props, option) => (
                          <li
                            {...props}
                            key={option.id}
                            className="text-xs cursor-pointer mb-1 px-2"
                          >
                            <strong className="text-sm">{option.name}:</strong>
                            {option.players.map((p) => (
                              <div key={p.id}>
                                {p.elo ? `${p.name} (ELO: ${p.elo})` : p.name}
                              </div>
                            ))}
                          </li>
                        )}
                        value={squadA}
                        onChange={(_, newValue) => setSquadA(newValue)}
                        renderInput={(params) => (
                          <TextField {...params} label="Select Squad A" />
                        )}
                      />
                    </FormControl>
                  </div>

                  {/* Squad B Selection */}
                  <div>
                    <FormControl fullWidth>
                      <Autocomplete
                        options={squads.filter((s) => s.id !== squadA?.id)} // Exclude Squad A
                        getOptionLabel={(option) => option.name}
                        renderOption={(props, option) => (
                          <li
                            {...props}
                            key={option.id}
                            className="text-xs cursor-pointer mb-1 px-2"
                          >
                            <strong className="text-sm">{option.name}:</strong>
                            {option.players.map((p) => (
                              <div key={p.id}>
                                {p.elo ? `${p.name} (ELO: ${p.elo})` : p.name}
                              </div>
                            ))}
                          </li>
                        )}
                        value={squadB}
                        onChange={(_, newValue) => setSquadB(newValue)}
                        renderInput={(params) => (
                          <TextField {...params} label="Select Squad B" />
                        )}
                      />
                    </FormControl>
                  </div>
                </div>
              )}
              {/* Scores */}
              <div className="flex w-full gap-2">
                <TextField
                  fullWidth
                  margin="normal"
                  label={`${
                    squadA?.name ? `${squadA.name} Score` : "Squad B Score"
                  }`}
                  type="number"
                  name="squad_a_score"
                  onChange={handleInputChange}
                  required
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
                />
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
                    Casual
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
                    Standard
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
                    Competitive
                  </Button>
                </ButtonGroup>
              </FormControl>
              {/* Info Modal */}
              <GameWeightModal
                open={isInfoModalOpen}
                onClose={handleCloseInfoModal}
              />
              {overlappingPlayers.length > 0 && squadA && squadB && (
                <OverlappingPlayers
                  squadA={squadA}
                  squadB={squadB}
                  setAlert={setAlert}
                  setSquadA={setSquadA}
                  setSquadB={setSquadB}
                  updateSquads={updateSquads}
                  overlappingPlayers={overlappingPlayers}
                />
              )}
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

export default GameForm;
