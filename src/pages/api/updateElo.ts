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

    if (gameType.game_weight === "competitive") {
      gameWeight = HEAVY_WEIGHT;
    } else if (gameType.game_weight === "casual") {
      gameWeight = LIGHT_WEIGHT;
    }

    const squadAPlayerIDs = sqA.players.map((p) => p.pt_id);
    const squadBPlayerIDs = sqB.players.map((p) => p.pt_id);
    // Fetch player ratings for Squad A
    const { data: playersA, error: errorA } = await supabase
      .from("player_teams")
      .select("*, players(name, id)")
      .in("pt_id", squadAPlayerIDs)
      .eq("team_id", teamId);

    if (errorA || !playersA) throw new Error("Failed to fetch Squad A ratings");

    // Fetch player ratings for Squad B
    const { data: playersB, error: errorB } = await supabase
      .from("player_teams")
      .select("*, players(name, id)")
      .in("pt_id", squadBPlayerIDs)
      .eq("team_id", teamId);

    if (errorB || !playersB) throw new Error("Failed to fetch Squad B ratings");

    const parsedPlayersA: PlayerRating[] = playersA.map((p) => ({
      pt_id: p.pt_id,
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
      pt_id: p.pt_id,
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

    const teamASize = sqA.players.length;
    const teamBSize = sqB.players.length;

    const augmentedTeamA: Rating[] = parsedPlayersA.map(
      (p) => new Rating(p.mu, p.sigma)
    );
    const augmentedTeamB: Rating[] = parsedPlayersB.map(
      (p) => new Rating(p.mu, p.sigma)
    );

    if (teamASize < teamBSize) {
      const avgMuA =
        parsedPlayersA.reduce((sum, p) => sum + p.mu, 0) / teamASize || 15;
      const avgSigmaA =
        parsedPlayersA.reduce((sum, p) => sum + p.sigma, 0) / teamASize || 4;
      const diff = teamBSize - teamASize;
      for (let i = 0; i < diff; i++) {
        augmentedTeamA.push(new Rating(avgMuA, avgSigmaA));
      }
    } else if (teamBSize < teamASize) {
      const avgMuB =
        parsedPlayersB.reduce((sum, p) => sum + p.mu, 0) / teamBSize || 15;
      const avgSigmaB =
        parsedPlayersB.reduce((sum, p) => sum + p.sigma, 0) / teamBSize || 4;
      const diff = teamASize - teamBSize;
      for (let i = 0; i < diff; i++) {
        augmentedTeamB.push(new Rating(avgMuB, avgSigmaB));
      }
    }

    const ranks: number[] = sqA.score > sqB.score ? [0, 1] : [1, 0];

    const newRatings: Rating[][] = rate(
      [augmentedTeamA, augmentedTeamB],
      ranks
    );

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
        const newMuFromTrueSkill = newRatingsA[i].mu;
        const newSigma = newRatingsA[i].sigma;

        const baseMuChange = newMuFromTrueSkill - p.mu;

        const isWinner = sqA.score > sqB.score;
        const multiplier = isWinner
          ? scoreInfluence * underdogInfluence
          : scoreInfluence / underdogInfluence;

        const adjustedMuChange = baseMuChange * multiplier * gameWeight;
        const newMu = p.mu + adjustedMuChange;

        const eloChange = Math.round((newMu - p.mu) * 100);
        const newElo = Math.round(newMu * 100);

        // Modify 'mu' directly based on score influence and rating difference
        // const newElo = p.elo + eloChange; // ✅ Compute Elo After
        const newHighElo = newElo > p.highest_elo ? newElo : p.highest_elo;

        const newStats = updatePlayerStats(p, isWinner);
        const lastUpdate = new Date().toDateString();

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
              last_updated: lastUpdate,
            })
            .eq("pt_id", p.pt_id),
          // Update game_players table with elo_before and elo_after
          supabase.from("game_players").upsert({
            pt_id: p.pt_id,
            is_winner: isWinner,
            squad_id: sqA.id,
            game_id: gameId,
            elo_before: Number(p.elo),
            elo_after: Number(newElo),
            mu_before: Number(p.mu),
            mu_after: Number(newMu),
            sigma_after: Number(newSigma),
            sigma_before: Number(p.sigma),
            wins_before: Number(p.wins),
            wins_after: Number(newStats.wins),
            losses_before: Number(p.losses),
            losses_after: Number(newStats.losses),
            win_streak_before: Number(p.win_streak),
            loss_streak_before: Number(p.loss_streak),
            win_streak_after: Number(newStats.newWinStreak),
            loss_streak_after: Number(newStats.newLossStreak),
            win_percent_after: Number(newStats.newWinPercent),
            longest_win_streak_after: Number(newStats.newLongestStreak),
            elo_change_after: Number(eloChange),
            highest_elo_after: Number(newHighElo),
            win_percent_before: Number(p.win_percent),
            highest_elo_before: Number(p.highest_elo),
            longest_win_streak_before: Number(p.longest_win_streak),
            elo_change_before: Number(p.elo_change),
          }),
        ]);
      }),
      ...parsedPlayersB.map((p, i) => {
        const newMuFromTrueSkill = newRatingsB[i].mu;
        const newSigma = newRatingsB[i].sigma;

        const baseMuChange = newMuFromTrueSkill - p.mu;

        const isWinner = sqA.score < sqB.score;
        const multiplier = isWinner
          ? scoreInfluence * underdogInfluence
          : scoreInfluence / underdogInfluence;

        const adjustedMuChange = baseMuChange * multiplier * gameWeight;
        const newMu = p.mu + adjustedMuChange;

        const eloChange = Math.round((newMu - p.mu) * 100);
        const newElo = Math.round(newMu * 100);

        // Modify 'mu' directly based on score influence and rating difference
        // const newElo = p.elo + eloChange; // ✅ Compute Elo After
        const newHighElo = newElo > p.highest_elo ? newElo : p.highest_elo;

        const newStats = updatePlayerStats(p, isWinner);
        const lastUpdate = new Date().toDateString();

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
              last_updated: lastUpdate,
            })
            .eq("pt_id", p.pt_id),
          // Update game_players table with elo_before and elo_after
          supabase.from("game_players").upsert({
            pt_id: p.pt_id,
            is_winner: isWinner,
            squad_id: sqB.id,
            game_id: gameId,
            elo_before: Number(p.elo),
            elo_after: Number(newElo),
            mu_before: Number(p.mu),
            mu_after: Number(newMu),
            sigma_after: Number(newSigma),
            sigma_before: Number(p.sigma),
            wins_before: Number(p.wins),
            wins_after: Number(newStats.wins),
            losses_before: Number(p.losses),
            losses_after: Number(newStats.losses),
            win_streak_before: Number(p.win_streak),
            loss_streak_before: Number(p.loss_streak),
            win_streak_after: Number(newStats.newWinStreak),
            loss_streak_after: Number(newStats.newLossStreak),
            win_percent_after: Number(newStats.newWinPercent),
            longest_win_streak_after: Number(newStats.newLongestStreak),
            elo_change_after: Number(eloChange),
            highest_elo_after: Number(newHighElo),
            win_percent_before: Number(p.win_percent),
            highest_elo_before: Number(p.highest_elo),
            longest_win_streak_before: Number(p.longest_win_streak),
            elo_change_before: Number(p.elo_change),
          }),
        ]);
      }),
    ];

    await Promise.all(updatePromises.flat());
  } catch (error) {
    console.error("Error updating Elo ratings:", error);
  }
}
