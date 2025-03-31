// lib/elo-utils.ts
import { supabase } from "@/lib/supabase";
import { GamePlayerType } from "@/lib/types"; // Adjust path if necessary
import { rate, Rating } from "ts-trueskill"; // Changed import

type CurrentPlayerStats = Map<
  string,
  {
    mu: number;
    sigma: number;
    elo: number;
    wins: number;
    losses: number;
    win_streak: number;
    loss_streak: number;
    longest_win_streak: number;
    highest_elo: number;
    win_percent: number;
    elo_change: number;
  }
>;

interface Game {
  id: string;
  match_date: string;
  team_id: string;
  squad_a_id: string;
  squad_b_id: string;
  squad_a_score: number;
  squad_b_score: number;
}

interface GameEditRow {
  id: string;
  game_id: string;
  edited_at: string;
  edited_by_user_id: string;
  previous_game_data: Game;
  previous_game_players_data: GamePlayerType[];
}

const SCORE_SCALING_FACTOR = 0.05;
const UNDERDOG_SCALING_FACTOR = 0.15;

export async function recalculateElo(
  editedGameId: string,
  gameEditId: string,
  teamId: string
) {
  try {
    // Fetch all games for the team, ordered by match date
    const { data: allGames, error: fetchAllGamesError } = await supabase
      .from("games")
      .select(
        "id, match_date, squad_a_id, squad_b_id, squad_a_score, squad_b_score"
      )
      .eq("team_id", teamId)
      .order("match_date");

    if (fetchAllGamesError) throw fetchAllGamesError;

    // Find the index of the edited game
    const editedGameIndex = allGames.findIndex(
      (game) => game.id === editedGameId
    );

    if (editedGameIndex === -1) {
      console.warn(`Edited game with ID ${editedGameId} not found.`);
      return;
    }

    const editedGame = allGames[editedGameIndex];
    const gamesToRecalculate = allGames.slice(editedGameIndex);

    // Fetch the edit history for the edited game
    const { data: gameEditResponse, error: fetchGameEditError } = await supabase
      .from("game_edits")
      .select("*")
      .eq("id", gameEditId)
      .single();

    let gameEdit: GameEditRow | null = null;
    if (gameEditResponse) {
      gameEdit = gameEditResponse as GameEditRow;
    } else if (fetchGameEditError && fetchGameEditError.code !== "PGRST116") {
      console.error("Error fetching game edit:", fetchGameEditError);
      return;
    }

    // Fetch the state of players before the edited game
    const previousGamePlayersData = gameEdit?.previous_game_players_data || [];
    const playerStatsBeforeEdit = new Map<
      string,
      {
        mu: number;
        sigma: number;
        elo: number;
        wins: number;
        losses: number;
        win_streak: number;
        loss_streak: number;
        longest_win_streak: number;
        highest_elo: number;
        win_percent: number;
        elo_change: number;
      }
    >();
    previousGamePlayersData.forEach((playerData) => {
      playerStatsBeforeEdit.set(playerData.player_id, {
        mu: playerData.mu_before,
        sigma: playerData.sigma_before,
        elo: playerData.elo_before,
        wins: playerData.wins_before,
        losses: playerData.losses_before,
        win_streak: playerData.win_streak_before,
        loss_streak: playerData.loss_streak_before,
        longest_win_streak: playerData.longest_win_streak_before,
        highest_elo: playerData.highest_elo_before,
        win_percent: playerData.win_percent_before,
        elo_change: playerData.elo_change_before,
      });
    });

    const getAddedPlayerStatsBeforeGame = async (playerId: string) => {
      const { data: subsequentGamePlayer, error: fetchSubsequentGameError } =
        await supabase
          .from("game_players")
          .select("*, games(match_date)")
          .eq("player_id", playerId)
          .gt("games.match_date", editedGame.match_date)
          .order("games(match_date)")
          .limit(1);
      // Set current player stats?

      if (fetchSubsequentGameError) {
        console.error(
          "Error fetching subsequent game:",
          fetchSubsequentGameError
        );
      }
      if (subsequentGamePlayer && subsequentGamePlayer.length > 0) {
        return {
          mu: subsequentGamePlayer[0].mu_before,
          sigma: subsequentGamePlayer[0].sigma_before,
          elo: subsequentGamePlayer[0].elo_before,
          wins: subsequentGamePlayer[0].wins_before,
          losses: subsequentGamePlayer[0].losses_before,
          win_streak: subsequentGamePlayer[0].win_streak_before,
          loss_streak: subsequentGamePlayer[0].loss_streak_before,
          longest_win_streak: subsequentGamePlayer[0].longest_win_streak_before,
          highest_elo: subsequentGamePlayer[0].highest_elo_before,
          win_percent: subsequentGamePlayer[0].win_percent_before,
          elo_change: subsequentGamePlayer[0].elo_change_before,
        };
      } else {
        const { data: currentPlayer, error: fetchCurrentPlayerError } =
          await supabase
            .from("players")
            .select("*")
            .eq("id", playerId)
            .single();

        if (fetchCurrentPlayerError) {
          console.error(
            "Error fetching current player:",
            fetchCurrentPlayerError
          );
        }

        return {
          mu: currentPlayer?.mu ?? 15,
          sigma: currentPlayer?.sigma ?? 4,
          elo: currentPlayer?.elo ?? 1500,
          elo_change: currentPlayer?.elo_change ?? 0,
          highest_elo: currentPlayer?.highest_elo ?? 1500,
          wins: currentPlayer?.wins ?? 0,
          losses: currentPlayer?.losses ?? 0,
          win_streak: currentPlayer?.win_streak ?? 0,
          loss_streak: currentPlayer?.loss_streak ?? 0,
          longest_win_streak: currentPlayer?.longest_win_streak ?? 0,
          win_percent: currentPlayer?.win_percent ?? 0,
        };
      }
    };

    // Function to get player stats before a game
    const getPlayerStatsBeforeGame = async (
      gameId: string,
      playerId: string,
      currentPlayerStats: CurrentPlayerStats
    ) => {
      if (gameId === editedGameId) {
        const statsBefore = playerStatsBeforeEdit.get(playerId);

        if (statsBefore) {
          return statsBefore;
        } else {
          // Player was likely added retroactively, check for subsequent games
          const addedPlayerStats = await getAddedPlayerStatsBeforeGame(
            playerId
          );
          currentPlayerStats.set(playerId, addedPlayerStats);
          return;
        }
      }
      // For subsequent games, use the stats calculated from the previous game
      const currentStats = currentPlayerStats.get(playerId);
      if (currentStats) {
        return currentStats;
      }
      // Fallback to initial if no history (shouldn't happen after first game)
      return {
        mu: 15,
        sigma: 4,
        elo: 1500,
        elo_change: 0,
        highest_elo: 1500,
        wins: 0,
        losses: 0,
        win_streak: 0,
        loss_streak: 0,
        longest_win_streak: 0,
        win_percent: 0,
      };
    };

    const updatePlayerStats = async (
      playerId: string,
      newMu: number,
      oldMu: number,
      newSigma: number,
      oldSigma: number,
      newElo: number,
      newEloChange: number,
      newHighestElo: number,
      wins: number,
      losses: number,
      winStreak: number,
      lossStreak: number,
      longestWinStreak: number,
      winPercent: number,
      isWinner: boolean,
      gameId: string,
      currentPlayerStats: CurrentPlayerStats
    ) => {
      console.log("Update Player Stat Inputs", {
        playerId,
        newMu,
        oldMu,
        newSigma,
        oldSigma,
        newElo,
        newEloChange,
        newHighestElo,
        wins,
        losses,
        winStreak,
        lossStreak,
        longestWinStreak,
        winPercent,
        isWinner,
        gameId,
      });
      let newWinStreak = winStreak;
      let newLossStreak = lossStreak;
      let newWins = wins;
      let newLosses = losses;

      if (isWinner) {
        newWinStreak += 1;
        newLossStreak = 0; // Reset loss streak
        newWins += 1;
      } else {
        newLossStreak += 1;
        newWinStreak = 0; // Reset win streak
        newLosses += 1;
      }

      const newWinPercent = Number(
        ((newWins / (newWins + newLosses)) * 100).toFixed(2)
      );
      const newLongestStreak = Math.max(newWinStreak, longestWinStreak);

      console.log("Player calculated stats before database update", {
        playerId,
        newWinPercent,
        newWinStreak,
        newWins,
        newLosses,
        newLongestStreak,
        newLossStreak,
      });

      currentPlayerStats.set(playerId, {
        mu: newMu,
        sigma: newSigma,
        elo: newElo,
        highest_elo: newHighestElo,
        elo_change: newEloChange,
        wins: newWins,
        losses: newLosses,
        win_percent: newWinPercent,
        win_streak: newWinStreak,
        loss_streak: newLossStreak,
        longest_win_streak: newLongestStreak,
      });

      const { data: playersTableUpdate, error: updateError } = await supabase
        .from("players")
        .update({
          mu: newMu,
          sigma: newSigma,
          elo: newElo,
          elo_change: newEloChange,
          highest_elo: newHighestElo,
          wins: newWins,
          losses: newLosses,
          win_percent: newWinPercent,
          win_streak: newWinStreak,
          loss_streak: newLossStreak,
          longest_win_streak: newLongestStreak,
        })
        .eq("id", playerId);
      if (updateError) {
        console.log("Players Table Update Error", updateError.message);
        throw updateError;
      }
      console.log("Players Table Update Stats", playersTableUpdate);
      const { data: newGamePlayerStats, error: gamePlayerUpdateError } =
        await supabase
          .from("game_players")
          .update({
            is_winner: isWinner,
            elo_before: newElo - newEloChange,
            elo_after: newElo,
            mu_before: oldMu,
            sigma_before: oldSigma,
            wins_before: wins,
            losses_before: losses,
            win_streak_before: winStreak,
            loss_streak_before: lossStreak,
            win_percent_before: winPercent,
            longest_win_streak_before: longestWinStreak,
            elo_change_before: newEloChange,
          })
          .eq("player_id", playerId)
          .eq("game_id", gameId);
      if (gamePlayerUpdateError) {
        console.log(
          "Game Players Table Update Error",
          gamePlayerUpdateError.message
        );
        throw gamePlayerUpdateError;
      }
      console.log(
        "Game Player Stats after updatePlayerStats",
        newGamePlayerStats
      );
    };

    // Revert stats for removed players (using data from previous_game_players_data)
    const currentGamePlayersForEditedGame = await supabase
      .from("game_players")
      .select("*")
      .eq("game_id", editedGameId);
    const currentPlayersInEditedGame =
      currentGamePlayersForEditedGame.data?.map((gp) => gp.player_id) || [];
    const originalPlayers =
      gameEdit?.previous_game_players_data?.map((gp) => gp.player_id) || [];
    const removedPlayers = originalPlayers.filter(
      (playerId) => !currentPlayersInEditedGame.includes(playerId)
    );

    for (const removedPlayerId of removedPlayers) {
      const beforeData = gameEdit?.previous_game_players_data?.find(
        (gp) => gp.player_id === removedPlayerId
      );
      if (beforeData) {
        const { error: updatePlayerError } = await supabase
          .from("players")
          .update({
            elo: beforeData.elo_before,
            mu: beforeData.mu_before,
            sigma: beforeData.sigma_before,
            wins: beforeData.wins_before,
            losses: beforeData.losses_before,
            win_streak: beforeData.win_streak_before,
            loss_streak: beforeData.loss_streak_before,
            win_percent: beforeData.win_percent_before,
            highest_elo: beforeData.highest_elo_before,
            longest_win_streak: beforeData.longest_win_streak_before,
            elo_change: beforeData.elo_change_before,
          })
          .eq("id", removedPlayerId);
        if (updatePlayerError) {
          console.error("Error reverting player stats:", updatePlayerError);
        }
      }
    }

    // Recalculate ELO for the edited game and all subsequent games
    const currentPlayerStats = new Map<
      string,
      {
        mu: number;
        sigma: number;
        elo: number;
        elo_change: number;
        highest_elo: number;
        wins: number;
        losses: number;
        win_percent: number;
        win_streak: number;
        loss_streak: number;
        longest_win_streak: number;
      }
    >();
    previousGamePlayersData.forEach((playerData) => {
      currentPlayerStats.set(playerData.player_id, {
        mu: playerData.mu_before,
        sigma: playerData.sigma_before,
        elo: playerData.elo_before,
        highest_elo: playerData.highest_elo_before,
        elo_change: playerData.elo_change_before,
        win_percent: playerData.win_percent_before,
        win_streak: playerData.win_streak_before,
        loss_streak: playerData.loss_streak_before,
        wins: playerData.wins_before,
        losses: playerData.losses_before,
        longest_win_streak: playerData.longest_win_streak_before,
      });
    });

    for (const game of gamesToRecalculate) {
      const { data: squadAGamePlayers, error: fetchSquadAError } =
        await supabase
          .from("game_players")
          .select("*") // Fetch mu and sigma
          .eq("game_id", game.id)
          .eq("squad_id", game.squad_a_id);
      if (fetchSquadAError) throw fetchSquadAError;

      const { data: squadBGamePlayers, error: fetchSquadBError } =
        await supabase
          .from("game_players")
          .select("*") // Fetch mu and sigma
          .eq("game_id", game.id)
          .eq("squad_id", game.squad_b_id);
      if (fetchSquadBError) throw fetchSquadBError;

      const team1Players =
        squadAGamePlayers?.map((sp) => {
          const playerHasCurrentStats = currentPlayerStats.get(sp.player_id);

          if (playerHasCurrentStats) {
            return { player_id: sp.player_id, ...playerHasCurrentStats };
          } else {
            return {
              player_id: sp.player_id,
              mu: sp.mu_before ?? 15.0,
              sigma: sp.sigma_before ?? 4,
              elo:
                sp.elo_before === 0 || sp.elo_before === null
                  ? 1500
                  : sp.elo_before,
              elo_change: sp.elo_change_before ?? 0,
              highest_elo: sp.highest_elo_before ?? 1500,
              wins: sp.wins_before ?? 0,
              losses: sp.losses_before ?? 0,
              win_percent: sp.win_percent_before ?? 0,
              win_streak: sp.win_streak_before ?? 0,
              loss_streak: sp.loss_streak_before ?? 0,
              longest_win_streak: sp.longest_win_streak_before ?? 0,
            };
          }
        }) || [];
      const team2Players =
        squadBGamePlayers?.map((sp) => {
          const playerHasCurrentStats = currentPlayerStats.get(sp.player_id);

          if (playerHasCurrentStats) {
            return { player_id: sp.player_id, ...playerHasCurrentStats };
          } else {
            return {
              player_id: sp.player_id,
              mu: sp.mu_before ?? 15.0,
              sigma: sp.sigma_before ?? 4,
              elo:
                sp.elo_before === 0 || sp.elo_before === null
                  ? 1500
                  : sp.elo_before,
              elo_change: sp.elo_change_before ?? 0,
              highest_elo: sp.highest_elo_before ?? 1500,
              wins: sp.wins_before ?? 0,
              losses: sp.losses_before ?? 0,
              win_percent: sp.win_percent_before ?? 0,
              win_streak: sp.win_streak_before ?? 0,
              loss_streak: sp.loss_streak_before ?? 0,
              longest_win_streak: sp.longest_win_streak_before ?? 0,
            };
          }
        }) || [];

      const teamA: Rating[] = await Promise.all(
        team1Players.map(
          async (p) =>
            new Rating(
              (
                await getPlayerStatsBeforeGame(
                  game.id,
                  p.player_id,
                  currentPlayerStats
                )
              )?.mu ?? p.mu,
              (
                await getPlayerStatsBeforeGame(
                  game.id,
                  p.player_id,
                  currentPlayerStats
                )
              )?.sigma ?? p.sigma
            )
        )
      );
      const teamB: Rating[] = await Promise.all(
        team2Players.map(
          async (p) =>
            new Rating(
              (
                await getPlayerStatsBeforeGame(
                  game.id,
                  p.player_id,
                  currentPlayerStats
                )
              )?.mu ?? p.mu,
              (
                await getPlayerStatsBeforeGame(
                  game.id,
                  p.player_id,
                  currentPlayerStats
                )
              )?.sigma ?? p.sigma
            )
        )
      );

      const ranks: number[] =
        game.squad_a_score > game.squad_b_score ? [0, 1] : [1, 0];

      const newRatings: Rating[][] = rate([teamA, teamB], ranks);

      const score_margin = Math.abs(game.squad_a_score - game.squad_b_score);
      const total_score = game.squad_a_score + game.squad_b_score;
      const score_ratio = total_score > 0 ? score_margin / total_score : 0;
      const scoreInfluence = 1 + SCORE_SCALING_FACTOR * Math.sqrt(score_ratio);

      // **Calculate team average ELO**
      const avgEloA =
        team1Players.reduce((acc, p) => acc + p.elo, 0) / team1Players.length;
      const avgEloB =
        team2Players.reduce((acc, p) => acc + p.elo, 0) / team2Players.length;

      //Calculate rating difference and expected outcome
      const ratingDifference = avgEloA - avgEloB;
      const expectedOutcome = 1 / (1 + Math.pow(10, -ratingDifference / 400));

      //Blended Elo influence factors
      const underdogInfluence =
        1 + (1 - expectedOutcome) * UNDERDOG_SCALING_FACTOR;

      if (newRatings.length === 2) {
        newRatings[0].forEach((rating, index) => {
          const newMu = rating.mu;
          const newSigma = rating.sigma;
          const baseEloChange = (newMu - team1Players[index].mu) * 100;

          const isWinner = game.squad_a_score > game.squad_b_score;

          const eloChange = isWinner
            ? Math.round(baseEloChange * scoreInfluence * underdogInfluence)
            : Math.round((baseEloChange * scoreInfluence) / underdogInfluence);

          const newElo = team1Players[index].elo + eloChange;
          const newHighElo = Math.max(newElo, team1Players[index].highest_elo);
          updatePlayerStats(
            team1Players[index].player_id,
            newMu,
            team1Players[index].mu,
            newSigma,
            team1Players[index].sigma,
            newElo,
            eloChange,
            newHighElo,
            team1Players[index].wins,
            team1Players[index].losses,
            team1Players[index].win_streak,
            team1Players[index].loss_streak,
            team1Players[index].longest_win_streak,
            team1Players[index].win_percent,
            isWinner,
            game.id,
            currentPlayerStats
          );
        });
        newRatings[1].forEach((rating, index) => {
          const newMu = rating.mu;
          const newSigma = rating.sigma;
          const baseEloChange = (newMu - team2Players[index].mu) * 100;

          const isWinner = game.squad_a_score < game.squad_b_score;

          const eloChange = isWinner
            ? Math.round(baseEloChange * scoreInfluence * underdogInfluence)
            : Math.round((baseEloChange * scoreInfluence) / underdogInfluence);

          const newElo = team2Players[index].elo + eloChange;
          const newHighElo = Math.max(newElo, team2Players[index].highest_elo);
          updatePlayerStats(
            team2Players[index].player_id,
            newMu,
            team2Players[index].mu,
            newSigma,
            team2Players[index].sigma,
            newElo,
            eloChange,
            newHighElo,
            team2Players[index].wins,
            team2Players[index].losses,
            team2Players[index].win_streak,
            team2Players[index].loss_streak,
            team2Players[index].longest_win_streak,
            team2Players[index].win_percent,
            isWinner,
            game.id,
            currentPlayerStats
          );
        });
      }
    }
  } catch (error) {
    console.error("Error recalculating ELO:", error);
  }
}
