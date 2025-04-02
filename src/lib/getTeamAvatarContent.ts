export const getTeamAvatarContent = (
  teamName: string | null | undefined
): string => {
  if (!teamName) {
    return "";
  }
  const words = teamName.split(" ").filter((word) => word.length > 0);
  let content = "";
  if (words.length > 0) {
    content += words[0].charAt(0).toUpperCase();
    if (words.length > 1) {
      content += words[1].charAt(0).toUpperCase();
    }
  }
  return content;
};
