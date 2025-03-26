import { supabase } from "./supabase";

export const updatePlayerStats = async (
  playerId: string,
  isWinner: boolean
) => {
  const { data: playerData, error } = await supabase
    .from("players")
    .select()
    .eq("id", playerId)
    .single();
  if (error) {
    console.error("Error fetching player Elo:", error);
    return;
  }

  let newWinStreak = playerData.win_streak;
  let newLossStreak = playerData.loss_streak;
  let wins = playerData.wins;
  let losses = playerData.losses;

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
    newWinStreak > playerData.longest_win_streak
      ? newWinStreak
      : playerData.longest_win_streak;

  const { error: updateError } = await supabase
    .from("players")
    .update({
      win_streak: newWinStreak,
      loss_streak: newLossStreak,
      win_percent: newWinPercent,
      losses,
      wins,
      longest_win_streak: newLongestStreak,
    })
    .eq("id", playerId);

  if (updateError) {
    console.error("Error updating streak:", updateError);
  }
};
