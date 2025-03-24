import { getGameHistory } from "@/lib/getGameHistory";
import { GameHistoryType } from "@/lib/types";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import { Fab, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Game from "./Game";

type GameHistoryProps = {
  teamId?: string;
  squadId?: string;
  playerId?: string;
  gameId?: string;
};

const PAGE_SIZE = 4;

const GameHistory = ({
  teamId,
  squadId,
  playerId,
  gameId,
}: GameHistoryProps) => {
  const [games, setGames] = useState<GameHistoryType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  //   const fetchingInitial = useRef(false); // Track if initial fetch is done

  // ✅ Memoized fetch function to prevent infinite re-renders
  const fetchGames = useCallback(
    async (newPage: number) => {
      setLoading(true);

      try {
        const newGames = await getGameHistory({
          teamId,
          squadId,
          playerId,
          gameId,
          page: newPage,
          limit: PAGE_SIZE,
        });

        if (newGames.length === 0) {
          setHasMore(false);
        } else {
          setGames((prev) =>
            newPage === 1 ? newGames : [...prev, ...newGames]
          );
          setPage(newPage + 1);
        }
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    },
    [teamId, squadId, playerId, gameId]
  );

  // ✅ Initial data fetch with a flag to prevent multiple triggers during development
  useEffect(() => {
    fetchGames(1); // Fetch the first page of games
  }, [fetchGames]); // Fetch once when component mounts

  // ✅ Scroll-to-top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && games.length === 0) return <p>Loading...</p>;
  if (games.length === 0) return <p>No games found.</p>;

  return (
    <div className="p-4 w-full flex flex-col">
      <Typography variant="h6" fontWeight={"bold"}>
        Game History
      </Typography>

      {/* ✅ Infinite Scroll Component */}
      <InfiniteScroll
        dataLength={games.length} // Length of the current list of games
        next={() => fetchGames(page)} // Function to fetch more data
        hasMore={hasMore} // Whether more data is available
        loader={
          <div className="flex justify-center items-center mt-2 font-bold text-sm">
            <KeyboardDoubleArrowDownIcon fontSize="small" color="secondary" />
            <div>Scroll for more games</div>
            <KeyboardDoubleArrowDownIcon fontSize="small" color="secondary" />
          </div>
        } // Loader that appears while fetching
        endMessage={
          <p className="flex justify-center items-center mt-2 font-bold text-sm">
            No more games
          </p>
        } // Message when no more data is available
        scrollThreshold={0.9} // When to trigger loading more data (90% scroll)
      >
        <div className="grid gap-4">
          {games.map((game) => (
            <Game key={game.id} game={game} />
          ))}
        </div>
      </InfiniteScroll>

      {/* ✅ Scroll-to-Top Button */}
      <Fab
        color="primary"
        onClick={scrollToTop}
        size="small"
        sx={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 1000,
        }}
        aria-label="Scroll to top"
      >
        <ArrowUpwardIcon />
      </Fab>
    </div>
  );
};

export default GameHistory;
