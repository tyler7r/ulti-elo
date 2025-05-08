// pages/teams.tsx (Updated with Search and Infinite Scroll)
import BrowseItemCard from "@/components/Utils/BrowseItemCard";
import useDebounce from "@/components/Utils/useDebounce";
import { supabase } from "@/lib/supabase";
import { TeamType } from "@/lib/types";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search"; // Added SearchIcon
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton, // Added TextField
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component"; // Added InfiniteScroll

const BROWSE_PAGE_SIZE = 24;

const BrowseTeamsPage = () => {
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  //   const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search term

  const router = useRouter();
  //   const theme = useTheme();

  const fetchTeams = useCallback(
    async (
      page: number,
      currentSearchTerm: string,
      resetList: boolean = false
    ) => {
      if (!resetList) setLoading(true); // Show loader only when loading more, initial load handled separately
      setError(null);

      const offset = (page - 1) * BROWSE_PAGE_SIZE;

      try {
        let query = supabase
          .from("teams")
          .select("id, name, logo_url", { count: "exact" })
          .order("name", { ascending: true });

        // Apply search filter if term exists
        if (currentSearchTerm) {
          query = query.ilike("name", `%${currentSearchTerm}%`);
        }

        query = query.range(offset, offset + BROWSE_PAGE_SIZE - 1);

        const { data, error: fetchError, count } = await query;

        if (fetchError) throw fetchError;

        const fetchedTeams = (data as TeamType[]) ?? [];

        setTeams((prev) =>
          resetList ? fetchedTeams : [...prev, ...fetchedTeams]
        );
        // setTotalCount(count ?? 0);
        setHasMore(
          fetchedTeams.length > 0 && offset + fetchedTeams.length < (count ?? 0)
        );
        setCurrentPage(page);
      } catch (err) {
        console.error("Error fetching teams:", err);
        setError("Failed to load teams. Please try again.");
        setHasMore(false);
      } finally {
        setLoading(false); // Turn off initial load indicator regardless
      }
    },
    []
  ); // No dependencies needed if it only uses args and static values

  // Effect for initial load and search term changes
  useEffect(() => {
    setLoading(true); // Set loading true when search term changes
    setTeams([]); // Reset teams immediately
    setCurrentPage(1); // Reset page to 1
    setHasMore(true); // Assume there might be more initially
    fetchTeams(1, debouncedSearchTerm, true); // Fetch page 1 with reset flag
  }, [debouncedSearchTerm, fetchTeams]); // Rerun when debounced term changes

  const handleNavigate = (teamId: string) => {
    void router.push(`/team/${teamId}`);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const loadMoreTeams = () => {
    if (!loading && hasMore) {
      fetchTeams(currentPage + 1, debouncedSearchTerm);
    }
  };

  return (
    <Box>
      <Box px={2} mt={1} width={"100%"}>
        <Button
          onClick={() => router.push(`/search`)}
          size="small"
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Browse Teams
        </Typography>
      </Box>

      {/* Search Input */}
      <Box width={"100%"} p={2}>
        <Box sx={{ display: "flex" }}>
          <TextField
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search teams by name..."
            variant="outlined"
            size="small"
            sx={{ maxWidth: "500px", width: "100%" }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: { borderRadius: "8px" },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        {/* Loading/Error/Empty States */}
        {loading && teams.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : !loading && teams.length === 0 ? (
          <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
            No teams found{" "}
            {debouncedSearchTerm ? `matching "${debouncedSearchTerm}"` : ""}.
          </Typography>
        ) : (
          // Infinite Scroll Container
          <InfiniteScroll
            dataLength={teams.length}
            next={loadMoreTeams}
            hasMore={hasMore}
            loader={
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={30} />
              </Box>
            }
            endMessage={
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  textAlign: "center",
                  color: "text.disabled",
                  my: 3,
                }}
              >
                — You&rsquo;ve seen all teams —
              </Typography>
            }
            style={{ overflow: "visible" }} // Prevent scrollbar issues on main component
          >
            {/* Grid for Responsive Card Layout */}
            <Box
              sx={{
                display: "grid",
                gap: 1, // Spacing between items
                // Responsive columns based on common breakpoints
                gridTemplateColumns: {
                  xs: "repeat(1, 1fr)", // 1 column
                  sm: "repeat(2, 1fr)", // 2 columns
                  md: "repeat(3, 1fr)", // 3 columns
                  lg: "repeat(4, 1fr)", // 4 columns
                },
                mt: 2, // Margin top for spacing from search/loader
              }}
            >
              {teams.map((team) => (
                // Remove Grid item wrapper
                <BrowseItemCard
                  key={team.id} // Key directly on the mapped component
                  item={team}
                  type="team"
                  onClick={() => handleNavigate(team.id)}
                />
              ))}
            </Box>
          </InfiniteScroll>
        )}
      </Box>
    </Box>
  );
};

export default BrowseTeamsPage;
