import { PlayerRating } from "./types";

export const updatePlayerStats = (player: PlayerRating, isWinner: boolean) => {
  let newWinStreak = player.win_streak;
  let newLossStreak = player.loss_streak;
  let wins = player.wins;
  let losses = player.losses;

  if (isWinner) {
    newWinStreak += 1;
    newLossStreak = 0; // Reset loss streak
    wins += 1;
  } else {
    newLossStreak += 1;
    newWinStreak = 0; // Reset win streak
    losses += 1;
  }

  const newWinPercent = Number(((wins / (wins + losses)) * 100).toFixed(2));
  const newLongestStreak =
    newWinStreak > player.longest_win_streak
      ? newWinStreak
      : player.longest_win_streak;

  return {
    newWinStreak,
    newLossStreak,
    wins,
    losses,
    newWinPercent,
    newLongestStreak,
  };
};
