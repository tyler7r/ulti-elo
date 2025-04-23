// /components/Sessions/CompletedGamesList.tsx
import { GameHistoryType } from "@/lib/types";
import { Box, Typography } from "@mui/material";
import Game from "../../../../GameHistory/Game";

type CompletedGamesListProps = {
  games: GameHistoryType[];
};

const CompletedGamesList = ({ games }: CompletedGamesListProps) => {
  return (
    <Box>
      <Typography variant="h6" fontWeight={"bold"} gutterBottom sx={{ px: 1 }}>
        Session Games ({games.length})
      </Typography>
      {games.length === 0 ? (
        <Typography
          sx={{ px: 2 }}
          fontStyle={"italic"}
          fontWeight={"bold"}
          color="secondary"
        >
          No games have been recorded for this session yet.
        </Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {games.map((game) => (
            <Game key={game.id} game={game} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CompletedGamesList;
