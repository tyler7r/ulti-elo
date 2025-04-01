// components/EditGameForm.tsx
import { useAuth } from "@/contexts/AuthContext";
import { getEditOverlappingPlayers } from "@/lib/getOverlappingPlayers";
import { supabase } from "@/lib/supabase";
import {
  AlertType,
  GameDetails,
  GamePlayerWithPlayer,
  Player,
} from "@/lib/types";
import CheckIcon from "@mui/icons-material/Check";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import UndoIcon from "@mui/icons-material/Undo";
import {
  Alert,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import GameWeightModal from "../Utils/GameWeightModal";
import EditGamePlayers from "./EditGamePlayers";
import EditOverlappingPlayers from "./EditOverlappingPlayers";

type EditGameFormProps = {
  gameId: string;
  singleGame?: boolean;
};

const EditGameForm = ({ gameId, singleGame }: EditGameFormProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const gmId = router.query.gameId;
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [squadAScore, setSquadAScore] = useState<number | "">("");
  const [squadBScore, setSquadBScore] = useState<number | "">("");
  const [squadAPlayers, setSquadAPlayers] = useState<GamePlayerWithPlayer[]>(
    []
  );
  const [squadBPlayers, setSquadBPlayers] = useState<GamePlayerWithPlayer[]>(
    []
  );
  const [gameWeight, setGameWeight] = useState<string>("standard");
  const [overlappingPlayers, setOverlappingPlayers] = useState<Player[]>([]);
  const squadAIDs = squadAPlayers.map((p) => p.id);
  const squadBIDs = squadBPlayers.map((p) => p.id);
  const [allTeamPlayers, setAllTeamPlayers] = useState<GamePlayerWithPlayer[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  useEffect(() => {
    const fetchGameData = async () => {
      if (gameId && !gameDetails) {
        setLoading(true);
        setAlert({ message: null, severity: "error" });
        try {
          // Fetch team ID
          const { data: gameTeam, error: teamError } = await supabase
            .from("games")
            .select("team_id")
            .eq("id", gameId as string)
            .single();

          if (teamError || !gameTeam) {
            console.error("Error fetching team ID:", teamError);
            setAlert({
              message: "Failed to fetch team details.",
              severity: "error",
            });
            setLoading(false);
            return;
          }

          // Fetch all players for the team
          const { data: playerTeams, error: playersError } = await supabase
            .from("player_teams")
            .select("player_id, players(id, name)")
            .eq("team_id", gameTeam.team_id);

          if (playersError || !playerTeams) {
            console.error("Error fetching team players:", playersError);
            setAlert({
              message: "Failed to fetch team players.",
              severity: "error",
            });
            setLoading(false);
            return;
          }
          setAllTeamPlayers(playerTeams.map((pt) => pt.players));

          // Fetch game details
          const response = await fetch(`/api/edit-game/${gameId}`);
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error fetching game details:", errorData);
            setAlert({
              message: errorData.error || "Failed to fetch game details.",
              severity: "error",
            });
            setLoading(false);
            return;
          }
          const data: GameDetails = await response.json();
          setGameDetails(data);
          setSquadAScore(data.game.squad_a_score);
          setSquadBScore(data.game.squad_b_score);
          setSquadAPlayers(data.squadA.players);
          setSquadBPlayers(data.squadB.players);
          setGameWeight(data.game.game_weight);
          setLoading(false);
        } catch (err) {
          console.error("Error in fetchGameData:", err);
          setAlert({
            message: "An unexpected error occurred.",
            severity: "error",
          });
          setLoading(false);
        }
      }
    };

    fetchGameData();
  }, [gameId, gameDetails]);

  useEffect(() => {
    const overlapping = getEditOverlappingPlayers(squadAPlayers, squadBPlayers);
    setOverlappingPlayers(overlapping);
  }, [squadAPlayers, squadBPlayers]);

  const handleWeightChange = (
    gameType: "casual" | "standard" | "competitive"
  ) => {
    setGameWeight(gameType);
  };

  const handleOpenInfoModal = () => {
    setIsInfoModalOpen(true);
  };

  const handleCloseInfoModal = () => {
    setIsInfoModalOpen(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setAlert({ message: null, severity: "error" });

    if (
      !gameDetails?.game?.team_id ||
      !gameDetails?.squadA?.id ||
      !gameDetails?.squadB?.id ||
      !user
    ) {
      setAlert({
        message: "Missing game or squad information.",
        severity: "error",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/save-edited-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: gameId,
          squadAId: gameDetails.squadA.id,
          squadBId: gameDetails.squadB.id,
          squadAScore: Number(squadAScore),
          squadBScore: Number(squadBScore),
          squadAPlayers: squadAPlayers.map((p) => p.id),
          squadBPlayers: squadBPlayers.map((p) => p.id),
          teamId: gameDetails.game.team_id,
          userId: user.id,
          weight: gameWeight,
        }),
      });

      if (response.ok) {
        setAlert({
          message: "Game Edit and ELO recalculations done!",
          severity: "success",
        });
        if (gmId) {
          void router.reload();
        } else {
          void router.push(`/games/${gameDetails.game.id}`); // Redirect to game history page
        }
      } else {
        const errorData = await response.json();
        setAlert({
          message: errorData.error || "Failed to save changes.",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error saving changes:", err);
      setAlert({ message: "Failed to save changes.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (gameDetails) {
      setSquadAScore(gameDetails.game.squad_a_score);
      setSquadBScore(gameDetails.game.squad_b_score);
      setSquadAPlayers(gameDetails.squadA.players);
      setSquadBPlayers(gameDetails.squadB.players);
      setGameWeight(gameDetails.game.game_weight);
    }
  };

  const addPlayerToSquad = (squad: string, playerId: string) => {
    const playerFind = allTeamPlayers.find((p) => p.id === playerId);
    if (playerFind) {
      if (squad === gameDetails?.squadA.id && !squadAIDs.includes(playerId)) {
        setSquadAPlayers([...squadAPlayers, playerFind]);
      } else if (
        squad === gameDetails?.squadB.id &&
        !squadBIDs.includes(playerId)
      ) {
        setSquadBPlayers([...squadBPlayers, playerFind]);
      }
    }
  };

  const removePlayerFromSquad = (squad: string, playerId: string) => {
    if (squad === gameDetails?.squadA.id) {
      setSquadAPlayers(squadAPlayers.filter((p) => p.id !== playerId));
    } else if (squad === gameDetails?.squadB.id) {
      setSquadBPlayers(squadBPlayers.filter((p) => p.id !== playerId));
    }
  };

  useEffect(() => {
    const initialSquadAIDs = JSON.stringify(
      gameDetails?.squadA.players.map((p) => p.id)
    );
    const initialSquadBIDs = JSON.stringify(
      gameDetails?.squadB.players.map((p) => p.id)
    );
    const newSquadAIDs = JSON.stringify(squadAIDs);
    const newSquadBIDs = JSON.stringify(squadBIDs);
    const sameSquadAPlayers = initialSquadAIDs === newSquadAIDs;
    const sameSquadBPlayers = initialSquadBIDs === newSquadBIDs;
    const sameSquadAScore = gameDetails?.game.squad_a_score === squadAScore;
    const sameSquadBScore = gameDetails?.game.squad_b_score === squadBScore;
    const hasOverlap = overlappingPlayers.length > 0;
    const isSameWeight = gameDetails?.game.game_weight === gameWeight;

    if (
      (sameSquadAPlayers &&
        sameSquadBPlayers &&
        sameSquadAScore &&
        sameSquadBScore &&
        isSameWeight) ||
      loading ||
      hasOverlap
    ) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [
    loading,
    gameDetails,
    squadAIDs,
    squadBIDs,
    squadAScore,
    squadBScore,
    overlappingPlayers,
    gameWeight,
  ]);

  if (loading)
    return (
      <Typography fontWeight={"bold"} variant="body2">
        Loading game details...
      </Typography>
    );
  if (!gameDetails)
    return (
      <Typography fontWeight={"bold"} variant="body2">
        Game not found.
      </Typography>
    );

  return (
    <div className="w-full flex flex-col">
      <div className="w-full flex justify-between mb-4">
        <Typography fontWeight={"bold"} variant="h6">
          Edit Game
        </Typography>
        <div className="flex gap-2 items-center justify-center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={disabled}
            endIcon={<CheckIcon />}
            size="small"
          >
            {loading ? "Loading..." : "Save"}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={disabled}
            variant="outlined"
            size="small"
            color="secondary"
            endIcon={<UndoIcon />}
          >
            Undo
          </Button>
        </div>
      </div>
      <div className="w-full flex gap-2 mt-2">
        <TextField
          size="small"
          label={`${gameDetails.squadA.name} Score`}
          value={squadAScore}
          onChange={(e) => setSquadAScore(Number(e.target.value))}
          type="number"
        />
        <TextField
          size="small"
          label={`${gameDetails.squadB.name} Score`}
          value={squadBScore}
          onChange={(e) => setSquadBScore(Number(e.target.value))}
          type="number"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <EditGamePlayers
          squad={gameDetails.squadA}
          allPlayers={allTeamPlayers}
          removePlayerFromSquad={removePlayerFromSquad}
          addPlayerToSquad={addPlayerToSquad}
          squadPlayerIDs={squadAIDs}
          players={squadAPlayers}
          isSquadA={true}
          singleGame={singleGame}
        />
        <EditGamePlayers
          squad={gameDetails.squadB}
          allPlayers={allTeamPlayers}
          removePlayerFromSquad={removePlayerFromSquad}
          addPlayerToSquad={addPlayerToSquad}
          squadPlayerIDs={squadBIDs}
          players={squadBPlayers}
          isSquadA={false}
          singleGame={singleGame}
        />
      </div>
      <FormControl component="fieldset" sx={{ marginBottom: 2 }}>
        <div className="flex items-center">
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
          aria-label="game type button group"
          fullWidth
          sx={{ marginTop: 1 }}
        >
          <Button
            onClick={() => handleWeightChange("casual")}
            color={gameWeight === "casual" ? "secondary" : "inherit"}
            variant={gameWeight === "casual" ? "contained" : "text"}
            size="small"
            sx={{ fontWeight: "bold" }}
          >
            Casual
          </Button>
          <Button
            onClick={() => handleWeightChange("standard")}
            color={gameWeight === "standard" ? "secondary" : "inherit"}
            variant={gameWeight === "standard" ? "contained" : "text"}
            size="small"
            sx={{ fontWeight: "bold" }}
          >
            Standard
          </Button>
          <Button
            onClick={() => handleWeightChange("competitive")}
            color={gameWeight === "competitive" ? "secondary" : "inherit"}
            variant={gameWeight === "competitive" ? "contained" : "text"}
            size="small"
            sx={{ fontWeight: "bold" }}
          >
            Competitive
          </Button>
        </ButtonGroup>
      </FormControl>
      {/* Info Modal */}
      <GameWeightModal open={isInfoModalOpen} onClose={handleCloseInfoModal} />
      {overlappingPlayers.length > 0 && (
        <EditOverlappingPlayers
          squadA={gameDetails.squadA}
          squadB={gameDetails.squadB}
          squadAPlayers={squadAPlayers}
          squadBPlayers={squadBPlayers}
          setSquadAPlayers={setSquadAPlayers}
          setSquadBPlayers={setSquadBPlayers}
          setAlert={setAlert}
          overlappingPlayers={overlappingPlayers}
        />
      )}
      {alert.message && (
        <Alert severity={alert.severity} sx={{ marginTop: 2 }}>
          {alert.message}
        </Alert>
      )}
      <div className="flex gap-2 items-center mt-4">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={disabled}
          endIcon={<CheckIcon />}
          size="small"
        >
          {loading ? "Loading..." : "Save"}
        </Button>
        <Button
          onClick={handleCancel}
          disabled={disabled}
          variant="outlined"
          size="small"
          color="secondary"
          endIcon={<UndoIcon />}
        >
          Undo
        </Button>
      </div>
    </div>
  );
};

export default EditGameForm;
