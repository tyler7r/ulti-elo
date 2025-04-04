import { getTeamAvatarContent } from "@/lib/getTeamAvatarContent";
import { Avatar } from "@mui/material";

type NoLogoAvatarProps = {
  name: string;
  size: "x-small" | "small" | "large";
  leaderboard?: boolean;
};

const NoLogoAvatar = ({ name, size, leaderboard }: NoLogoAvatarProps) => {
  const styleOnSize =
    size === "small"
      ? {
          width: { xs: 30, sm: 35 },
          height: { xs: 30, sm: 35 },
        }
      : size === "x-small"
      ? {
          width: { xs: 24, sm: 26 },
          height: { xs: 24, sm: 26 },
        }
      : {
          width: { xs: 40, sm: 48 },
          height: { xs: 40, sm: 48 },
        };
  return (
    <Avatar alt={`${name} Logo`} sx={styleOnSize}>
      <div
        className={`${
          leaderboard ? "text-xs" : "text-sm sm:text-lg"
        } font-bold flex items-center justify-center w-full`}
      >
        {getTeamAvatarContent(name)}
      </div>
    </Avatar>
  );
};

export default NoLogoAvatar;
