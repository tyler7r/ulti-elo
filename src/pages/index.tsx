import CreatePlayer from "@/components/CreatePlayer";
import { Button, CircularProgress } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { TeamType } from "../lib/types";

export default function HomePage() {
  const [teams, setTeams] = useState<TeamType[]>([]);
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
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <CreatePlayer />
      <h1>Teams</h1>
      <div>
        {teams.map((team) => (
          <Button
            key={team.id}
            variant="contained"
            onClick={() => router.push(`/team/${team.id}`)}
          >
            {team.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
