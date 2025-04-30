import { getGameHistory } from "@/lib/getGameHistory";
import { GameHistoryType } from "@/lib/types";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import { Box, Fab, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Game from "./Game";

type GameHistoryProps = {
  teamId?: string;
  squadId?: string;
  playerTeamIds?: string[];
  gameId?: string;
  playerId?: string;
  sessionId?: string;
};

const PAGE_SIZE = 5;

const GameHistory = ({
  teamId,
  squadId,
  playerTeamIds,
  gameId,
  playerId,
  sessionId,
}: GameHistoryProps) => {
  const [games, setGames] = useState<GameHistoryType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  // ✅ Memoized fetch function to prevent infinite re-renders
  const fetchGames = useCallback(
    async (newPage: number) => {
      setLoading(true);

      try {
        const newGames = await getGameHistory({
          teamId,
          squadId,
          playerTeamIds,
          gameId,
          page: newPage,
          limit: PAGE_SIZE,
          sessionId: sessionId,
        });

        if (newGames.history) {
          if (newGames.history.length === 0) {
            setHasMore(false);
          } else {
            const newGs = newGames.history;
            setGames((prev) => (newPage === 1 ? newGs : [...prev, ...newGs]));
            setPage(newPage + 1);
            if (newGames.history.length < PAGE_SIZE) {
              setHasMore(false);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    },
    [teamId, squadId, playerTeamIds, gameId, sessionId]
  );

  // ✅ Initial data fetch with a flag to prevent multiple triggers during development
  useEffect(() => {
    fetchGames(1); // Fetch the first page of games
  }, [fetchGames]); // Fetch once when component mounts

  // ✅ Scroll-to-top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && games.length === 0)
    return <p className="font-bold text-lg p-4">Loading...</p>;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        padding: 2,
        width: "100%",
      }}
    >
      <Typography variant="h5" fontWeight={"bold"} marginBottom={2}>
        Game History
      </Typography>
      {games.length === 0 ? (
        <p className="font-bold px-2">No games found.</p>
      ) : (
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
          <Box display={"flex"} flexDirection={"column"} gap={2} px={1}>
            {games.map((game) => (
              <Game key={game.id} game={game} playerId={playerId} />
            ))}
          </Box>
        </InfiniteScroll>
      )}
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
    </Box>
  );
};

export default GameHistory;
