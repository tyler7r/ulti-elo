import { supabase } from "@/lib/supabase";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type GameDetailsType = {
  player_id: string;
  squad: string;
  elo_before: number;
  elo_after: number;
  is_winner: boolean;
  players: {
    name: string;
  };
};

type GameScoreType = {
  squad_a_score: number;
  squad_b_score: number;
};

const Game = () => {
  const router = useRouter();
  const gameId = router.query.gameId as string;
  const [gameDetails, setGameDetails] = useState<GameDetailsType[] | null>(
    null
  );
  const [gameScore, setGameScore] = useState<GameScoreType | null>(null);

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!gameId) return;
      const { data: gameDets, error: gameDetailsError } = await supabase
        .from("game_players")
        .select(
          `player_id, squad, elo_before, elo_after, is_winner, players (name)`
        )
        .eq("game_id", gameId);
      if (gameDets) {
        setGameDetails(gameDets);
        console.log(gameDets);
      }
      if (gameDetailsError)
        console.error("Failed to fetch game history:", gameDetailsError);

      const { data: gameInfo, error: gameError } = await supabase
        .from("games")
        .select("squad_a_score, squad_b_score")
        .eq("id", gameId)
        .single();
      if (gameInfo) setGameScore(gameInfo);

      if (gameError) console.error("Failed to fetch game info:", gameError);
    };
    fetchGameDetails();
  }, [gameId]);

  return (
    <div className="py-8 px-4">
      {gameScore && (
        <div className="flex justify-center items-center space-x-8 mb-8">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold">Squad A</h2>
            <span className="text-4xl font-bold text-orange-500">
              {gameScore.squad_a_score}
            </span>
          </div>
          <span className="text-2xl font-semibold">VS</span>
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold">Squad B</h2>
            <span className="text-4xl font-bold text-orange-500">
              {gameScore.squad_b_score}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        {/* Squad A */}
        <div className="w-full max-w-xs">
          <h3 className="text-2xl font-semibold mb-4 text-center">Squad A</h3>
          <ul className="space-y-2">
            {gameDetails
              ?.filter((player) => player.squad === "A")
              .map((player) => (
                <li
                  key={player.player_id}
                  className="text-lg"
                  onClick={() =>
                    void router.push(`/player/${player.player_id}`)
                  }
                >
                  <span className="font-medium">{player.players.name}</span> -
                  Elo: <span className="font-bold">{player.elo_after}</span> (
                  {player.elo_after - player.elo_before > 0 ? "+" : ""}
                  {player.elo_after - player.elo_before})
                </li>
              ))}
          </ul>
        </div>

        {/* Squad B */}
        <div className="w-full max-w-xs">
          <h3 className="text-2xl font-semibold mb-4 text-center">Squad B</h3>
          <ul className="space-y-2">
            {gameDetails
              ?.filter((player) => player.squad === "B")
              .map((player) => (
                <li
                  key={player.player_id}
                  className="text-lg"
                  onClick={() =>
                    void router.push(`/player/${player.player_id}`)
                  }
                >
                  <span className="font-medium">{player.players.name}</span> -
                  Elo: <span className="font-bold">{player.elo_after}</span> (
                  {player.elo_after - player.elo_before > 0 ? "+" : ""}
                  {player.elo_after - player.elo_before})
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Game;
