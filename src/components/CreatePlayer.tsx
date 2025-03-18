import { supabase } from "@/lib/supabase";
import { Autocomplete, Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";

const CreatePlayer = () => {
  const [name, setName] = useState("");
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<
    { id: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTeams, setFetchingTeams] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<boolean>(false);

  // Fetch teams from Supabase
  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) console.error("Error fetching teams:", error);
      else setTeams(data);
      setFetchingTeams(false);
    };
    fetchTeams();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Insert new player
    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert([{ name }])
      .select()
      .single();

    if (playerError) {
      setError("Error creating player.");
      console.error(playerError);
      setLoading(false);
      return;
    }

    // Insert player-team relationships if teams were selected
    if (selectedTeams.length > 0) {
      const playerTeams = selectedTeams.map((team) => ({
        player_id: player.id,
        team_id: team.id,
      }));

      const { error: playerTeamsError } = await supabase
        .from("player_teams")
        .insert(playerTeams);

      if (playerTeamsError) {
        setError("Error assigning teams.");
        console.error(playerTeamsError);
        setLoading(false);
        return;
      }
    }

    setName("");
    setSelectedTeams([]);
    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg max-w-md">
      <h2 className="text-xl font-bold mb-2">Create New Player</h2>

      {error && <p className="text-red-500">{error}</p>}
      {success && (
        <p className="text-green-600">Player created successfully!</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 flex flex-col gap-2">
        {/* Player Name Input */}
        <TextField
          fullWidth
          label="Player Name"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Multi-Select Dropdown for Teams */}
        <Autocomplete
          multiple
          options={teams}
          getOptionLabel={(option) => option.name}
          value={selectedTeams}
          onChange={(_, newValue) => setSelectedTeams(newValue)}
          loading={fetchingTeams}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Teams"
              placeholder="Choose teams"
            />
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Player"}
        </Button>
      </form>
    </div>
  );
};

export default CreatePlayer;
