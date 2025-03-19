import CreateSquad from "@/components/CreateSquad";
import EditSquad from "@/components/EditSquad";
import GameForm from "@/components/GameForm";
import Leaderboard from "@/components/Leaderboard";
import RetireSquad from "@/components/RetireSquad";
import { supabase } from "@/lib/supabase";
import { PlayerType, TeamType } from "@/lib/types";
import { Box, Button, Tab, Tabs, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface SquadType {
  id: string;
  name: string;
  players: PlayerType[]; // Array of players in the squad
}

const TeamHomePage = () => {
  const [activeTab, setActiveTab] = useState(0); // For Tabs
  const [team, setTeam] = useState<TeamType | null>(null);
  const [activeSquads, setActiveSquads] = useState<SquadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSquadModal, setOpenSquadModal] = useState(false);
  const [squadEditId, setSquadEditId] = useState<string | null>(null);
  const [openEditSquadModal, setOpenEditSquadModal] = useState(false);
  const [openRetireSquadModal, setRetireSquadModal] = useState(false);
  const [openNewGameModal, setOpenNewGameModal] = useState(false);
  const router = useRouter();
  const teamId = router.query.teamId as string;

  const fetchTeam = async (teamId: string) => {
    const { data, error } = await supabase
      .from("teams")
      .select()
      .eq("id", teamId)
      .single();
    if (error) console.error("Error fetching team:", error.message);

    setTeam(data);
  };

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
      .eq("active", true) // Only fetch active players
      .eq("squads.team_id", teamId) // Ensure we're filtering by the correct team
      .eq("squads.active", true); // Only active squads

    if (error) {
      throw error;
    }

    // Organize the data to structure squads with their associated players
    console.log(data);
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

  useEffect(() => {
    if (teamId) {
      void fetchTeam(teamId);
      void fetchActiveSquads(teamId);
    }
  }, [teamId]);

  const handleSquadsUpdate = () => {
    if (teamId) void fetchActiveSquads(teamId);
    setOpenEditSquadModal(false);
    setSquadEditId(null);
    setOpenSquadModal(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    setActiveTab(newValue);
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
  };

  const handleEditSquad = (squadId: string) => {
    setSquadEditId(squadId);
    setOpenEditSquadModal(true);
  };

  const handleRetireSquad = (squadId: string) => {
    setSquadEditId(squadId);
    setRetireSquadModal(true);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="team tabs"
        variant="fullWidth"
        centered
      >
        <Tab label="Play" />
        <Tab label="Leaderboard" />
        <Tab label="History" />
      </Tabs>

      <Box sx={{ padding: 3 }}>
        {activeTab === 0 && (
          <Box display="flex" flexDirection="column" gap={4}>
            <Box
              display="flex"
              flexDirection="column"
              gap={2}
              alignItems="center"
            >
              {team && (
                <Typography textAlign="center" variant="h3" fontWeight="bold">
                  {team.name}
                </Typography>
              )}
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
                          onClick={() => handleEditSquad(squad.id)}
                          size="small"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleRetireSquad(squad.id)}
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
                  teamId={teamId}
                  onClose={handleClose}
                  openNewGameModal={openNewGameModal}
                />
              )}
              {/* CreateSquad Modal */}
              {openSquadModal && (
                <CreateSquad
                  teamId={teamId}
                  onClose={handleClose}
                  openSquadModal={openSquadModal}
                  updateSquads={handleSquadsUpdate}
                />
              )}
              {openEditSquadModal && squadEditId && (
                <EditSquad
                  squadId={squadEditId}
                  teamId={teamId}
                  onClose={handleClose}
                  openEditSquadModal={openEditSquadModal}
                  updateSquads={handleSquadsUpdate}
                />
              )}
              {openRetireSquadModal && squadEditId && (
                <RetireSquad
                  squadId={squadEditId}
                  teamId={teamId}
                  onClose={handleClose}
                  openRetireSquadModal={openRetireSquadModal}
                  updateSquads={handleSquadsUpdate}
                />
              )}
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Leaderboard teamId={teamId} />
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="h6">Game History</Typography>
            <div>Feature Coming Soon...</div>
            {/* Add Game History Component Here */}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TeamHomePage;
