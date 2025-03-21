import { supabase } from "@/lib/supabase";
import { Button } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type GamePlayersType = {
  player_id: string;
  squad_id: string;
  elo_before: number;
  elo_after: number;
  is_winner: boolean;
  players: {
    name: string;
  };
};

type GameDetailsType = {
  squad_a_score: number;
  squad_b_score: number;
  team_id: string;
  squadA: {
    active: boolean;
    id: string;
    name: string;
    team_id: string;
  };
  squadB: {
    active: boolean;
    id: string;
    name: string;
    team_id: string;
  };
};

const Game = () => {
  const router = useRouter();
  const gameId = router.query.gameId as string;
  const [gamePlayers, setGamePlayers] = useState<GamePlayersType[] | null>(
    null
  );
  const [gameDetails, setGameDetails] = useState<GameDetailsType | null>(null);

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!gameId) return;
      const { data: players, error: gameDetailsError } = await supabase
        .from("game_players")
        .select(
          `player_id, squad_id, elo_before, elo_after, is_winner, players (name)`
        )
        .eq("game_id", gameId);
      if (players) {
        setGamePlayers(players);
      }
      if (gameDetailsError)
        console.error("Failed to fetch game history:", gameDetailsError);

      const { data: gameInfo, error: gameError } = await supabase
        .from("games")
        .select(
          "squad_a_score, squad_b_score, team_id, squadA: squads!games_squad_a_id_fkey(*), squadB: squads!games_squad_b_id_fkey(*)"
        )
        .eq("id", gameId)
        .single();
      if (gameInfo) setGameDetails(gameInfo);

      if (gameError) console.error("Failed to fetch game info:", gameError);
    };
    fetchGameDetails();
  }, [gameId]);

  return (
    <div className="py-8 px-4">
      <Button
        variant="contained"
        color="secondary"
        size="small"
        sx={{ marginBottom: 2 }}
        onClick={() =>
          void router.push(
            `${gameDetails?.team_id ? `/team/${gameDetails.team_id}` : `/`}`
          )
        }
      >
        Back to Home
      </Button>
      {gameDetails && (
        <>
          <div className="flex justify-center items-center space-x-8 mb-8">
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold">
                {gameDetails.squadA.name}
              </h2>
              <span className="text-4xl font-bold text-orange-500">
                {gameDetails.squad_a_score}
              </span>
            </div>
            <span className="text-2xl font-semibold">VS</span>
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold">
                {gameDetails.squadB.name}
              </h2>
              <span className="text-4xl font-bold text-orange-500">
                {gameDetails.squad_b_score}
              </span>
            </div>
          </div>

          <div className="flex justify-between">
            {/* Squad A */}
            <div className="w-full max-w-xs">
              <h3 className="text-2xl font-semibold mb-4 text-center">
                {gameDetails.squadA.name || "Squad A"}
              </h3>
              <ul className="space-y-2">
                {gamePlayers
                  ?.filter(
                    (player) => player.squad_id === gameDetails.squadA.id
                  )
                  .map((player) => (
                    <li
                      key={player.player_id}
                      className="text-lg"
                      onClick={() =>
                        void router.push(`/player/${player.player_id}`)
                      }
                    >
                      <span className="font-medium">{player.players.name}</span>{" "}
                      - Elo:{" "}
                      <span className="font-bold">{player.elo_after}</span> (
                      {player.elo_after - player.elo_before > 0 ? "+" : ""}
                      {player.elo_after - player.elo_before})
                    </li>
                  ))}
              </ul>
            </div>
            {/* Squad B */}
            <div className="w-full max-w-xs">
              <h3 className="text-2xl font-semibold mb-4 text-center">
                {gameDetails?.squadB.name || "Squad B"}
              </h3>
              <ul className="space-y-2">
                {gamePlayers
                  ?.filter(
                    (player) => player.squad_id === gameDetails.squadB.id
                  )
                  .map((player) => (
                    <li
                      key={player.player_id}
                      className="text-lg"
                      onClick={() =>
                        void router.push(`/player/${player.player_id}`)
                      }
                    >
                      <span className="font-medium">{player.players.name}</span>{" "}
                      - Elo:{" "}
                      <span className="font-bold">{player.elo_after}</span> (
                      {player.elo_after - player.elo_before > 0 ? "+" : ""}
                      {player.elo_after - player.elo_before})
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Game;
