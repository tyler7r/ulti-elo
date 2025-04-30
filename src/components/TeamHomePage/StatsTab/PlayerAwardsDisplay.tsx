import { PlayerAwardTypeWithJoin } from "@/lib/types"; // Adjust path
import { JSX } from "@emotion/react/jsx-runtime";
// Removed JSX import as it's usually implicit
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StarIcon from "@mui/icons-material/Star";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import {
  alpha,
  Box,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  useTheme, // Keep useTheme as it's needed for direct color resolution later
} from "@mui/material";
import { useRouter } from "next/router"; // Use next/router for Pages Router
import { Fragment, useMemo, useState } from "react";

interface SeasonAwardsDisplayProps {
  awards: PlayerAwardTypeWithJoin[];
  seasonNumber: number;
}

// Award type constants for clarity
const AwardTypes = {
  ELO_1ST: "highest_elo_1st",
  ELO_2ND: "highest_elo_2nd",
  ELO_3RD: "highest_elo_3rd",
  MOST_WINS: "most_wins",
  LONGEST_STREAK: "longest_win_streak",
} as const;

type AwardType = (typeof AwardTypes)[keyof typeof AwardTypes];

// Helper to get icon/color/title based on award type
// Reverted: No longer accepts theme
export const getAwardDetails = (awardType: AwardType) => {
  switch (awardType) {
    case AwardTypes.ELO_1ST:
      return {
        icon: (
          <StarIcon
            // Adjusted sizes slightly for better small screen fit
            sx={{ color: "#FFD700", fontSize: { xs: "1.8rem", sm: "2.5rem" } }}
          />
        ),
        title: "1st Place",
        color: "#FFD700", // Hex code for gold
        podiumOrder: 1, // For flex order: 2nd, 1st, 3rd
        heightFactor: 1.15, // Tallest
      };
    case AwardTypes.ELO_2ND:
      return {
        icon: (
          <StarIcon
            sx={{ color: "#C0C0C0", fontSize: { xs: "1.6rem", sm: "2.2rem" } }}
          />
        ),
        title: "2nd Place",
        color: "#C0C0C0", // Hex code for silver
        podiumOrder: 0,
        heightFactor: 1.0, // Medium height
      };
    case AwardTypes.ELO_3RD:
      return {
        icon: (
          <StarIcon
            sx={{ color: "#cd7f32", fontSize: { xs: "1.5rem", sm: "2.0rem" } }} // Bronze icon slightly smaller
          />
        ),
        title: "3rd Place",
        color: "#cd7f32", // Hex code for bronze
        podiumOrder: 2,
        heightFactor: 0.9, // Shortest height (relative to silver)
      };
    case AwardTypes.MOST_WINS:
      return {
        icon: <EmojiEventsIcon color="primary" sx={{ fontSize: "1.5rem" }} />,
        title: "Most Wins",
        color: "primary.main", // Keep theme key, resolved later
        heightFactor: 0, // Not applicable
      };
    case AwardTypes.LONGEST_STREAK:
      return {
        icon: <WhatshotIcon color="error" sx={{ fontSize: "1.5rem" }} />,
        title: "Longest Win Streak",
        color: "error.main", // Keep theme key, resolved later
        heightFactor: 0, // Not applicable
      };
  }
  // Add a fallback return type to satisfy TypeScript if needed,
  // though ideally all AwardTypes are covered.
  // This might require adjusting the AwardDetail type definition or handling unknowns.
};

// Define the expected return type of getAwardDetails for clarity
// Removed importance, added heightFactor
type AwardDetail = {
  icon: JSX.Element;
  title: string;
  color: string; // Can be hex or theme key initially
  podiumOrder?: number;
  heightFactor: number;
};

// Group awards by type for display
type GroupedAwards = {
  [key in AwardType]?: PlayerAwardTypeWithJoin[];
};

