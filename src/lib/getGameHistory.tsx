import { supabase } from "@/lib/supabase";
import { GameHistoryType } from "./types";

type FilterParam = {
  teamId?: string;
  squadId?: string;
  playerTeamIds?: string[];
  gameId?: string;
  page?: number;
  limit?: number;
};

export const getGameHistory = async ({
  teamId,
  squadId,
  playerTeamIds,
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
      game_weight,
      squadA: squads!games_squad_a_id_fkey(*), 
      squadB: squads!games_squad_b_id_fkey(*),
      team: teams!inner(*),
      game_players!inner(
        pt_id,
        squad_id,
        elo_before,
        elo_after,
        is_winner,
        player_teams (*, players(name))
      )
    `
    )
    .order("match_date", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (teamId) query = query.eq("team_id", teamId);
  if (squadId)
    query = query.or(`squad_a_id.eq.${squadId},squad_b_id.eq.${squadId}`);
  if (playerTeamIds && playerTeamIds.length > 0)
    query = query.in("game_players.pt_id", playerTeamIds);
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
    game_weight: game.game_weight,
    team: {
      id: game.team_id,
      name: game.team.name,
      logo_url: game.team.logo_url,
    },
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
          player_id: gp.player_teams.player_id,
          pt_id: gp.pt_id,
          name: gp.player_teams.players.name,
          elo: gp.player_teams.elo,
          elo_after: gp.elo_after,
          elo_before: gp.elo_before,
          win_streak: gp.player_teams.win_streak,
          loss_streak: gp.player_teams.loss_streak,
          wins: gp.player_teams.wins,
          losses: gp.player_teams.losses,
          mu: gp.player_teams.mu,
          sigma: gp.player_teams.sigma,
          win_percent: gp.player_teams.win_percent,
          highest_elo: gp.player_teams.highest_elo,
          longest_win_streak: gp.player_teams.longest_win_streak,
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
          player_id: gp.player_teams.player_id,
          pt_id: gp.pt_id,
          name: gp.player_teams.players.name,
          elo: gp.player_teams.elo,
          elo_after: gp.elo_after,
          elo_before: gp.elo_before,
          win_streak: gp.player_teams.win_streak,
          loss_streak: gp.player_teams.loss_streak,
          wins: gp.player_teams.wins,
          losses: gp.player_teams.losses,
          mu: gp.player_teams.mu,
          sigma: gp.player_teams.sigma,
          win_percent: gp.player_teams.win_percent,
          highest_elo: gp.player_teams.highest_elo,
          longest_win_streak: gp.player_teams.longest_win_streak,
        })),
    },
  }));

  return history;
};
