// pages/players.tsx (Updated with Search and Infinite Scroll)
import BrowseItemCard from "@/components/Utils/BrowseItemCard";
import useDebounce from "@/components/Utils/useDebounce";
import { supabase } from "@/lib/supabase";
import { PlayerType } from "@/lib/types";
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

const BROWSE_PAGE_SIZE = 24; // Number of players per page

const BrowsePlayersPage = () => {
  const [players, setPlayers] = useState<PlayerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const router = useRouter();
  //   const theme = useTheme();

  const fetchPlayers = useCallback(
    async (
      page: number,
      currentSearchTerm: string,
      resetList: boolean = false
    ) => {
      if (!resetList) setLoading(true); // Or use a separate loadingMore state
      setError(null);

      const offset = (page - 1) * BROWSE_PAGE_SIZE;

      try {
        let query = supabase
          .from("players")
          .select("id, name", { count: "exact" }) // Select only needed fields
          .order("name", { ascending: true });

        if (currentSearchTerm) {
          query = query.ilike("name", `%${currentSearchTerm}%`);
        }

        query = query.range(offset, offset + BROWSE_PAGE_SIZE - 1);

        const { data, error: fetchError, count } = await query;

        if (fetchError) throw fetchError;

        const fetchedPlayers = (data as PlayerType[]) ?? [];
        setPlayers((prev) =>
          resetList ? fetchedPlayers : [...prev, ...fetchedPlayers]
        );
        // setTotalCount(count ?? 0);
        setHasMore(
          fetchedPlayers.length > 0 &&
            offset + fetchedPlayers.length < (count ?? 0)
        );
        setCurrentPage(page);
      } catch (err) {
        console.error("Error fetching players:", err);
        setError("Failed to load players. Please try again.");
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    []
  ); // No dependencies needed

  // Effect for initial load and search term changes
  useEffect(() => {
    setLoading(true);
    setPlayers([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchPlayers(1, debouncedSearchTerm, true);
  }, [debouncedSearchTerm, fetchPlayers]);

  const handleNavigate = (playerId: string) => {
    void router.push(`/player/${playerId}`);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const loadMorePlayers = () => {
    if (!loading && hasMore) {
      fetchPlayers(currentPage + 1, debouncedSearchTerm);
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
          Browse Players
        </Typography>
      </Box>

      {/* Search Input */}
      <Box p={2} width={"100%"}>
        <Box sx={{ display: "flex" }}>
          <TextField
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search players by name..."
            variant="outlined"
            size="small"
            sx={{ maxWidth: "500px", width: "100%" }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    {" "}
                    <SearchIcon />{" "}
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
        {loading && players.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            {" "}
            <CircularProgress />{" "}
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : !loading && players.length === 0 ? (
          <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
            No players found{" "}
            {debouncedSearchTerm ? `matching "${debouncedSearchTerm}"` : ""}.
          </Typography>
        ) : (
          // Infinite Scroll Container
          <InfiniteScroll
            dataLength={players.length}
            next={loadMorePlayers}
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
                — You&rsquo;ve seen all players —
              </Typography>
            }
            style={{ overflow: "visible" }}
          >
            {/* Grid for Responsive Card Layout */}
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: {
                  xs: "repeat(1, 1fr)",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
                mt: 2,
              }}
            >
              {players.map((player, index) => (
                // Remove Grid item wrapper
                <BrowseItemCard
                  key={player.id} // Key directly on the mapped component
                  item={player}
                  type="player"
                  onClick={() => handleNavigate(player.id)}
                  isColor={index % 2 === 0 ? "primary" : "secondary"}
                />
              ))}
            </Box>
          </InfiniteScroll>
        )}
      </Box>
    </Box>
  );
};

export default BrowsePlayersPage;
