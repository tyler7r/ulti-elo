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
  game_weight: string;
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
const HEAVY_WEIGHT = 1.25;
const LIGHT_WEIGHT = 0.75;

export async function recalculateElo2(
  editedGameId: string,
  gameEditId: string | null, // Allow null for gameEditId
  teamId: string
) {
  try {
    // Fetch all games for the team, ordered by match date
    const { data: allGames, error: fetchAllGamesError } = await supabase
      .from("games")
      .select(
        "id, match_date, squad_a_id, squad_b_id, squad_a_score, squad_b_score, game_weight"
      )
      .eq("team_id", teamId)
      .order("match_date");

    if (fetchAllGamesError) throw fetchAllGamesError;

    // Find the index of the starting game for recalculation
    const startIndex = allGames.findIndex((game) => game.id === editedGameId);
    const editedGame = allGames[startIndex];

    if (startIndex === -1) {
      console.warn(
        `Starting game with ID ${editedGameId} not found for recalculation.`
      );
      return;
    }

    const gamesToRecalculate = allGames.slice(startIndex);

    const playerStatsBeforeRecalculation: CurrentPlayerStats = new Map();

    if (gameEditId) {
      // Fetch the edit history for the edited game
      const { data: gameEditResponse, error: fetchGameEditError } =
        await supabase
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

      const currentGamePlayersForEditedGame = await supabase
        .from("game_players")
        .select("*")
        .eq("game_id", editedGameId);
      const currentPlayersInEditedGame =
        currentGamePlayersForEditedGame.data?.map((gp) => gp.pt_id) || [];
      const originalPlayers =
        gameEdit?.previous_game_players_data?.map((gp) => gp.pt_id) || [];
      const removedPlayers = originalPlayers.filter(
        (playerId) => !currentPlayersInEditedGame.includes(playerId)
      );

      for (const removedPlayerId of removedPlayers) {
        const beforeData = gameEdit?.previous_game_players_data?.find(
          (gp) => gp.pt_id === removedPlayerId
        );
        if (beforeData) {
          const { error: updatePlayerError } = await supabase
            .from("player_teams")
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
            .eq("pt_id", removedPlayerId);
          if (updatePlayerError) {
            console.error("Error reverting player stats:", updatePlayerError);
          }
        }
      }

      // Fetch the state of players before the edited game
      const previousGamePlayersData =
        gameEdit?.previous_game_players_data || [];
      previousGamePlayersData.forEach((playerData) => {
        playerStatsBeforeRecalculation.set(playerData.pt_id, {
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
    } else {
      // If gameEditId is null (triggered by deletion), we need to get the player stats as they were *after* the game *before* the one at `startIndex`.
      const {
        data: previousGamePlayers,
        error: fetchPreviousGamePlayersError,
      } = await supabase
        .from("game_players")
        .select("*")
        .eq("game_id", editedGame.id);

      if (fetchPreviousGamePlayersError) {
        console.error(
          "Error fetching game players for the previous game:",
          fetchPreviousGamePlayersError
        );
        return;
      }

      previousGamePlayers.forEach((playerData) => {
        playerStatsBeforeRecalculation.set(playerData.pt_id, {
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

      const updates = previousGamePlayers.map(async (gp) => {
        const { error: updatePlayerTeamsError } = await supabase
          .from("player_teams")
          .update({
            mu: gp.mu_before,
            sigma: gp.sigma_before,
            elo: gp.elo_before,
            elo_change: gp.elo_change_before,
            highest_elo: gp.highest_elo_before,
            wins: gp.wins_before,
            losses: gp.losses_before,
            win_streak: gp.win_streak_before,
            loss_streak: gp.loss_streak_before,
            win_percent: gp.win_percent_before,
            longest_win_streak: gp.longest_win_streak_before,
          })
          .eq("pt_id", gp.pt_id); // gp.player_id now references player_teams.id
        if (updatePlayerTeamsError) {
          console.error(
            `Error updating player_teams for ID ${gp.pt_id}:`,
            updatePlayerTeamsError
          );
          throw new Error("Failed to restore player stats");
        }
      });
      await Promise.all(updates);

      // 4. Delete the game record from the games table
      const { error: deleteGameError } = await supabase
        .from("games")
        .delete()
        .eq("id", editedGame.id);

      if (deleteGameError) {
        console.error("Error deleting game:", deleteGameError);
      }

      // 5. Delete the game_players records associated with the game
      const { error: deleteGamePlayers } = await supabase
        .from("game_players")
        .delete()
        .eq("game_id", editedGame.id);

      if (deleteGamePlayers) {
        console.error("Error deleting game players:", deleteGamePlayers);
      }
    }

    const getAddedPlayerStatsBeforeGame = async (playerId: string) => {
      const { data: subsequentGamePlayer, error: fetchSubsequentGameError } =
        await supabase
          .from("game_players")
          .select(`*, games!inner(*)`)
          .eq("pt_id", playerId)
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
            .from("player_teams")
            .select("*")
            .eq("pt_id", playerId)
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

    const getPlayerStatsBeforeGame = (gameId: string, playerId: string) => {
      if (gameId === editedGameId) {
        const statsBefore = playerStatsBeforeRecalculation.get(playerId);

        if (statsBefore) {
          return statsBefore;
        }
      }
      const currentStats = processingPlayerStats.get(playerId);
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

    const updatePlayerStats = (
      playerId: string,
      newMu: number,
      newSigma: number,
      newElo: number,
      newEloChange: number,
      newHighestElo: number,
      wins: number,
      losses: number,
      winStreak: number,
      lossStreak: number,
      longestWinStreak: number,
      isWinner: boolean
    ) => {
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

      processingPlayerStats.set(playerId, {
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

      return {
        winPercent: newWinPercent,
        winStreak: newWinStreak,
        lossStreak: newLossStreak,
        longestWinStreak: newLongestStreak,
        wins: newWins,
        losses: newLosses,
      };
    };

    // Recalculate ELO for the edited game and all subsequent games
    const processingPlayerStats = new Map(playerStatsBeforeRecalculation);

    for (const game of gamesToRecalculate) {
      if (gameEditId === null && game.id === editedGameId) continue;
      let gameWeight = 1; // Default weight if game_type is not specified or recognized

      if (game.game_weight === "competitive") {
        gameWeight = HEAVY_WEIGHT;
      } else if (game.game_weight === "casual") {
        gameWeight = LIGHT_WEIGHT;
      }

      const playersUpdates: {
        player_id: string;
        pt_id: string;
        team_id: string;
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
      }[] = [];
      const gamePlayersUpdates: {
        pt_id: string;
        game_id: string;
        squad_id: string;
        is_winner: boolean;
        elo_before: number;
        elo_after: number;
        mu_before: number;
        sigma_before: number;
        wins_before: number;
        losses_before: number;
        win_streak_before: number;
        win_percent_before: number;
        loss_streak_before: number;
        longest_win_streak_before: number;
        elo_change_before: number;
        mu_after: number;
        sigma_after: number;
        wins_after: number;
        losses_after: number;
        win_streak_after: number;
        win_percent_after: number;
        loss_streak_after: number;
        longest_win_streak_after: number;
        elo_change_after: number;
        highest_elo_after: number;
      }[] = [];

      const { data: squadAGamePlayers, error: fetchSquadAError } =
        await supabase
          .from("game_players")
          .select("*, player_teams!inner(players(name, id))")
          .eq("game_id", game.id)
          .eq("squad_id", game.squad_a_id);
      if (fetchSquadAError) throw fetchSquadAError;

      const { data: squadBGamePlayers, error: fetchSquadBError } =
        await supabase
          .from("game_players")
          .select(`*, player_teams!inner(players(name, id))`)
          .eq("game_id", game.id)
          .eq("squad_id", game.squad_b_id);
      if (fetchSquadBError) throw fetchSquadBError;

      const team1Players =
        (await Promise.all(
          squadAGamePlayers?.map(async (sp) => {
            const playerHasCurrentStats = processingPlayerStats.get(sp.pt_id);

            if (playerHasCurrentStats) {
              return {
                player_id: sp.player_teams.players.id,
                pt_id: sp.pt_id,
                name: sp.player_teams.players.name,
                squad_id: sp.squad_id,
                ...playerHasCurrentStats,
              };
            } else {
              // Player was likely added retroactively, check for subsequent games
              const addedPlayerStats = await getAddedPlayerStatsBeforeGame(
                sp.pt_id
              );
              processingPlayerStats.set(sp.pt_id, addedPlayerStats);
              return {
                player_id: sp.player_teams.players.id,
                pt_id: sp.pt_id,
                name: sp.player_teams.players.name,
                squad_id: sp.squad_id,
                ...addedPlayerStats,
              };
            }
          })
        )) || [];

      const team2Players =
        (await Promise.all(
          squadBGamePlayers?.map(async (sp) => {
            const playerHasCurrentStats = processingPlayerStats.get(sp.pt_id);

            if (playerHasCurrentStats) {
              return {
                player_id: sp.player_teams.players.id,
                pt_id: sp.pt_id,
                name: sp.player_teams.players.name,
                squad_id: sp.squad_id,
                ...playerHasCurrentStats,
              };
            } else {
              const addedPlayerStats = await getAddedPlayerStatsBeforeGame(
                sp.pt_id
              );
              processingPlayerStats.set(sp.pt_id, addedPlayerStats);
              return {
                player_id: sp.player_teams.players.id,
                pt_id: sp.pt_id,
                name: sp.player_teams.players.name,
                squad_id: sp.squad_id,
                ...addedPlayerStats,
              };
            }
          })
        )) || [];

      const teamASize = team1Players.length;
      const teamBSize = team2Players.length;

      const augmentedTeamA: Rating[] = team1Players.map(
        (p) =>
          new Rating(
            getPlayerStatsBeforeGame(game.id, p.pt_id)?.mu ?? p.mu,
            getPlayerStatsBeforeGame(game.id, p.pt_id)?.sigma ?? p.sigma
          )
      );
      const augmentedTeamB: Rating[] = team2Players.map(
        (p) =>
          new Rating(
            getPlayerStatsBeforeGame(game.id, p.pt_id)?.mu ?? p.mu,
            getPlayerStatsBeforeGame(game.id, p.pt_id)?.sigma ?? p.sigma
          )
      );

      if (teamASize < teamBSize) {
        const avgMuA =
          team1Players.reduce((sum, p) => sum + p.mu, 0) / teamASize || 15;
        const avgSigmaA =
          team1Players.reduce((sum, p) => sum + p.sigma, 0) / teamASize || 4;
        const diff = teamBSize - teamASize;
        for (let i = 0; i < diff; i++) {
          augmentedTeamA.push(new Rating(avgMuA, avgSigmaA));
        }
      } else if (teamBSize < teamASize) {
        const avgMuB =
          team2Players.reduce((sum, p) => sum + p.mu, 0) / teamBSize || 15;
        const avgSigmaB =
          team2Players.reduce((sum, p) => sum + p.sigma, 0) / teamBSize || 4;
        const diff = teamASize - teamBSize;
        for (let i = 0; i < diff; i++) {
          augmentedTeamB.push(new Rating(avgMuB, avgSigmaB));
        }
      }

      const ranks: number[] =
        game.squad_a_score > game.squad_b_score ? [0, 1] : [1, 0];

      const newRatings: Rating[][] = rate(
        [augmentedTeamA, augmentedTeamB],
        ranks
      );

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
          if (index < team1Players.length) {
            const newMu = rating.mu;
            const newSigma = rating.sigma;
            const baseEloChange = (newMu - team1Players[index].mu) * 100;

            const isWinner = game.squad_a_score > game.squad_b_score;

            const eloChange = Math.round(
              (isWinner
                ? baseEloChange * scoreInfluence * underdogInfluence
                : (baseEloChange * scoreInfluence) / underdogInfluence) *
                gameWeight
            );

            const newElo = team1Players[index].elo + eloChange;
            const newHighElo = Math.max(
              newElo,
              team1Players[index].highest_elo
            );
            const newPlayerStats = updatePlayerStats(
              team1Players[index].pt_id,
              newMu,
              newSigma,
              newElo,
              eloChange,
              newHighElo,
              team1Players[index].wins,
              team1Players[index].losses,
              team1Players[index].win_streak,
              team1Players[index].loss_streak,
              team1Players[index].longest_win_streak,
              isWinner
            );
            playersUpdates.push({
              pt_id: team1Players[index].pt_id,
              player_id: team1Players[index].player_id,
              team_id: teamId,
              mu: newMu,
              sigma: newSigma,
              elo: newElo,
              elo_change: eloChange,
              highest_elo: newHighElo,
              wins: newPlayerStats.wins,
              loss_streak: newPlayerStats.lossStreak,
              win_streak: newPlayerStats.winStreak,
              losses: newPlayerStats.losses,
              longest_win_streak: newPlayerStats.longestWinStreak,
              win_percent: newPlayerStats.winPercent,
            });
            gamePlayersUpdates.push({
              pt_id: team1Players[index].pt_id,
              game_id: game.id,
              squad_id: team1Players[index].squad_id,
              is_winner: isWinner,
              elo_before: team1Players[index].elo,
              elo_after: newElo,
              mu_before: team1Players[index].mu,
              sigma_before: team1Players[index].sigma,
              wins_before: team1Players[index].wins,
              losses_before: team1Players[index].losses,
              win_streak_before: team1Players[index].win_streak,
              win_percent_before: team1Players[index].win_percent,
              loss_streak_before: team1Players[index].loss_streak,
              longest_win_streak_before: team1Players[index].longest_win_streak,
              elo_change_before: team1Players[index].elo_change,
              mu_after: newMu,
              sigma_after: newSigma,
              wins_after: newPlayerStats.wins,
              losses_after: newPlayerStats.losses,
              win_streak_after: newPlayerStats.winStreak,
              win_percent_after: newPlayerStats.winPercent,
              loss_streak_after: newPlayerStats.lossStreak,
              longest_win_streak_after: newPlayerStats.longestWinStreak,
              elo_change_after: eloChange,
              highest_elo_after: newHighElo,
            });
          }
        });
        newRatings[1].forEach((rating, index) => {
          if (index < team2Players.length) {
            const newMu = rating.mu;
            const newSigma = rating.sigma;
            const baseEloChange = (newMu - team2Players[index].mu) * 100;

            const isWinner = game.squad_a_score < game.squad_b_score;

            const eloChange = Math.round(
              (isWinner
                ? baseEloChange * scoreInfluence * underdogInfluence
                : (baseEloChange * scoreInfluence) / underdogInfluence) *
                gameWeight
            );

            const newElo = team2Players[index].elo + eloChange;
            const newHighElo = Math.max(
              newElo,
              team2Players[index].highest_elo
            );
            const newPlayerStats = updatePlayerStats(
              team2Players[index].pt_id,
              newMu,
              newSigma,
              newElo,
              eloChange,
              newHighElo,
              team2Players[index].wins,
              team2Players[index].losses,
              team2Players[index].win_streak,
              team2Players[index].loss_streak,
              team2Players[index].longest_win_streak,
              isWinner
            );
            playersUpdates.push({
              pt_id: team2Players[index].pt_id,
              player_id: team2Players[index].player_id,
              team_id: teamId,
              mu: newMu,
              sigma: newSigma,
              elo: newElo,
              elo_change: eloChange,
              highest_elo: newHighElo,
              wins: newPlayerStats.wins,
              loss_streak: newPlayerStats.lossStreak,
              win_streak: newPlayerStats.winStreak,
              losses: newPlayerStats.losses,
              longest_win_streak: newPlayerStats.longestWinStreak,
              win_percent: newPlayerStats.winPercent,
            });
            gamePlayersUpdates.push({
              pt_id: team2Players[index].pt_id,
              game_id: game.id,
              squad_id: team2Players[index].squad_id,
              is_winner: isWinner,
              elo_before: team2Players[index].elo,
              elo_after: newElo,
              mu_before: team2Players[index].mu,
              sigma_before: team2Players[index].sigma,
              wins_before: team2Players[index].wins,
              losses_before: team2Players[index].losses,
              win_streak_before: team2Players[index].win_streak,
              win_percent_before: team2Players[index].win_percent,
              loss_streak_before: team2Players[index].loss_streak,
              longest_win_streak_before: team2Players[index].longest_win_streak,
              elo_change_before: team2Players[index].elo_change,
              mu_after: newMu,
              sigma_after: newSigma,
              wins_after: newPlayerStats.wins,
              losses_after: newPlayerStats.losses,
              win_streak_after: newPlayerStats.winStreak,
              win_percent_after: newPlayerStats.winPercent,
              loss_streak_after: newPlayerStats.lossStreak,
              longest_win_streak_after: newPlayerStats.longestWinStreak,
              elo_change_after: eloChange,
              highest_elo_after: newHighElo,
            });
          }
        });
      }
      if (playersUpdates.length > 0) {
        const { error: playersBatchError } = await supabase
          .from("player_teams")
          .upsert(playersUpdates);
        if (playersBatchError) console.error("Batch Players Update Error");
      }
      if (gamePlayersUpdates.length > 0) {
        const { error: gamePlayersBatchError } = await supabase
          .from("game_players")
          .upsert(gamePlayersUpdates);
        if (gamePlayersBatchError)
          console.error("Batch Game Players Update Error");
      }
      // Update processingPlayerStats for the next game
      gamePlayersUpdates.forEach((gpu) => {
        processingPlayerStats.set(gpu.pt_id, {
          mu: gpu.mu_after,
          sigma: gpu.sigma_after,
          elo: gpu.elo_after,
          wins: gpu.wins_after,
          losses: gpu.losses_after,
          win_streak: gpu.win_streak_after,
          loss_streak: gpu.loss_streak_after,
          longest_win_streak: gpu.longest_win_streak_after,
          highest_elo: gpu.highest_elo_after,
          win_percent: gpu.win_percent_after,
          elo_change: gpu.elo_change_after,
        });
      });
    }
  } catch (error) {
    console.error("Error recalculating ELO:", error);
  }
}
