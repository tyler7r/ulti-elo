// components/browse/BrowseItemCard.tsx (Create this new file/folder structure)
import NoLogoAvatar from "@/components/Utils/NoLogoAvatar"; // Adjust path
import { PlayerType, TeamType } from "@/lib/types"; // Adjust path
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  Box,
  Paper,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import FavoriteButton from "./FavoriteButton";

interface BrowseItemCardProps {
  item: TeamType | PlayerType; // Accepts either type
  type: "team" | "player";
  onClick: () => void;
  isColor?: "primary" | "secondary";
}

const BrowseItemCard = ({
  item,
  type,
  onClick,
  isColor,
}: BrowseItemCardProps) => {
  const theme = useTheme();
  const isTeam = type === "team";
  const teamItem = item as TeamType;
  const playerItem = item as PlayerType;

  const itemName = isTeam ? teamItem.name : playerItem.name;
  const logoUrl = isTeam ? teamItem.logo_url : undefined; // Player avatars not implemented here yet

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        cursor: "pointer",
        position: "relative",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        height: "100%", // Ensure cards fill grid item height
        "&:hover": {
          // Slightly different hover for non-favorites
          borderColor: alpha(theme.palette.primary.main, 0.6),
          boxShadow: `0 1px 6px ${alpha(theme.palette.primary.main, 0.15)}`,
        },
      }}
    >
      {/* Item Avatar/Logo */}
      {isTeam ? (
        logoUrl ? (
          // Using Avatar as a container for Image for consistent shape/siz
          <Image
            height={35}
            width={35}
            src={logoUrl}
            alt={`${itemName} Logo`}
            className="rounded"
          />
        ) : (
          <NoLogoAvatar name={itemName} size="small" />
        )
      ) : (
        // Using Person Icon for Player placeholder
        <NoLogoAvatar size="small" name={itemName} isColor={isColor} />
      )}
      {/* Item Name */}
      <Box flexGrow={1} overflow="hidden">
        <Tooltip title={itemName}>
          <Typography
            variant="body1" // Slightly larger text for browse page?
            fontWeight="bold"
            noWrap
          >
            {itemName}
          </Typography>
        </Tooltip>
        {/* Removed ELO/Rank display from player card here */}
      </Box>
      {/* Navigation Arrow */}
      <FavoriteButton
        itemId={item.id}
        itemType={type}
        small={true}
        itemName={itemName}
      />
      <ArrowForwardIosIcon
        fontSize="small"
        sx={{ color: "text.disabled", ml: "auto", flexShrink: 0 }}
      />
    </Paper>
  );
};

export default BrowseItemCard;
