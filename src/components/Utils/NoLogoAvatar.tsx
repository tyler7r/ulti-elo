import { getTeamAvatarContent } from "@/lib/getTeamAvatarContent";
import { alpha, Avatar, useTheme } from "@mui/material";

type NoLogoAvatarProps = {
  name: string;
  size: "x-small" | "small" | "large";
  leaderboard?: boolean;
  isColor?: "primary" | "secondary";
};

const NoLogoAvatar = ({
  name,
  size,
  leaderboard,
  isColor,
}: NoLogoAvatarProps) => {
  const theme = useTheme();

  const styleOnSize =
    size === "small"
      ? {
          width: { xs: 30, sm: 35 },
          height: { xs: 30, sm: 35 },
          bgcolor:
            isColor === "primary"
              ? alpha(theme.palette.primary.main, 1)
              : isColor === "secondary"
              ? alpha(theme.palette.secondary.main, 1)
              : null,
        }
      : size === "x-small"
      ? {
          width: { xs: 24, sm: 28 },
          height: { xs: 24, sm: 28 },
          bgcolor:
            isColor === "primary"
              ? alpha(theme.palette.primary.main, 1)
              : isColor === "secondary"
              ? alpha(theme.palette.secondary.main, 1)
              : null,
        }
      : {
          width: { xs: 40, sm: 48 },
          height: { xs: 40, sm: 48 },
          bgcolor:
            isColor === "primary"
              ? alpha(theme.palette.primary.main, 1)
              : isColor === "secondary"
              ? alpha(theme.palette.secondary.main, 1)
              : null,
        };
  return (
    <Avatar alt={`${name} Logo`} sx={styleOnSize} variant="rounded">
      <div
        className={`${
          leaderboard ? "text-xs" : "text-sm"
        } font-bold flex items-center justify-center w-full`}
      >
        {getTeamAvatarContent(name)}
      </div>
    </Avatar>
  );
};

export default NoLogoAvatar;
