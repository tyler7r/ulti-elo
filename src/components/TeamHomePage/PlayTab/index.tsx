import { supabase } from "@/lib/supabase";
import { PlayerTeamType, TeamType } from "@/lib/types";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  useTheme,
} from "@mui/material";
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
  players: PlayerTeamType[]; // Array of players in the squad
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

  const theme = useTheme();

  const fetchActiveSquads = async (teamId: string) => {
    const { data: newSquads, error: newSquadsError } = await supabase
      .from("squads")
      .select(
        "id, name, squad_players(pt_id, active, player_teams(*, player: players(name)))"
      )
      .eq("team_id", teamId)
      .eq("active", true)
      .eq("squad_players.active", true);
    if (newSquadsError) throw newSquadsError;

    const formattedSquads = newSquads.map((squad) => ({
      id: squad.id,
      name: squad.name,
      score: 0,
      players: squad.squad_players.map((sp) => ({
        ...sp.player_teams,
      })),
    }));

    setActiveSquads(formattedSquads);
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
            gap={1}
          >
            {activeSquads.map((squad) => (
              <Card
                key={squad.id}
                sx={{
                  width: "300px", // Adjust width as needed
                  marginBottom: 2,
                  borderBottom: `1px solid ${theme.palette.divider}`, // Divider border
                  borderRadius: "4px",
                  overflow: "hidden",
                  backgroundColor: theme.palette.background.paper, // Transparent background
                  display: "flex", // Make card a flex container
                  flexDirection: "column", // Stack content vertically
                }}
              >
                <CardContent
                  sx={{
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between", // Space out top and bottom content
                    height: "100%", // Ensure full height for proper button placement
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      gutterBottom
                      sx={{ fontSize: "1.2rem" }}
                    >
                      {squad.name}
                    </Typography>
                    {squad.players.length > 0 ? (
                      squad.players.map((p) => (
                        <Typography
                          key={p.pt_id}
                          variant="body2"
                          sx={{ fontSize: "0.9rem", wordBreak: "break-word" }}
                        >
                          {p.player.name} (ELO: {p.elo})
                        </Typography>
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No players in this squad.
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 2,
                      alignSelf: "flex-end",
                    }}
                  >
                    <Button
                      variant="text"
                      color="primary"
                      onClick={(e) => handleEditSquad(e, squad.id)}
                      size="small"
                      startIcon={<EditIcon />}
                      sx={{ fontWeight: "bold" }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="text"
                      color="error"
                      onClick={(e) => handleRetireSquad(e, squad.id)}
                      size="small"
                      startIcon={<DeleteIcon />}
                      sx={{ fontWeight: "bold" }}
                    >
                      Retire
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
        {openNewGameModal && (
          <GameForm
            teamId={team.id}
            onClose={handleClose}
            openNewGameModal={openNewGameModal}
            updateSquads={handleSquadsUpdate}
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
