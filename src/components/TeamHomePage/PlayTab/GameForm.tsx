import { getOverlappingPlayers } from "@/lib/getOverlappingPlayers";
import { supabase } from "@/lib/supabase";
import {
  AlertType,
  GameFormSquadType,
  GameType,
  PlayerEloType,
} from "@/lib/types";
import { updatePlayerStats } from "@/lib/updatePlayerStats";
import { submitGame } from "@/pages/api/submitGame";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Autocomplete,
  Backdrop,
  Box,
  Button,
  Fade,
  FormControl,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import OverlappingPlayers from "./OverlappingPlayers";

type GameFormType = {
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
}: GameFormType) => {
  const [squads, setSquads] = useState<GameFormSquadType[]>([]);
  const [squadA, setSquadA] = useState<GameFormSquadType | null>(null);
  const [squadB, setSquadB] = useState<GameFormSquadType | null>(null);
  const [overlappingPlayers, setOverlappingPlayers] = useState<PlayerEloType[]>(
    []
  );
  const [formData, setFormData] = useState<GameType>({
    id: "",
    team_id: teamId,
    match_date: new Date().toDateString(),
    squad_a_score: 0,
    squad_b_score: 0,
    squad_a_id: squadA?.id || "",
    squad_b_id: squadB?.id || "",
  });
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

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

  const determineWinner = (
    squadA: GameFormSquadType,
    squadB: GameFormSquadType
  ) => {
    if (formData.squad_a_score > formData.squad_b_score)
      return squadA.players.map((player) => player.id);
    if (formData.squad_b_score > formData.squad_a_score)
      return squadB.players.map((player) => player.id);
    return []; // No winner in case of a tie
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

    const winnerIds = determineWinner(squadA, squadB);

    const squadAPlayers = squadA.players;
    const squadBPlayers = squadB.players;

    for (const player of squadAPlayers.concat(squadBPlayers)) {
      const isWinner = winnerIds.includes(player.id);
      await updatePlayerStats(player.id, isWinner);
    }

    const scoreA = formData.squad_a_score;
    const scoreB = formData.squad_b_score;
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
              <Typography variant="h5" color="primary">
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
                                {p.name} (ELO: {p.elo})
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
                                {p.name} (ELO: {p.elo})
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
