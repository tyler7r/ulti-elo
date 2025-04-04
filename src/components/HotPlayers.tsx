import { NewPlayerType } from "@/lib/types";
import WhatshotIcon from "@mui/icons-material/Whatshot"; // Import a hot icon
import { Box, Typography, useTheme } from "@mui/material";
import { useRouter } from "next/router";

interface HotPlayersProps {
  hotPlayers: NewPlayerType[];
}

const getRank = (elo: number) => {
  if (elo >= 2200) return { icon: "👑", name: "Apex" };
  if (elo >= 2000) return { icon: "⚡", name: "Legend" };
  if (elo >= 1800) return { icon: "🏆", name: "Master" };
  if (elo >= 1600) return { icon: "💎", name: "Diamond" };
  if (elo >= 1400) return { icon: "🌟", name: "Platinum" };
  if (elo >= 1200) return { icon: "⚔️", name: "Elite" };
  if (elo >= 800) return { icon: "🛡️", name: "Competitor" };
  return { icon: "👶", name: "Recruit" };
};

const HotPlayers = ({ hotPlayers }: HotPlayersProps) => {
  const theme = useTheme();
  const router = useRouter();

  if (!hotPlayers || hotPlayers.length === 0) {
    return null; // Or a message indicating no hot players
  }

  return (
    <Box
      className="w-full"
      sx={{
        borderRadius: "4px",

        marginBottom: theme.spacing(2),
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: theme.spacing(1.5), // Slightly smaller padding
        }}
      >
        <WhatshotIcon color="warning" sx={{ mr: 1 }} /> {/* Smaller icon */}
        <Typography variant="h6" fontWeight="bold">
          Hottest Players
        </Typography>
        <WhatshotIcon color="warning" sx={{ ml: 1 }} />{" "}
      </Box>
      <Box sx={{ padding: theme.spacing(1.0) }}>
        {hotPlayers.map((player) => {
          const rank = getRank(player.elo);
          return (
            <Box
              key={player.player_id + "_hot"}
              sx={{
                marginBottom: theme.spacing(1.5), // Slightly smaller margin
                padding: theme.spacing(1.5), // Slightly smaller padding
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "4px",
                backgroundColor: theme.palette.background.paper,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  component={"button"}
                  variant="body1"
                  fontWeight="bold"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    void router.push(`/player/${player.player_id}`)
                  }
                >
                  {rank.icon} {player.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Rank: {rank.name}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 0.5,
                  }}
                >
                  <Typography variant="caption" color="textSecondary">
                    Win Streak:
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={theme.palette.secondary.main}
                  >
                    {player.win_streak}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  fontStyle={"italic"}
                  fontWeight={"bold"}
                >
                  Elo: {player.elo}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default HotPlayers;
