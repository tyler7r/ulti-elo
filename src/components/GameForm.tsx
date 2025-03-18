import { supabase } from "@/lib/supabase";
import { GameType } from "@/lib/types";
import { submitGame } from "@/pages/api/submitGame";
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type GameFormType = {
  teamId: string;
};

type PlayerSelectType = {
  player_id: string;
  elo: number;
  players: {
    id: string;
    loss_streak: number;
    name: string;
    win_streak: number;
  };
};

const GameForm = ({ teamId }: GameFormType) => {
  const [players, setPlayers] = useState<PlayerSelectType[]>([]);
  const [squadA, setSquadA] = useState<PlayerSelectType[]>([]);
  const [squadB, setSquadB] = useState<PlayerSelectType[]>([]);
  const [formData, setFormData] = useState<GameType>({
    id: "",
    team_id: teamId,
    match_date: new Date().toDateString(),
    squad_a_score: 0,
    squad_b_score: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from("player_teams")
        .select("player_id, elo, players(*)")
        .eq("team_id", teamId);
      if (error) {
        console.error("Error fetching players:", error);
        return [];
      } else {
        setPlayers(data);
      }
    };
    fetchPlayers();
  }, [teamId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("score") ? parseInt(value) || 0 : value,
    }));
  };

  const handlePlayerSelect = (
    newPlayers: PlayerSelectType[],
    squad: "A" | "B"
  ) => {
    setFormData((prev) => {
      const updatedFormData = { ...prev };
      if (squad === "A") {
        setSquadA(newPlayers);
        // Remove selected players from Squad B
        setSquadB(
          squadB.filter(
            (player) =>
              !newPlayers.some((p) => p.player_id === player.player_id)
          )
        );
      } else {
        setSquadB(newPlayers);
        // Remove selected players from Squad A
        setSquadA(
          squadA.filter(
            (player) =>
              !newPlayers.some((p) => p.player_id === player.player_id)
          )
        );
      }
      return updatedFormData;
    });
  };

  const determineWinner = () => {
    if (formData.squad_a_score > formData.squad_b_score)
      return squadA.map((player) => player.player_id);
    if (formData.squad_b_score > formData.squad_a_score)
      return squadB.map((player) => player.player_id);
    return []; // No winner in case of a tie
  };

  const updateWinLossStreaks = async (playerId: string, isWinner: boolean) => {
    const { data: playerData, error } = await supabase
      .from("player_teams")
      .select("elo, players(win_streak, loss_streak)")
      .eq("player_id", playerId)
      .single();
    if (error) {
      console.log("Error fetching player Elo:", error);
      return;
    }

    let newWinStreak = playerData.players.win_streak;
    let newLossStreak = playerData.players.loss_streak;

    if (isWinner) {
      newWinStreak += 1;
      newLossStreak = 0; // Reset loss streak
    } else {
      newLossStreak += 1;
      newWinStreak = 0; // Reset win streak
    }

    const { error: updateError } = await supabase
      .from("players")
      .update({ win_streak: newWinStreak, loss_streak: newLossStreak })
      .eq("id", playerId);

    if (updateError) {
      console.error("Error updating streak:", updateError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const winnerIds = determineWinner();

    for (const player of squadA.concat(squadB)) {
      const isWinner = winnerIds.includes(player.player_id);
      await updateWinLossStreaks(player.player_id, isWinner);
    }

    const squadAIDs = squadA.map((player) => player.player_id);
    const squadBIDs = squadB.map((player) => player.player_id);
    const scoreA = formData.squad_a_score;
    const scoreB = formData.squad_b_score;
    const success = await submitGame({
      teamId,
      squadAIDs,
      squadBIDs,
      scoreA,
      scoreB,
    });
    if (success) {
      void router.push(`/games/${success}`);
    } else {
      alert("Error submitting game.");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 600, mx: "auto", p: 2 }}
    >
      <Typography variant="h5" mb={2}>
        Create a New Game
      </Typography>

      <div className="flex flex-col gap-4">
        {/* Squad A Player Selection */}
        <div>
          <FormControl fullWidth>
            <Autocomplete
              multiple
              options={players.filter(
                (player) =>
                  !squadA.some((p) => p.player_id === player.player_id) &&
                  !squadB.some((p) => p.player_id === player.player_id)
              )}
              getOptionLabel={(option) => `${option.players.name}`} // Display only name
              value={squadA}
              onChange={(_, newValue) => handlePlayerSelect(newValue, "A")}
              isOptionEqualToValue={(option, value) =>
                option.player_id === value.player_id
              }
              renderOption={(props, option) => (
                <li {...props} key={option.player_id}>
                  {option.players.name} (ELO: {option.elo})
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Players for Squad A"
                  placeholder="Choose players"
                />
              )}
            />
          </FormControl>
        </div>

        {/* Squad B Player Selection */}
        <div>
          <FormControl fullWidth>
            <Autocomplete
              multiple
              options={players.filter(
                (player) =>
                  !squadA.some((p) => p.player_id === player.player_id) &&
                  !squadB.some((p) => p.player_id === player.player_id)
              )}
              getOptionLabel={(option) => `${option.players.name}`} // Display only name
              value={squadB}
              onChange={(_, newValue) => handlePlayerSelect(newValue, "B")}
              isOptionEqualToValue={(option, value) =>
                option.player_id === value.player_id
              }
              renderOption={(props, option) => (
                <li {...props} key={option.player_id}>
                  {option.players.name} (ELO: {option.elo})
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Players for Squad B"
                  placeholder="Choose players"
                />
              )}
            />
          </FormControl>
        </div>
      </div>

      {/* Scores */}
      <div className="flex w-full gap-2">
        <TextField
          fullWidth
          margin="normal"
          label="Squad A Score"
          type="number"
          name="squad_a_score"
          onChange={handleInputChange}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Squad B Score"
          type="number"
          name="squad_b_score"
          onChange={handleInputChange}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
      >
        Save Game
      </Button>
    </Box>
  );
};

export default GameForm;