const SeasonAwardsDisplay = ({
  awards,
  seasonNumber,
}: SeasonAwardsDisplayProps) => {
  const theme = useTheme(); // Get theme object for resolving colors later
  const router = useRouter();
  const [openAwardDetails, setOpenAwardDetails] = useState<
    Record<string, boolean>
  >({});

  // Group awards by type
  const groupedAwards = useMemo((): GroupedAwards => {
    return awards.reduce((acc, award) => {
      const type = award.award_type as AwardType; // Cast to known types
      // Only include known award types
      if (Object.values(AwardTypes).includes(type)) {
        if (!acc[type]) {
          acc[type] = [];
        }
        // Ensure player name exists for sorting/display
        if (award.player?.name) {
          acc[type]!.push(award);
        }
      }
      return acc;
    }, {} as GroupedAwards);
  }, [awards]);

  const handlePlayerClick = (playerId: string | undefined | null) => {
    if (playerId) router.push(`/player/${playerId}`);
  };

  // Toggle collapse for a specific award type (only for Wins/Streak)
  const toggleAwardDetails = (awardType: AwardType) => {
    if (
      awardType === AwardTypes.MOST_WINS ||
      awardType === AwardTypes.LONGEST_STREAK
    ) {
      setOpenAwardDetails((prev) => ({
        ...prev,
        [awardType]: !prev[awardType],
      }));
    }
  };

  // Filter out awards we don't have data for
  const availableAwardTypes = Object.values(AwardTypes).filter(
    (type) => groupedAwards[type] && groupedAwards[type]!.length > 0
  );

  // Get details directly now, no pre-calculation needed
  const eloAwards = availableAwardTypes
    .filter(
      (type) =>
        type === AwardTypes.ELO_1ST ||
        type === AwardTypes.ELO_2ND ||
        type === AwardTypes.ELO_3RD
    )
    .map((type) => ({ type, details: getAwardDetails(type) as AwardDetail })) // Get details directly
    .sort((a, b) => a.details.podiumOrder! - b.details.podiumOrder!); // Sort 2nd, 1st, 3rd

  const otherAwards = availableAwardTypes
    .filter(
      (type) =>
        type === AwardTypes.MOST_WINS || type === AwardTypes.LONGEST_STREAK
    )
    .map((type) => ({ type, details: getAwardDetails(type) as AwardDetail })); // Get details directly

  if (availableAwardTypes.length === 0) {
    return null; // Don't render if no relevant awards
  }

  // --- Helper Component for Player Name Display ---
  const PlayerNameDisplay = ({
    player,
    variant = "body2",
    sx = {}, // Allow passing sx for custom styles like font size
  }: {
    player: PlayerAwardTypeWithJoin["player"];
    variant?: "body1" | "body2" | "caption" | "subtitle1" | "subtitle2";
    sx?: object;
  }) => (
    <Typography
      variant={variant}
      fontWeight="bold"
      sx={{
        cursor: player?.id ? "pointer" : "default",
        "&:hover": {
          textDecoration: player?.id ? "underline" : "none",
        },
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        width: "100%",
        textAlign: "center",
        ...sx, // Merge custom styles
        // overflowWrap: "break-word",
      }}
      onClick={(e) => {
        e.stopPropagation(); // Prevent card click if name is clicked
        handlePlayerClick(player?.id);
      }}
      title={player?.id ? `View ${player.name}'s profile` : undefined}
      // noWrap
    >
      {player?.name ?? "Unknown"}
    </Typography>
  );

  // --- Helper Component for Award Value Display ---
  const AwardValueDisplay = ({
    award,
    details,
  }: {
    award: PlayerAwardTypeWithJoin;
    details: AwardDetail;
  }) => {
    if (!award.award_value) return null;

    let valueText = `${award.award_value}`;
    if (details.title === "Most Wins") valueText += " Wins";
    else if (details.title === "Longest Win Streak") valueText += " Wins";
    else return null; // Only show value for Wins/Streak

    return (
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight="500"
        alignSelf={"center"}
      >
        ({valueText})
      </Typography>
    );
  };

  // --- Helper Component for ELO Value Display ---
  const EloValueDisplay = ({ award }: { award: PlayerAwardTypeWithJoin }) => {
    if (!award?.award_value) return null;
    return (
      <Typography
        variant="caption"
        fontWeight="500"
        color="text.secondary"
        sx={{ mt: 0.5 }}
      >
        {award.award_value} ELO
      </Typography>
    );
  };

  return (
    <Box sx={{ width: "100%", mb: 3 }}>
      {/* Section Title */}
      <Box display="flex" justifyContent="center" alignItems="center" mb={3}>
        <EmojiEventsIcon color="warning" sx={{ mx: 1 }} />
        <Typography variant="h5" fontWeight="bold" align="center">
          Season {seasonNumber} Awards
        </Typography>
        <EmojiEventsIcon color="warning" sx={{ mx: 1 }} />
      </Box>

      {/* ELO Podium Section */}
      {eloAwards.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end", // Align bottoms for podium effect
            gap: { xs: 0.5, sm: 1.5 }, // Reduced gap slightly for small screens
            mb: 4, // Increased margin below podium
            flexWrap: "nowrap",
            width: "100%", // Ensure container takes full width
            // Add horizontal padding if needed, or rely on card widths
            px: { xs: 0.5, sm: 1 },
          }}
        >
          {eloAwards.map(({ type, details }) => {
            const awardsOfType = groupedAwards[type]!; // We know it exists
            const isTie = awardsOfType.length > 1;
            const baseHeight = 140; // Base height in pixels for podium steps

            // Color is already hex from getAwardDetails for ELO
            const cardColor = details.color;

            return (
              <Paper
                key={type}
                elevation={type === AwardTypes.ELO_1ST ? 6 : 3} // More shadow for 1st
                sx={{
                  p: { xs: 1, sm: 1.5 }, // Reduced padding slightly
                  borderRadius: "8px",
                  border: `2px solid ${alpha(cardColor, 0.7)}`,
                  bgcolor: alpha(cardColor, 0.08),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  // --- Width adjustments for nowrap ---
                  // Use flex-basis to suggest initial size, allow shrinking/growing
                  flexBasis: { xs: "32%", sm: "160px" }, // Share space on xs, fixed on sm+
                  flexShrink: 1,
                  flexGrow: { xs: 1, sm: 0 }, // Allow grow on xs to fill space
                  minWidth: { xs: "85px", sm: "130px" }, // Prevent shrinking too much
                  // --- Height adjustment ---
                  minHeight: `${baseHeight * details.heightFactor}px`, // Use heightFactor
                  height: "100%", // Try to maintain consistent height within flex alignment
                  justifyContent: "center", // Center content vertically
                  mt: type === AwardTypes.ELO_1ST ? { xs: -1, sm: -2 } : 0,
                  order: details.podiumOrder, // Use flex order defined in details
                }}
              >
                <Box mb={0.5}>{details.icon}</Box> {/* Reduced margin */}
                <Typography
                  // Adjust font size for smaller screens
                  variant={type === AwardTypes.ELO_1ST ? "h6" : "subtitle1"}
                  fontSize={
                    type === AwardTypes.ELO_1ST
                      ? { xs: "1rem", sm: "1.25rem" }
                      : { xs: "0.875rem", sm: "1rem" }
                  }
                  fontWeight="bold"
                  color={cardColor}
                  // gutterBottom removed for tighter spacing
                >
                  {details.title}
                </Typography>
                {/* ELO Score Display */}
                <EloValueDisplay award={awardsOfType[0]} />
                {/* Player Name(s) */}
                <Box sx={{ width: "100%", px: 0.5 }}>
                  {" "}
                  {/* Added container for width/padding */}
                  {awardsOfType.map((award, index) => (
                    <Fragment key={award.id}>
                      <PlayerNameDisplay
                        player={award.player}
                        sx={{
                          fontSize: {
                            xs:
                              award.award_type === "highest_elo_1st"
                                ? "0.85rem"
                                : "0.75rem",
                          },
                        }} // Responsive font size override
                      />
                      {isTie && index < awardsOfType.length - 1 && (
                        <Typography
                          variant={
                            type === AwardTypes.ELO_1ST ? "body2" : "caption"
                          }
                          component="span"
                          fontWeight="bold"
                          sx={{
                            fontSize: {
                              xs: "0.7rem",
                              sm:
                                type === AwardTypes.ELO_1ST
                                  ? "0.875rem"
                                  : "0.75rem",
                            },
                          }}
                        >
                          {" & "}
                        </Typography>
                      )}
                    </Fragment>
                  ))}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Other Awards Section (Wins/Streak) */}
      {otherAwards.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 1, // Gap between wins/streak cards
            px: { xs: 1, sm: 0 }, // Add horizontal padding on mobile
          }}
        >
          {otherAwards.map(({ type, details }) => {
            const awardsOfType = groupedAwards[type]!;
            const isTie = awardsOfType.length > 1;
            const isOpen = !!openAwardDetails[type];

            // Resolve theme color keys here using theme object
            const cardColor =
              type === "longest_win_streak"
                ? theme.palette.error.main
                : theme.palette.primary.main;

            return (
              <Paper
                key={type}
                variant="outlined" // Use outlined for less emphasis
                sx={{
                  p: 1.5,
                  borderRadius: "8px", // Slightly larger radius
                  display: "flex",
                  flexDirection: "column",
                  // --- Width: Full width on xs, fixed/max on sm+ ---
                  width: { xs: "100%", sm: "400px" }, // Takes full width on mobile
                  maxWidth: "100%", // Ensure it doesn't overflow container
                  // Use resolved cardColor directly with alpha
                  borderColor: alpha(cardColor, 0.6), // Slightly stronger border
                  borderWidth: "2px",
                }}
              >
                {/* Card Header */}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  width="100%"
                  sx={{ minHeight: "36px" }} // Ensure consistent header height
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    flexWrap="nowrap"
                    overflow="hidden"
                  >
                    {/* Icon is already colored via color prop */}
                    {details.icon}
                    <Typography variant="body1" fontWeight="bold" noWrap>
                      {details.title}
                    </Typography>
                    <AwardValueDisplay
                      award={awardsOfType[0]}
                      details={details}
                    />
                  </Box>
                  {isTie && (
                    <IconButton
                      size="small"
                      onClick={() => toggleAwardDetails(type)}
                      aria-label={isOpen ? "Hide winners" : "Show winners"}
                      sx={{ ml: 1 }} // Add margin to prevent overlap
                    >
                      {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  )}
                </Box>

                {/* Winner Display */}
                {!isTie && (
                  <Box mt={1}>
                    <PlayerNameDisplay
                      player={awardsOfType[0].player}
                      variant="body2"
                    />
                  </Box>
                )}

                {/* Display "X players tied" if tie and not expanded */}
                {isTie && !isOpen && (
                  <Typography variant="caption" color="text.secondary">
                    {awardsOfType.length} Players Tied
                  </Typography>
                )}

                {/* Collapsible List for Ties */}
                {isTie && (
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <Divider sx={{ my: 1 }} />
                    <List dense disablePadding>
                      {awardsOfType.map((award) => (
                        <ListItem
                          key={award.id}
                          disablePadding
                          sx={{
                            cursor: "pointer",
                            "&:hover": { bgcolor: alpha(cardColor, 0.1) }, // Use card color for hover
                            borderRadius: 1,
                            px: 1, // More padding
                            py: 0.5,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayerClick(award.player_id);
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                {" "}
                                {/* Slightly larger font */}
                                {award.player?.name ?? "Unknown"}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default SeasonAwardsDisplay;
