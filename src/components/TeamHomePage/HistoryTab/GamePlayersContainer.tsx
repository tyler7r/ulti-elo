import { supabase } from "@/lib/supabase";
import { AlertType, GameType, SquadType } from "@/lib/types";
import { Alert, Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import GamePlayers from "./GamePlayers";

type GamePlayersContainerType = {
  game: GameType;
  singleGame?: boolean;
};

export type GamePlayersType = {
  name: string;
  id: string;
  elo_before: number;
  elo_after: number;
  is_winner: boolean;
};

const GamePlayersContainer = ({
  game,
  singleGame,
}: GamePlayersContainerType) => {
  const [squadA, setSquadA] = useState<SquadType | null>(null);
  const [squadB, setSquadB] = useState<SquadType | null>(null);
  const [squadAPlayers, setSquadAPlayers] = useState<GamePlayersType[]>([]);
  const [squadBPlayers, setSquadBPlayers] = useState<GamePlayersType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });

  useEffect(() => {
    const fetchGameData = async () => {
      if (game.id) {
        setLoading(true);
        setAlert({ message: null, severity: "error" });
        try {
          // Fetch game details
          const { data: sqA, error: squadAError } = await supabase
            .from("squads")
            .select("*")
            .eq("id", game.squad_a_id)
            .single();

          if (squadAError) {
            setAlert({
              message: "Error fetching squad A",
              severity: "error",
            });
            setLoading(false);
            return;
          }

          const { data: sqB, error: squadBError } = await supabase
            .from("squads")
            .select("*")
            .eq("id", game.squad_b_id)
            .single();

          if (squadBError) {
            setAlert({ message: "Error fetching squad B", severity: "error" });
            setLoading(false);
            return;
          }

          const { data: SquadAGamePlayers, error: SquadAGamePlayersError } =
            await supabase
              .from("game_players")
              .select(
                "player_id, is_winner, elo_before, elo_after, players(name)"
              )
              .eq("game_id", game.id)
              .eq("squad_id", game.squad_a_id);
          if (SquadAGamePlayersError) {
            setLoading(false);
            setAlert({
              message: "Error fetching Squad A Players",
              severity: "error",
            });
            return;
          }

          const { data: SquadBGamePlayers, error: SquadBGamePlayersError } =
            await supabase
              .from("game_players")
              .select(
                "player_id, is_winner, elo_before, elo_after, players(name)"
              )
              .eq("game_id", game.id)
              .eq("squad_id", game.squad_b_id);

          if (SquadBGamePlayersError) {
            setLoading(false);
            setAlert({
              message: "Error fetching Squad B Players",
              severity: "error",
            });
            return;
          }

          const sqAPlayers = SquadAGamePlayers.map((p) => ({
            name: p.players.name,
            id: p.player_id,
            elo_before: p.elo_before,
            elo_after: p.elo_after,
            is_winner: p.is_winner,
          }));

          const sqBPlayers = SquadBGamePlayers.map((p) => ({
            name: p.players.name,
            id: p.player_id,
            elo_before: p.elo_before,
            elo_after: p.elo_after,
            is_winner: p.is_winner,
          }));

          setSquadA(sqA);
          setSquadB(sqB);
          setSquadAPlayers(sqAPlayers);
          setSquadBPlayers(sqBPlayers);
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
  }, [game]);

  if (loading)
    return (
      <Typography fontWeight={"bold"} variant="body2">
        Loading game details...
      </Typography>
    );

  if (alert.message) {
    return <Alert severity={alert.severity}>{alert.message}</Alert>;
  }

  return (
    squadA &&
    squadB && (
      <div className="flex flex-col md:flex-row md:gap-4 mt-2 w-full">
        <Box flex={1}>
          <GamePlayers
            squad={squadA}
            isSquadA={true}
            players={squadAPlayers}
            singleGame={singleGame}
          />
        </Box>
        <Box flex={1}>
          <GamePlayers
            squad={squadB}
            isSquadA={false}
            players={squadBPlayers}
            singleGame={singleGame}
          />
        </Box>
      </div>
    )
  );
};

export default GamePlayersContainer;
