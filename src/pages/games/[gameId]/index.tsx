import SingleGameView from "@/components/TeamHomePage/HistoryTab/SingleGame";
import { getGameHistory } from "@/lib/getGameHistory";
import { GameHistoryType } from "@/lib/types";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const PostGame = () => {
  const router = useRouter();
  const gameId = router.query.gameId as string;
  const [game, setGame] = useState<GameHistoryType | null>(null);

  useEffect(() => {
    const fetchGame = async (gId: string) => {
      const gm = await getGameHistory({ gameId: gId });
      if (gm.history) {
        const games = gm.history;
        setGame(games[0]);
      }
    };
    if (gameId) fetchGame(gameId);
  }, [gameId]);

  return game && <SingleGameView game={game} />;
};

export default PostGame;
