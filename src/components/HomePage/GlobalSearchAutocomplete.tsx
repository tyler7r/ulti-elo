// components/HomePage/GlobalSearchAutocomplete.tsx (Or adjust path)
import { supabase } from "@/lib/supabase"; // Adjust path
import { PlayerType, TeamType } from "@/lib/types"; // Adjust paths and ensure PlayerType exists
import GroupIcon from "@mui/icons-material/Group"; // Icon for Teams
import PersonIcon from "@mui/icons-material/Person"; // Icon for Players
import SearchIcon from "@mui/icons-material/Search";
import {
  Autocomplete,
  Box,
  CircularProgress,
  InputAdornment,
  ListItemIcon, // To add icons to results
  ListItemText,
  TextField,
} from "@mui/material";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useDebounce from "../Utils/useDebounce";

// Define a unified search result type
interface SearchResultOption {
  id: string;
  label: string; // Name of team or player
  type: "team" | "player";
  // You can include the original object if needed for navigation/display
  data: TeamType | PlayerType;
}

type GlobalSearchAutocompleteProps = {
  centered: boolean;
};

const GlobalSearchAutocomplete = ({
  centered,
}: GlobalSearchAutocompleteProps) => {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<readonly SearchResultOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(inputValue, 300);
  const router = useRouter();

  const MIN_CHARS = 2; // Define the minimum characters needed

  const fetchResults = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setOptions([]); // Clear previous options immediately

    try {
      // Fetch Teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, logo_url") // Select needed fields
        .ilike("name", `%${searchTerm}%`) // Case-insensitive search
        .limit(5); // Limit results

      // Fetch Players
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("id, name") // Select needed fields
        .ilike("name", `%${searchTerm}%`) // Case-insensitive search
        .limit(5); // Limit results

      if (teamsError || playersError) {
        console.error("Search Error:", teamsError || playersError);
        setOptions([]); // Clear options on error
      } else {
        const teamOptions: SearchResultOption[] = (teamsData || []).map(
          (team) => ({
            id: `team-${team.id}`, // Unique ID for option key
            label: team.name,
            type: "team",
            data: team as TeamType, // Cast needed if select isn't exhaustive
          })
        );

        const playerOptions: SearchResultOption[] = (playersData || []).map(
          (player) => ({
            id: `player-${player.id}`, // Unique ID for option key
            label: player.name,
            type: "player",
            data: player as PlayerType, // Cast needed if select isn't exhaustive
          })
        );

        setOptions([...teamOptions, ...playerOptions]);
      }
    } catch (err) {
      console.error("Unexpected Search Error:", err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies other than supabase client (implicit)

  // 1. Refactor useEffect to only run search when input length is >= MIN_CHARS
  useEffect(() => {
    if (debouncedSearchTerm.length >= MIN_CHARS) {
      fetchResults(debouncedSearchTerm);
    } else {
      // Clear results and stop loading if input is too short
      setOptions([]);
      setLoading(false);
    }
  }, [debouncedSearchTerm, fetchResults]);

  const handleOptionSelected = (
    _event: React.SyntheticEvent,
    value: SearchResultOption | string | null
  ) => {
    if (typeof value === "object" && value !== null) {
      if (value.type === "team") {
        void router.push(`/team/${value.data.id}`);
      } else if (value.type === "player") {
        // Assuming PlayerType has an 'id' field from the players table
        void router.push(`/player/${(value.data as PlayerType).id}`);
      }
    }
  };

  const memoizedOptions = useMemo(() => options, [options]);

  // Determine the custom message based on input length
  const customNoOptionsText =
    inputValue.length < MIN_CHARS
      ? `Start typing at least ${MIN_CHARS} characters to search for teams or players.`
      : "No results found.";

  return (
    <Autocomplete
      id="global-search-autocomplete"
      sx={{
        width: "100%",
        maxWidth: "700px",
        mx: centered ? "auto" : 0,
      }}
      options={memoizedOptions}
      loading={loading}
      // 2. Add the custom placeholder text when no options are shown
      noOptionsText={customNoOptionsText}
      // Key for React list rendering - uses the unique ID we created
      getOptionKey={(option) => option.id}
      // How to get the text label for each option
      getOptionLabel={(option) => option.label}
      // Prevent MUI's default filtering, we fetch filtered results
      filterOptions={(x) => x}
      // Handle input changes
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      // Handle selection
      onChange={handleOptionSelected}
      // Custom rendering for each option in the dropdown
      renderOption={(htmlProps, option) => {
        const { key, ...restHtmlProps } = htmlProps;
        return (
          <Box component="li" {...restHtmlProps} key={key}>
            <ListItemIcon sx={{ minWidth: "32px" }}>
              {option.type === "team" ? (
                <GroupIcon fontSize="small" />
              ) : (
                <PersonIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={option.label}
              secondary={
                option.type.charAt(0).toUpperCase() + option.type.slice(1)
              } // Capitalize type
            />
          </Box>
        );
      }}
      // How the input field itself looks
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Find Teams or Players..."
          variant="outlined"
          slotProps={{
            input: {
              ref: params.InputProps.ref,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { borderRadius: "8px" },
              endAdornment: (
                <>
                  {/* Show loading spinner */}
                  {loading ? (
                    <CircularProgress
                      color="inherit"
                      size={20}
                      sx={{ mr: 1 }}
                    />
                  ) : null}
                  {/* Include the default end adornment from Autocomplete (clear/popup buttons) */}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
};

export default GlobalSearchAutocomplete;
