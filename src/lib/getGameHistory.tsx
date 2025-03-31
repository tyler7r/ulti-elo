import { supabase } from "@/lib/supabase";
import { GameHistoryType } from "./types";

type FilterParam = {
  teamId?: string;
  squadId?: string;
  playerId?: string;
  gameId?: string;
  page?: number;
  limit?: number;
};

export const getGameHistory = async ({
  teamId,
  squadId,
  playerId,
  gameId,
  page = 1,
  limit = 5,
}: FilterParam): Promise<GameHistoryType[]> => {
  const offset = (page - 1) * limit;
  let query = supabase
    .from("games")
    .select(
      `
      id,
      team_id,
      match_date,
      squad_a_id,
      squad_b_id,
      squad_a_score,
      squad_b_score,
      squadA: squads!games_squad_a_id_fkey(*), 
      squadB: squads!games_squad_b_id_fkey(*),
      game_players (
        player_id,
        squad_id,
        elo_before,
        elo_after,
        is_winner,
        players (*)
      )
    `
    )
    .order("match_date", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (teamId) query = query.eq("team_id", teamId);
  if (squadId)
    query = query.or(`squad_a_id.eq.${squadId},squad_b_id.eq.${squadId}`);
  if (playerId) query = query.eq("game_players.player_id", playerId);
  if (gameId) query = query.eq("id", gameId);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching game history:", error);
    return [];
  }

  // Map the result into GameHistoryType format
  const history: GameHistoryType[] = data.map((game) => ({
    id: game.id,
    team_id: game.team_id,
    match_date: game.match_date,
    squad_a_score: game.squad_a_score,
    squad_b_score: game.squad_b_score,
    squad_a_id: game.squad_a_id,
    squad_b_id: game.squad_b_id,
    squadA: {
      info: {
        id: game.squad_a_id,
        name: game.squadA.name,
        team_id: game.team_id,
        active: game.squadA.active,
      },
      players: game.game_players
        .filter((gp) => gp.squad_id === game.squad_a_id)
        .map((gp) => ({
          id: gp.players.id,
          name: gp.players.name,
          elo: gp.players.elo,
          elo_after: gp.elo_after,
          elo_before: gp.elo_before,
          win_streak: gp.players.win_streak,
          loss_streak: gp.players.loss_streak,
          wins: gp.players.wins,
          losses: gp.players.losses,
          mu: gp.players.mu,
          sigma: gp.players.sigma,
          win_percent: gp.players.win_percent,
          highest_elo: gp.players.highest_elo,
          longest_win_streak: gp.players.longest_win_streak,
        })),
    },
    squadB: {
      info: {
        id: game.squad_b_id,
        name: game.squadB.name,
        team_id: game.team_id,
        active: game.squadB.active,
      },
      players: game.game_players
        .filter((gp) => gp.squad_id === game.squad_b_id)
        .map((gp) => ({
          id: gp.players.id,
          name: gp.players.name,
          elo: gp.players.elo,
          elo_after: gp.elo_after,
          elo_before: gp.elo_before,
          win_streak: gp.players.win_streak,
          loss_streak: gp.players.loss_streak,
          wins: gp.players.wins,
          losses: gp.players.losses,
          mu: gp.players.mu,
          sigma: gp.players.sigma,
          win_percent: gp.players.win_percent,
          highest_elo: gp.players.highest_elo,
          longest_win_streak: gp.players.longest_win_streak,
        })),
    },
  }));

  return history;
};
