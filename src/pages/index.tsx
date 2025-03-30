import CreateTeam from "@/components/CreateTeam";
import Leaderboard from "@/components/Leaderboard";
import AddIcon from "@mui/icons-material/Add"; // PlusIcon
import { Box, Button, IconButton, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { TeamType } from "../lib/types";

export default function HomePage() {
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [openTeamModal, setOpenTeamModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) {
        console.error("Error fetching teams:", error);
        setError(error.message);
        setLoading(false);
      } else {
        setTeams(data);
        setLoading(false);
      }
    };
    fetchTeams();

    const channel = supabase
      .channel("team_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => {
          void fetchTeams();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleTeamPageRedirect = (teamId: string) => {
    void router.push(`/team/${teamId}`);
  };

  const openCreateTeamModal = () => {
    setOpenTeamModal(true);
  };

  const handleClose = () => {
    setOpenTeamModal(false);
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="mt-4">
      <Box className="mb-6 flex flex-col items-center gap-2 w-full">
        <div className="flex gap-1">
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            All Teams
          </Typography>
          <IconButton
            onClick={openCreateTeamModal}
            color="inherit"
            aria-controls="plus-menu"
            aria-haspopup="true"
            size="small"
          >
            <AddIcon />
          </IconButton>
        </div>
        {openTeamModal && (
          <CreateTeam onClose={handleClose} openTeamModal={openTeamModal} />
        )}
        {loading ? (
          <Typography>Loading teams...</Typography>
        ) : (
          <Box
            className="w-full items-center justify-center"
            display="flex"
            // gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))"
            flexWrap="wrap"
            gap={2}
          >
            {teams.map((team) => (
              <Button
                key={team.id}
                variant="contained"
                color="primary"
                onClick={() => handleTeamPageRedirect(team.id)}
              >
                {team.name}
              </Button>
            ))}
          </Box>
        )}
      </Box>
      <Leaderboard />
    </div>
  );
}
