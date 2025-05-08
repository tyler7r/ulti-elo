// components/common/FavoriteButton.tsx (Create this component)
import { useAuth } from "@/contexts/AuthContext"; // Adjust path
import { supabase } from "@/lib/supabase"; // Adjust path
import StarIcon from "@mui/icons-material/Star"; // Filled star
import StarOutlineIcon from "@mui/icons-material/StarOutline"; // Outline star
import { CircularProgress, IconButton, Tooltip } from "@mui/material";
import { useMemo, useState } from "react";

interface FavoriteButtonProps {
  itemId: string; // ID of the team or player
  itemType: "team" | "player";
  itemName: string; // Name for confirmation/tooltips
  onLoginRequired?: () => void; // Function to call when login is needed
  small?: boolean;
}

const FavoriteButton = ({
  itemId,
  itemType,
  itemName,
  onLoginRequired,
  small,
}: FavoriteButtonProps) => {
  const { user, userDetails, refreshFavorites, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine if the item is currently favorited based on context
  const isFavorited = useMemo(() => {
    if (!user || loading) return false; // Can't be favorited if not logged in or loading
    if (itemType === "team") {
      return userDetails.favorite_teams.some((fav) => fav.team.id === itemId);
    } else {
      // player
      return userDetails.favorite_players.some(
        (fav) => fav.player.id === itemId
      ); // Check player.id
    }
  }, [user, userDetails, itemType, itemId, loading]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      if (onLoginRequired) onLoginRequired(); // Trigger login warning modal
      return;
    }
    if (isProcessing) return; // Prevent double clicks

    setIsProcessing(true);
    const isCurrentlyFavorited = isFavorited; // Capture current state before async call
    const targetTable =
      itemType === "team" ? "favorite_teams" : "favorite_players";
    const targetColumn = itemType === "team" ? "team_id" : "player_id";

    try {
      if (isCurrentlyFavorited) {
        // --- Delete favorite ---
        const { error } = await supabase
          .from(targetTable)
          .delete()
          .eq("user_id", user.id)
          .eq(targetColumn, itemId);

        if (error) throw error;
        // console.log(`${itemType} unfavorited successfully`);
      } else {
        // --- Add favorite ---
        if (itemType === "team") {
          const { error: teamError } = await supabase
            .from("favorite_teams")
            .insert({
              user_id: user.id,
              team_id: itemId, // Use computed property name
            });
          if (teamError) throw teamError;
        } else {
          const { error: playerError } = await supabase
            .from("favorite_players")
            .insert({
              user_id: user.id,
              player_id: itemId,
            });
          if (playerError) throw playerError;
        }
      }
      // Refresh favorites list in context after successful operation
      await refreshFavorites();
    } catch (error) {
      console.error(`Error toggling favorite ${itemType}:`, error);
      // TODO: Show user feedback (e.g., toast notification)
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't render button until auth state is loaded
  if (loading && !user) return null;

  const tooltipTitle = isFavorited
    ? `Unfavorite ${itemName}`
    : `Favorite ${itemName}`;

  return (
    <Tooltip title={tooltipTitle} arrow>
      <span>
        <IconButton
          onClick={(e) => handleFavoriteToggle(e)}
          disabled={isProcessing || loading} // Disable while processing or initial load
          color={"secondary"} // Use secondary color for favorited
          size="small"
          aria-label={tooltipTitle}
        >
          {isProcessing ? (
            <CircularProgress size={20} color="inherit" />
          ) : isFavorited ? (
            <StarIcon fontSize={small ? "medium" : "large"} />
          ) : (
            <StarOutlineIcon fontSize={small ? "medium" : "large"} />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default FavoriteButton;
