import { supabase } from "@/lib/supabase";
import { rate, Rating } from "ts-trueskill";

interface PlayerRating {
  player_id: string;
  mu: number;
  sigma: number;
  elo: number;
  elo_change: number;
}

const SCORE_SCALING_FACTOR = 0.05;
const UNDERDOG_SCALING_FACTOR = 0.15;

export async function updateElo(
  gameId: string,
  squadA: string[],
  squadB: string[],
  scoreA: number,
  scoreB: number,
  teamId: string
): Promise<void> {
  try {
    // Fetch player ratings for Squad A
    const { data: playersA, error: errorA } = await supabase
      .from("player_teams")
      .select("player_id, players(mu, sigma, elo, elo_change)")
      .in("player_id", squadA)
      .eq("team_id", teamId);

    if (errorA || !playersA) throw new Error("Failed to fetch Squad A ratings");

    // Fetch player ratings for Squad B
    const { data: playersB, error: errorB } = await supabase
      .from("player_teams")
      .select("player_id, players(mu, sigma, elo, elo_change)")
      .in("player_id", squadB)
      .eq("team_id", teamId);

    if (errorB || !playersB) throw new Error("Failed to fetch Squad B ratings");

    const parsedPlayersA: PlayerRating[] = playersA.map((p) => ({
      player_id: p.player_id,
      mu: Number(p.players.mu),
      sigma: Number(p.players.sigma),
      elo: Number(p.players.elo),
      elo_change: Number(p.players.elo_change),
    }));

    const parsedPlayersB: PlayerRating[] = playersB.map((p) => ({
      player_id: p.player_id,
      mu: Number(p.players.mu),
      sigma: Number(p.players.sigma),
      elo: Number(p.players.elo),
      elo_change: Number(p.players.elo_change),
    }));

    const teamA: Rating[] = parsedPlayersA.map(
      (p) => new Rating(p.mu, p.sigma)
    );
    const teamB: Rating[] = parsedPlayersB.map(
      (p) => new Rating(p.mu, p.sigma)
    );

    const ranks: number[] = scoreA > scoreB ? [0, 1] : [1, 0];

    const newRatings: Rating[][] = rate([teamA, teamB], ranks);

    if (newRatings.length !== 2) {
      throw new Error("Unexpected TrueSkill rating output structure");
    }

    const [newRatingsA, newRatingsB] = newRatings;

    // **Score influence**
    const score_margin = Math.abs(scoreA - scoreB);
    const total_score = scoreA + scoreB;
    const score_ratio = total_score > 0 ? score_margin / total_score : 0;

    // **Calculate team average ELO**
    const avgEloA =
      parsedPlayersA.reduce((acc, p) => acc + p.elo, 0) / parsedPlayersA.length;
    const avgEloB =
      parsedPlayersB.reduce((acc, p) => acc + p.elo, 0) / parsedPlayersB.length;

    //Calculate rating difference and expected outcome
    const ratingDifference = avgEloA - avgEloB;
    const expectedOutcome = 1 / (1 + Math.pow(10, -ratingDifference / 400));

    //Blended Elo influence factors
    const scoreInfluence = 1 + SCORE_SCALING_FACTOR * score_ratio;
    const underdogInfluence =
      1 + (1 - expectedOutcome) * UNDERDOG_SCALING_FACTOR;

    const updatePromises = [
      ...parsedPlayersA.map((p, i) => {
        const newMu = newRatingsA[i].mu;
        const newSigma = newRatingsA[i].sigma;
        const baseEloChange = (newMu - p.mu) * 100;

        const isWinner = scoreA > scoreB;

        const eloChange = isWinner
          ? Math.round(baseEloChange * scoreInfluence * underdogInfluence)
          : Math.round((baseEloChange * scoreInfluence) / underdogInfluence);

        // Modify 'mu' directly based on score influence and rating difference
        const newElo = p.elo + eloChange; // ✅ Compute Elo After

        return Promise.all([
          // Update player_teams table with new ratings
          supabase
            .from("players")
            .update({
              mu: newMu,
              sigma: newSigma,
              elo: newElo,
              elo_change: eloChange,
            })
            .eq("id", p.player_id),
          // Update game_players table with elo_before and elo_after
          supabase
            .from("game_players")
            .update({ elo_before: p.elo, elo_after: newElo })
            .eq("player_id", p.player_id)
            .eq("game_id", gameId),
        ]);
      }),
      ...parsedPlayersB.map((p, i) => {
        const newMu = newRatingsB[i].mu;
        const newSigma = newRatingsB[i].sigma;

        const baseEloChange = (newMu - p.mu) * 100;

        const isWinner = scoreB > scoreA;

        const eloChange = isWinner
          ? Math.round(baseEloChange * scoreInfluence * underdogInfluence)
          : Math.round((baseEloChange * scoreInfluence) / underdogInfluence);

        // Modify 'mu' directly based on score influence and rating difference
        const newElo = p.elo + eloChange; // ✅ Compute Elo After

        return Promise.all([
          // Update player_teams table with new ratings
          supabase
            .from("players")
            .update({
              mu: newMu,
              sigma: newSigma,
              elo: newElo,
              elo_change: eloChange,
            })
            .eq("id", p.player_id),
          // Update game_players table with elo_before and elo_after
          supabase
            .from("game_players")
            .update({ elo_before: p.elo, elo_after: newElo })
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
