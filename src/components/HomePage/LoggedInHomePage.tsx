// components/HomePage/LoggedInHomePage.tsx
import { useAuth } from "@/contexts/AuthContext"; // Adjust path
import { FavoritePlayerType, FavoriteTeamType } from "@/contexts/AuthProvider"; // Import types
import { supabase } from "@/lib/supabase"; // Import supabase for unfavorite action
import { PlayerType, SessionType, TeamType } from "@/lib/types"; // Import necessary types
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import EventIcon from "@mui/icons-material/Event"; // For activity feed session date
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import StarIcon from "@mui/icons-material/Star"; // Filled star (for unfavorite button)
import {
  alpha,
  Box, // Keep chip if needed elsewhere, remove if not
  CircularProgress,
  IconButton, // For loading states
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton, // Import IconButton
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { formatDistanceToNowStrict } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import NoLogoAvatar from "../Utils/NoLogoAvatar"; // Adjust path
import GlobalSearchAutocomplete from "./GlobalSearchAutocomplete"; // Adjust path

// --- Helper Types for Activity Feed Data ---
interface RecentSessionActivity extends SessionType {
  team: Pick<TeamType, "id" | "name" | "logo_url"> | null; // Include nested team info
}

interface RecentGameActivity {
  game: {
    match_date: string;
    session: { id: string; title: string; team_id: string } | null; // Included team_id
  } | null;
  // Nested structure reflecting the joins
  player_team: {
    // game_players -> player_teams
    player: Pick<PlayerType, "id" | "name">; // player_teams -> players
  } | null;
}

const LoggedInHomePage = () => {
  const {
    user,
    userDetails,
    loading: loadingAuth,
    refreshFavorites,
  } = useAuth(); // Get refreshFavorites
  const theme = useTheme();
  const router = useRouter();

  // State for activity feed
  const [recentSessions, setRecentSessions] = useState<RecentSessionActivity[]>(
    []
  );
  const [recentGames, setRecentGames] = useState<RecentGameActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [unfavoriteLoading, setUnfavoriteLoading] = useState<
    Record<string, boolean>
  >({}); // Track loading per item

  const handleNavigate = (path: string) => {
    void router.push(path);
  };

  // --- Fetch Recent Activity ---
  const fetchRecentActivity = useCallback(async () => {
    if (
      !user ||
      (userDetails.favorite_teams.length === 0 &&
        userDetails.favorite_players.length === 0)
    ) {
      setLoadingActivity(false);
      setRecentSessions([]);
      setRecentGames([]);
      return;
    }
    setLoadingActivity(true);

    try {
      const favTeamIds = userDetails.favorite_teams.map((ft) => ft.team.id);
      const favPlayerIds = userDetails.favorite_players.map(
        (fp) => fp.player.id
      );

      const [sessionsResult, gamesResult] = await Promise.all([
        // Fetch recent completed sessions for favorite teams
        favTeamIds.length > 0
          ? supabase
              .from("sessions")
              .select("*, team:teams!inner(id, name, logo_url)") // Fetch related team info
              .in("team_id", favTeamIds)
              .eq("active", false)
              .order("updated_at", { ascending: false }) // Order by completion time
              .limit(5)
          : Promise.resolve({ data: [], error: null }),

        // Fetch recent games for favorite players
        favPlayerIds.length > 0
          ? supabase
              .from("game_players")
              // Select game_players created_at, game's match_date, session title, player name
              .select(
                `
                      game:games!inner(
                          match_date,
                          session:sessions(id, title, team_id)
                      ),
                      player_team:player_teams!inner(player_id, player: players!inner(id, name))
                  `
              )
              .in("player_team.player_id", favPlayerIds)
              .order("game(match_date)", { ascending: false }) // Order by when player was added to game (approximates participation time)
              .limit(5)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (sessionsResult.error)
        console.error("Error fetching recent sessions:", sessionsResult.error);
      if (gamesResult.error)
        console.error("Error fetching recent games:", gamesResult.error);

      setRecentSessions((sessionsResult.data as RecentSessionActivity[]) ?? []);
      setRecentGames((gamesResult.data as RecentGameActivity[]) ?? []);
    } catch (err) {
      console.error("Unexpected error fetching activity:", err);
      setRecentSessions([]);
      setRecentGames([]);
    } finally {
      setLoadingActivity(false);
    }
  }, [user, userDetails.favorite_teams, userDetails.favorite_players]); // Dependencies

  useEffect(() => {
    // Fetch activity only when auth is loaded and favorites are available
    if (!loadingAuth && user) {
      fetchRecentActivity();
    }
  }, [loadingAuth, user, fetchRecentActivity]); // Rerun if auth state or fetch function changes

  // --- Handle Unfavorite ---
  const handleUnfavorite = async (
    e: React.MouseEvent,
    itemId: string,
    itemType: "team" | "player"
  ) => {
    e.stopPropagation(); // IMPORTANT: Prevent card navigation click
    if (!user) return; // Should not happen if button is visible, but safeguard

    const uniqueLoadingId = `${itemType}-${itemId}`;
    setUnfavoriteLoading((prev) => ({ ...prev, [uniqueLoadingId]: true }));

    const targetTable =
      itemType === "team" ? "favorite_teams" : "favorite_players";
    const targetColumn = itemType === "team" ? "team_id" : "player_id";

    try {
      const { error } = await supabase
        .from(targetTable)
        .delete()
        .eq("user_id", user.id)
        .eq(targetColumn, itemId);

      if (error) throw error;

      // Refresh favorites in context
      await refreshFavorites();
      // Optional: Show success feedback
    } catch (error) {
      console.error(`Error unfavoriting ${itemType}:`, error);
      // Optional: Show error feedback to user
    } finally {
      setUnfavoriteLoading((prev) => ({ ...prev, [uniqueLoadingId]: false }));
    }
  };

  // --- Render Helper for Favorite Lists (Now includes Unfavorite Button) ---
  const renderFavoriteList = (
    title: string,
    items: (FavoriteTeamType | FavoritePlayerType)[],
    type: "team" | "player",
    loading: boolean // Refers to initial loading of favorites from AuthContext
  ) => (
    <Box mb={2}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <StarIcon color="secondary" /> {/* Changed Icon */}
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      {loading ? ( // Use loadingAuth from useAuth
        <Box display="flex" gap={2} sx={{ overflowX: "auto", pb: 1 }}>
          {[...Array(3)].map((_, index /* Skeletons */) => (
            <Paper
              key={index}
              variant="outlined"
              sx={{ p: 1.5, minWidth: 200, borderRadius: "4px" }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box>
                  <Skeleton variant="text" width={100} height={20} />
                  <Skeleton variant="text" width={60} height={16} />
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : items.length > 0 ? (
        <Box
          display="flex"
          gap={2}
          sx={{ overflowX: "auto", pb: 1, scrollbarWidth: "thin" }}
        >
          {items.map((item, index) => {
            const isTeam = type === "team";
            const teamItem = item as FavoriteTeamType;
            const playerItem = item as FavoritePlayerType;
            // Use team/player ID directly from the nested object
            const itemId = isTeam ? teamItem.team.id : playerItem.player.id;
            const itemName = isTeam
              ? teamItem.team.name
              : playerItem.player.name;
            const logoUrl = isTeam ? teamItem.team.logo_url : undefined;
            const path = isTeam ? `/team/${itemId}` : `/player/${itemId}`;
            const itemLoadingId = `${type}-${itemId}`; // Unique ID for loading state

            return (
              <Paper
                key={itemId}
                variant="outlined"
                onClick={() => handleNavigate(path)} // Navigate on card click
                sx={{
                  p: 1.5,
                  minWidth: 200,
                  maxWidth: 350,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  cursor: "pointer",
                  flexShrink: 0,
                  position: "relative", // Needed for absolute positioning of button
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    boxShadow: `0 2px 8px ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                  },
                }}
              >
                {/* Item Avatar/Logo */}
                {isTeam ? (
                  logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`${itemName} Logo`}
                      width={35}
                      height={35}
                      className="rounded"
                    />
                  ) : (
                    <NoLogoAvatar
                      name={itemName}
                      size="small"
                      isColor={index % 2 === 0 ? "primary" : "secondary"}
                    />
                  )
                ) : (
                  // Using Person Icon for Player - replace with Avatar if available
                  <NoLogoAvatar
                    name={itemName}
                    size="small"
                    isColor={index % 2 === 0 ? "primary" : "secondary"}
                  />
                )}
                {/* Item Name */}
                <Box flexGrow={1} overflow="hidden">
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    noWrap
                    title={itemName}
                  >
                    {itemName}
                  </Typography>
                </Box>
                <Tooltip title={`Unfavorite ${itemName}`} placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => handleUnfavorite(e, itemId, type)}
                    disabled={unfavoriteLoading[itemLoadingId]}
                    aria-label={`Unfavorite ${itemName}`}
                  >
                    {unfavoriteLoading[itemLoadingId] ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <StarIcon color="secondary" /> // Filled star indicates favorited
                    )}
                  </IconButton>
                </Tooltip>
                {/* Navigation Arrow (optional aesthetic) */}
                <ArrowForwardIosIcon
                  fontSize="small"
                  sx={{ color: "text.disabled", ml: "auto" }}
                />
              </Paper>
            );
          })}
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontStyle: "italic" }}
        >
          No {type}s favorited yet. Use the ⭐ on team/player pages to add some!
        </Typography>
      )}
    </Box>
  );

  // --- Render Helper for Activity Item ---
  const renderActivityItem = (
    activity: RecentSessionActivity | RecentGameActivity,
    index: number
  ) => {
    const isSessionActivity = "team" in activity; // Check if it's a session

    if (isSessionActivity) {
      const session = activity as RecentSessionActivity;
      if (!session.team) return null; // Skip if team join failed
      return (
        <ListItem
          key={`session-${session.id}-${index}`}
          divider
          sx={{ py: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Tooltip title="Session Completed">
              <EventIcon color="action" fontSize="small" />
            </Tooltip>
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2">
                <Link
                  href={`/team/${session.team.id}`}
                  fontWeight="bold"
                  underline="hover"
                >
                  {session.team.name}{" "}
                </Link>
                completed session:{" "}
                <Link
                  href={`/team/${session.team.id}/sessions/${session.id}`}
                  fontWeight="bold"
                  underline="hover"
                >
                  {session.title || "Untitled"}
                </Link>
                .
              </Typography>
            }
            secondary={formatDistanceToNowStrict(new Date(session.updated_at), {
              addSuffix: true,
            })}
          />
        </ListItem>
      );
    } else {
      const game = activity as RecentGameActivity;
      if (!game.player_team || !game.game?.session) return null; // Skip if joins failed
      return (
        <ListItem
          key={`game-${game.player_team.player?.id}-${game.game.match_date}-${index}`}
          divider
          sx={{ py: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Tooltip title="Game Played">
              <SportsScoreIcon color="action" fontSize="small" />
            </Tooltip>
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2">
                <Link
                  href={`/player/${game.player_team.player.id}`}
                  fontWeight="bold"
                  underline="hover"
                >
                  {game.player_team.player.name}
                </Link>{" "}
                played a game during session:{" "}
                <Link
                  href={`/team/${game.game.session.team_id}/sessions/${game.game.session.id}`}
                  fontWeight="bold"
                  underline="hover"
                >
                  {game.game.session.title || "Untitled"}
                </Link>
                .
              </Typography>
            }
            // Using game_players created_at as approximation for "when played" in the feed
            secondary={formatDistanceToNowStrict(
              new Date(game.game.match_date),
              {
                addSuffix: true,
              }
            )}
          />
        </ListItem>
      );
    }
  };

  return (
    // Using Container for consistent padding and max-width
    <Box p={2} width={"100%"}>
      {/* 1. Welcome Message */}
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        fontWeight={"bold"}
        sx={{ mb: 3 }}
      >
        Welcome back{userDetails.name ? `, ${userDetails.name}` : ""}!
      </Typography>

      {/* 2. Favorite Teams Section */}
      {renderFavoriteList(
        "Favorite Teams",
        userDetails.favorite_teams,
        "team",
        loadingAuth
      )}

      {/* 3. Favorite Players Section */}
      {renderFavoriteList(
        "Favorite Players",
        userDetails.favorite_players,
        "player",
        loadingAuth
      )}

      {/* 4. Search Bar */}
      <Box sx={{ my: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Find Teams & Players
        </Typography>
        {/* Removed centered prop if it existed */}
        <GlobalSearchAutocomplete centered={false} />
      </Box>

      {/* 5. Activity Feed */}
      <Box sx={{ my: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Recent Activity (Favorites)
        </Typography>
        {loadingActivity ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : recentSessions.length === 0 && recentGames.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{ p: 3, textAlign: "center", borderRadius: "8px" }}
          >
            <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
              No recent activity found for your favorited teams or players.
            </Typography>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ borderRadius: "8px" }}>
            <List disablePadding>
              {/* Combine and sort activities? Or display separately? Let's display separately for now */}
              {recentSessions.map((activity, index) =>
                renderActivityItem(activity, index)
              )}
              {recentGames.map((activity, index) =>
                renderActivityItem(activity, index)
              )}
              {/* TODO: Consider combining and sorting by date if desired */}
            </List>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default LoggedInHomePage;
