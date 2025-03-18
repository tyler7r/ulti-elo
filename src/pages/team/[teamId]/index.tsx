import GameForm from "@/components/GameForm";
import { supabase } from "@/lib/supabase";
import { PlayerEloType, TeamType } from "@/lib/types";
import { Button, CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamType>();
  const [players, setPlayers] = useState<PlayerEloType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();
  const teamId = router.query.teamId as string;

  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!teamId) return;
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamId)
        .single();

      if (teamError) {
        console.error("Error fetching team:", teamError);
        setError("Failed to load team.");
        setLoading(false);
        return;
      }

      setTeam(teamData);

      // Fetch players with Elo from player_teams table
      const { data: playerTeamsData, error: playerTeamsError } = await supabase
        .from("player_teams")
        .select("players(id, name), elo")
        .eq("team_id", teamId);

      if (playerTeamsError) {
        console.error("Error fetching players:", playerTeamsError);
        setError("Failed to load players.");
      } else {
        // Map the player_teams data to include player info with Elo
        const playerDetails = playerTeamsData.map((item) => ({
          id: item.players.id,
          name: item.players.name,
          elo: item.elo,
        }));
        setPlayers(playerDetails);
      }

      setLoading(false);
    };

    fetchTeamDetails();
  }, [teamId]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-lg max-w-lg">
      <h1 className="text-2xl font-bold mb-4">{team?.name}</h1>
      <GameForm teamId={teamId} />

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Players</h2>
        {players.length === 0 ? (
          <p>No players in this team</p>
        ) : (
          <ul>
            {players.map((player) => (
              <li key={player.id} className="mb-2">
                {player.name} (ELO: {player.elo})
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        variant="contained"
        color="primary"
        onClick={() => void router.push("/")}
      >
        Back to Home
      </Button>
    </div>
  );
}
