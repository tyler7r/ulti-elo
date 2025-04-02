import { getTeamSizeCounteractionFactor } from "@/lib/getCounteractionFactor";
import { supabase } from "@/lib/supabase";
import { GameFormSquadType, PlayerRating } from "@/lib/types";
import { updatePlayerStats } from "@/lib/updatePlayerStats";
import { rate, Rating } from "ts-trueskill";

const SCORE_SCALING_FACTOR = 0.05;
const UNDERDOG_SCALING_FACTOR = 0.15;

const HEAVY_WEIGHT = 1.25;
const LIGHT_WEIGHT = 0.75;

export async function updateElo(
  gameId: string,
  sqA: GameFormSquadType,
  sqB: GameFormSquadType,
  teamId: string
): Promise<void> {
  try {
    const { data: gameData, error: fetchGameError } = await supabase
      .from("games")
      .select("game_weight")
      .eq("id", gameId)
      .single();

    if (fetchGameError || !gameData) {
      console.error("Error fetching game details:", fetchGameError);
      throw new Error("Failed to fetch game details.");
    }

    const gameType = gameData;
    let gameWeight = 1; // Default weight if game_type is not specified or recognized

    if (gameType.game_weight === "heavy") {
      gameWeight = HEAVY_WEIGHT;
    } else if (gameType.game_weight === "light") {
      gameWeight = LIGHT_WEIGHT;
    }

    const squadAPlayerIDs = sqA.players.map((p) => p.id);
    const squadBPlayerIDs = sqB.players.map((p) => p.id);
    // Fetch player ratings for Squad A
    const { data: playersA, error: errorA } = await supabase
      .from("player_teams")
      .select("*, players(name, id)")
      .in("id", squadAPlayerIDs)
      .eq("team_id", teamId);

    if (errorA || !playersA) throw new Error("Failed to fetch Squad A ratings");

    // Fetch player ratings for Squad B
    const { data: playersB, error: errorB } = await supabase
      .from("player_teams")
      .select("*, players(name, id)")
      .in("id", squadBPlayerIDs)
      .eq("team_id", teamId);

    if (errorB || !playersB) throw new Error("Failed to fetch Squad B ratings");

    const parsedPlayersA: PlayerRating[] = playersA.map((p) => ({
      player_id: p.id,
      mu: Number(p.mu),
      sigma: Number(p.sigma),
      elo: Number(p.elo),
      elo_change: Number(p.elo_change),
      highest_elo: Number(p.highest_elo),
      wins: Number(p.wins),
      losses: Number(p.losses),
      win_percent: Number(p.win_percent),
      win_streak: Number(p.win_streak),
      loss_streak: Number(p.loss_streak),
      longest_win_streak: Number(p.longest_win_streak),
    }));

    const parsedPlayersB: PlayerRating[] = playersB.map((p) => ({
      player_id: p.id,
      mu: Number(p.mu),
      sigma: Number(p.sigma),
      elo: Number(p.elo),
      elo_change: Number(p.elo_change),
      highest_elo: Number(p.highest_elo),
      wins: Number(p.wins),
      losses: Number(p.losses),
      win_percent: Number(p.win_percent),
      win_streak: Number(p.win_streak),
      loss_streak: Number(p.loss_streak),
      longest_win_streak: Number(p.longest_win_streak),
    }));

    const squadASize = parsedPlayersA.length;
    const squadBSize = parsedPlayersB.length;

    const teamA: Rating[] = parsedPlayersA.map(
      (p) => new Rating(p.mu, p.sigma)
    );
    const teamB: Rating[] = parsedPlayersB.map(
      (p) => new Rating(p.mu, p.sigma)
    );

    const ranks: number[] = sqA.score > sqB.score ? [0, 1] : [1, 0];

    const newRatings: Rating[][] = rate([teamA, teamB], ranks);

    if (newRatings.length !== 2) {
      throw new Error("Unexpected TrueSkill rating output structure");
    }

    const [newRatingsA, newRatingsB] = newRatings;

    // **Score influence**
    const score_margin = Math.abs(sqA.score - sqB.score);
    const total_score = sqA.score + sqB.score;
    const score_ratio = total_score > 0 ? score_margin / total_score : 0;
    const scoreInfluence = 1 + SCORE_SCALING_FACTOR * Math.sqrt(score_ratio);

    // **Calculate team average ELO**
    const avgEloA =
      parsedPlayersA.reduce((acc, p) => acc + p.elo, 0) / parsedPlayersA.length;
    const avgEloB =
      parsedPlayersB.reduce((acc, p) => acc + p.elo, 0) / parsedPlayersB.length;

    //Calculate rating difference and expected outcome
    const ratingDifference = avgEloA - avgEloB;
    const expectedOutcome = 1 / (1 + Math.pow(10, -ratingDifference / 400));

    //Blended Elo influence factors
    const underdogInfluence =
      1 + (1 - expectedOutcome) * UNDERDOG_SCALING_FACTOR;

    const updatePromises = [
      ...parsedPlayersA.map((p, i) => {
        const newMu = newRatingsA[i].mu;
        const newSigma = newRatingsA[i].sigma;
        const baseEloChange = (newMu - p.mu) * 100;

        const isWinner = sqA.score > sqB.score;

        const counteractionFactor = getTeamSizeCounteractionFactor(
          squadASize,
          squadBSize
        );

        const eloChange = Math.round(
          (isWinner
            ? baseEloChange * scoreInfluence * underdogInfluence
            : (baseEloChange * scoreInfluence) / underdogInfluence) *
            gameWeight *
            counteractionFactor
        );

        // Modify 'mu' directly based on score influence and rating difference
        const newElo = p.elo + eloChange; // ✅ Compute Elo After
        const newHighElo = newElo > p.highest_elo ? newElo : p.highest_elo;

        const newStats = updatePlayerStats(p, isWinner);

        return Promise.all([
          // Update player_teams table with new ratings
          supabase
            .from("player_teams")
            .update({
              mu: newMu,
              sigma: newSigma,
              elo: newElo,
              elo_change: eloChange,
              highest_elo: newHighElo,
              wins: newStats.wins,
              losses: newStats.losses,
              win_streak: newStats.newWinStreak,
              loss_streak: newStats.newLossStreak,
              longest_win_streak: newStats.newLongestStreak,
              win_percent: newStats.newWinPercent,
            })
            .eq("id", p.player_id),
          // Update game_players table with elo_before and elo_after
          supabase
            .from("game_players")
            .update({
              elo_before: p.elo,
              elo_after: newElo,
              mu_before: p.mu,
              sigma_before: p.sigma,
              wins_before: p.wins,
              losses_before: p.losses,
              win_streak_before: p.win_streak,
              loss_streak_before: p.loss_streak,
              win_percent_before: p.win_percent,
              highest_elo_before: p.highest_elo,
              longest_win_streak_before: p.longest_win_streak,
              elo_change_before: p.elo_change,
            })
            .eq("player_id", p.player_id)
            .eq("game_id", gameId),
        ]);
      }),
      ...parsedPlayersB.map((p, i) => {
        const newMu = newRatingsB[i].mu;
        const newSigma = newRatingsB[i].sigma;

        const baseEloChange = (newMu - p.mu) * 100;

        const isWinner = sqB.score > sqB.score;

        const counteractionFactor = getTeamSizeCounteractionFactor(
          squadASize,
          squadBSize
        );

        const eloChange = Math.round(
          (isWinner
            ? baseEloChange * scoreInfluence * underdogInfluence
            : (baseEloChange * scoreInfluence) / underdogInfluence) *
            gameWeight *
            counteractionFactor
        );

        // Modify 'mu' directly based on score influence and rating difference
        const newElo = p.elo + eloChange; // ✅ Compute Elo After
        const newHighElo = newElo > p.highest_elo ? newElo : p.highest_elo;

        const newStats = updatePlayerStats(p, isWinner);

        return Promise.all([
          // Update player_teams table with new ratings
          supabase
            .from("player_teams")
            .update({
              mu: newMu,
              sigma: newSigma,
              elo: newElo,
              elo_change: eloChange,
              highest_elo: newHighElo,
              wins: newStats.wins,
              losses: newStats.losses,
              win_streak: newStats.newWinStreak,
              loss_streak: newStats.newLossStreak,
              longest_win_streak: newStats.newLongestStreak,
              win_percent: newStats.newWinPercent,
            })
            .eq("id", p.player_id),
          // Update game_players table with elo_before and elo_after
          supabase
            .from("game_players")
            .update({
              elo_before: p.elo,
              elo_after: newElo,
              mu_before: p.mu,
              sigma_before: p.sigma,
              wins_before: p.wins,
              losses_before: p.losses,
              win_streak_before: p.win_streak,
              loss_streak_before: p.loss_streak,
              win_percent_before: p.win_percent,
              highest_elo_before: p.highest_elo,
              longest_win_streak_before: p.longest_win_streak,
              elo_change_before: p.elo_change,
            })
            .eq("player_id", p.player_id)
            .eq("game_id", gameId),
        ]);
      }),
    ];

    await Promise.all(updatePromises.flat());
  } catch (error) {
    console.error("Error updating Elo ratings:", error);
  }
}
