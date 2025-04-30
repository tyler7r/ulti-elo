// /components/TeamSettings/PastSeasonsList.tsx (Example path)

import { getPastSeasons } from "@/lib/getPastSeasons"; // Adjust path - Import the NEW function
import { SeasonType } from "@/lib/types"; // Adjust path - Use Season type
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";

interface PastSeasonsListProps {
  teamId: string;
}

const PAGE_SIZE = 10; // Number of past seasons per page

const PastSeasonsList = ({ teamId }: PastSeasonsListProps) => {
  const [pastSeasons, setPastSeasons] = useState<SeasonType[]>([]); // State uses Season type
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const fetchPastSeasonsCallback = useCallback(
    async (pageNum: number) => {
      // Renamed for clarity
      if (!teamId) return;
      // Show loader only on initial load or when loading more
      if (pageNum === 1) setLoading(true);
      setError(null);

      // Use the new getPastSeasons function
      const {
        seasons,
        error: fetchError,
        totalCount,
      } = await getPastSeasons({
        teamId: teamId,
        page: pageNum,
        limit: PAGE_SIZE,
      });

      if (fetchError) {
        setError(
          typeof fetchError === "string" ? fetchError : fetchError.message
        );
        setHasMore(false);
      } else if (seasons) {
        // Update state with the fetched Season data
        setPastSeasons((prev) =>
          pageNum === 1 ? seasons : [...prev, ...seasons]
        );
        setPage(pageNum + 1);
        const currentTotal =
          pageNum === 1 ? seasons.length : pastSeasons.length + seasons.length;
        // Determine if more exist based on fetched count vs limit or totalCount
        setHasMore(
          seasons.length === PAGE_SIZE &&
            (totalCount ? currentTotal < totalCount : true)
        );
      } else {
        setHasMore(false); // No more seasons found
      }

      if (pageNum === 1) setLoading(false);
    },
    [teamId, pastSeasons.length]
  ); // Include pastSeasons.length dependency

  useEffect(() => {
    fetchPastSeasonsCallback(1); // Initial fetch
  }, [teamId, fetchPastSeasonsCallback]); // Fetch only when teamId changes (fetchPastSeasonsCallback is stable)

  if (loading && pastSeasons.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        {error}
      </Alert>
    );
  }

  if (pastSeasons.length === 0) {
    return (
      <Typography
        sx={{
          fontStyle: "italic",
          color: "text.secondary",
          textAlign: "center",
          p: 2,
        }}
      >
        No past seasons found.
      </Typography>
    );
  }

  return (
    <Box mt={1}>
      {pastSeasons.map((season) => (
        <Box key={season.id} sx={{ width: "100%" }}>
          <Paper
            key={season.id} // Add key here as it's the top element in the map
            elevation={1}
            // onClick={() => handleNavigateToSession(session.id)} // Added onClick handler
            sx={{
              p: 1.5,
              mb: 1.5, // Added margin bottom directly here
              border: `1px solid ${theme.palette.divider}`,
              cursor: "pointer",
              transition: "box-shadow 0.2s ease-in-out",
              "&:hover": {
                boxShadow: theme.shadows[3],
              },
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  Season {season.season_no}
                </Typography>
                {season.end_date && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={"bold"}
                    fontStyle={"italic"}
                  >
                    {format(new Date(season.created_at), "P")} -{" "}
                    {format(new Date(season.end_date), "P")}
                  </Typography>
                )}
              </Box>
              <ChevronRightIcon color="action" fontSize="small" />
            </Box>
          </Paper>
        </Box>
      ))}
      {hasMore && (
        <Box sx={{ textAlign: "center", p: 1 }}>
          {/* Pass correct function to onClick */}
          <Button
            onClick={() => fetchPastSeasonsCallback(page)}
            size="small"
            disabled={loading}
          >
            Load More
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PastSeasonsList;
