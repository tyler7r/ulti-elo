import { GameHistoryType } from "@/lib/types";
import { Button } from "@mui/material";
import { useState } from "react";
import EloChange from "./EloChange";
// import EditSquadModal from "./EditSquadModal";

type GameProps = {
  game: GameHistoryType;
};

const Game = ({ game }: GameProps) => {
  const [expanded, setExpanded] = useState(false);
  const dateFormatted = new Date(game.match_date).toLocaleDateString();
  //   const [editing, setEditing] = useState(false);

  return (
    <div className="border p-4 rounded shadow-md">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold">
            {game.squadA.info.name} vs {game.squadB.info.name}
          </h3>
          <p className="text-sm">{dateFormatted}</p>
        </div>
        <div>
          <p className="font-bold">
            {game.squad_a_score} - {game.squad_b_score}
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button
          onClick={() => setExpanded(!expanded)}
          variant="text"
          size="small"
          color="primary"
        >
          {expanded ? "Hide" : "See More"}
        </Button>

        <Button
          //   onClick={() => setEditing(true)}
          //   className="text-yellow-500 hover:underline"
          variant="text"
          size="small"
          color="secondary"
        >
          Edit Squads
        </Button>
      </div>

      {expanded && (
        <div className="mt-4">
          <EloChange squad={game.squadA} />
          <EloChange squad={game.squadB} />
        </div>
      )}

      {/* {editing && (
        <EditSquadModal game={game} onClose={() => setEditing(false)} />
      )} */}
    </div>
  );
};

export default Game;
