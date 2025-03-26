import { supabase } from "@/lib/supabase";
import { PlayerType, TeamType } from "@/lib/types";
import { Box, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import CreateSquad from "./CreateSquad";
import EditSquad from "./EditSquad";
import GameForm from "./GameForm";
import RetireSquad from "./RetireSquad";

type PlayTabType = {
  team: TeamType;
};

interface SquadType {
  id: string;
  name: string;
  players: PlayerType[]; // Array of players in the squad
}

const PlayTab = ({ team }: PlayTabType) => {
  const [activeSquads, setActiveSquads] = useState<SquadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSquadModal, setOpenSquadModal] = useState(false);
  const [squadEditId, setSquadEditId] = useState<string | null>(null);
  const [squadRetireId, setSquadRetireId] = useState<string | null>(null);
  const [openEditSquadModal, setOpenEditSquadModal] = useState(false);
  const [openRetireSquadModal, setRetireSquadModal] = useState(false);
  const [openNewGameModal, setOpenNewGameModal] = useState(false);

  const fetchActiveSquads = async (teamId: string) => {
    // Fetch active squads and associated players from the squads_players table
    const { data, error } = await supabase
      .from("squad_players") // Join through the squads_players table
      .select(
        `
        squads: squads!inner(
          id,
          name,
          active,
          team_id
        ),
        players: players!inner(
          *
        )
      `
      )
      .eq("squads.team_id", teamId) // Ensure we're filtering by the correct team
      .eq("squads.active", true) // Only active squads
      .eq("active", true);

    if (error) {
      throw error;
    }

    // Organize the data to structure squads with their associated players
    const squads = data.reduce<SquadType[]>((acc, row) => {
      const { id, name } = row.squads;
      const player = row.players;

      // Add the player to the correct squad
      const squadIndex = acc.findIndex((squad) => squad.id === id);
      if (squadIndex > -1) {
        acc[squadIndex].players.push(player);
      } else {
        acc.push({
          id,
          name,
          players: [player],
        });
      }
      return acc;
    }, []);

    setActiveSquads(squads);
    setLoading(false);
  };

  const handleSquadsUpdate = () => {
    if (team.id) void fetchActiveSquads(team.id);
    setOpenEditSquadModal(false);
    setSquadEditId(null);
    setOpenSquadModal(false);
    setRetireSquadModal(false);
    setSquadRetireId(null);
  };

  const handleCreateSquad = () => {
    setOpenSquadModal(true);
  };

  const handleNewGame = () => {
    setOpenNewGameModal(true);
  };

  const handleClose = () => {
    setOpenSquadModal(false);
    setOpenEditSquadModal(false);
    setOpenNewGameModal(false);
    setSquadEditId(null);
    setSquadRetireId(null);
  };

  const handleEditSquad = (
    e: React.MouseEvent<HTMLButtonElement>,
    squadId: string
  ) => {
    e.stopPropagation();
    setSquadEditId(squadId);
    setSquadRetireId(null);
    setOpenEditSquadModal(true);
  };

  const handleRetireSquad = (
    e: React.MouseEvent<HTMLButtonElement>,
    squadId: string
  ) => {
    e.stopPropagation();
    setSquadRetireId(squadId);
    setSquadEditId(null);
    setRetireSquadModal(true);
  };

  useEffect(() => {
    fetchActiveSquads(team.id);
  }, [team.id]);

  return (
    <Box display="flex" flexDirection="column" gap={4} paddingY={2}>
      <Box display="flex" flexDirection="column" gap={2} alignItems="center">
        <Button
          color="secondary"
          variant="contained"
          disabled={activeSquads.length < 2}
          size="large"
          onClick={handleNewGame}
        >
          Play New Game
        </Button>
        {activeSquads.length < 2 && (
          <Box textAlign="center">
            <Typography color="error">
              You need at least 2 squads to play a game!
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        width="full"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="h5" sx={{ fontWeight: "bold" }} gutterBottom>
          Active Squads
        </Typography>
        <Button
          variant="contained"
          onClick={handleCreateSquad}
          sx={{ marginBottom: 2 }}
          size="small"
        >
          Create New Squad
        </Button>
        {loading ? (
          <Typography>Loading squads...</Typography>
        ) : (
          <Box
            display="flex"
            width="full"
            alignItems="center"
            flexWrap="wrap"
            justifyContent="center"
            gap={4}
          >
            {activeSquads.map((squad) => (
              <Box
                key={squad.id}
                sx={{ marginBottom: 2 }}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
              >
                <Typography variant="h6" fontWeight="bold">
                  {squad.name}
                </Typography>
                {squad.players.length > 0 &&
                  squad.players.map((p) => (
                    <div key={p.id}>
                      {p.name} (ELO: {p.elo})
                    </div>
                  ))}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outlined"
                    onClick={(e) => handleEditSquad(e, squad.id)}
                    size="small"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={(e) => handleRetireSquad(e, squad.id)}
                    size="small"
                  >
                    Retire
                  </Button>
                </div>
              </Box>
            ))}
          </Box>
        )}
        {openNewGameModal && (
          <GameForm
            teamId={team.id}
            onClose={handleClose}
            openNewGameModal={openNewGameModal}
          />
        )}
        {/* CreateSquad Modal */}
        {openSquadModal && (
          <CreateSquad
            teamId={team.id}
            onClose={handleClose}
            openSquadModal={openSquadModal}
            updateSquads={handleSquadsUpdate}
          />
        )}
        {openEditSquadModal && squadEditId && (
          <EditSquad
            squadId={squadEditId}
            teamId={team.id}
            onClose={handleClose}
            openEditSquadModal={openEditSquadModal}
            updateSquads={handleSquadsUpdate}
          />
        )}
        {openRetireSquadModal && squadRetireId && (
          <RetireSquad
            squadId={squadRetireId}
            teamId={team.id}
            onClose={handleClose}
            openRetireSquadModal={openRetireSquadModal}
            updateSquads={handleSquadsUpdate}
          />
        )}
      </Box>
    </Box>
  );
};

export default PlayTab;
