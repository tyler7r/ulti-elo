import type { MergeDeep } from "type-fest";
import type { Database as GeneratedDatabase } from "./generated_types";

export type GameType = {
  id: string;
  team_id: string;
  match_date: string;
  squad_a_score: number;
  squad_b_score: number;
  squad_a_id: string;
  squad_b_id: string;
  game_weight: string;
  session_id: string;
};

export type GamePlayerType = {
  elo_after: number;
  elo_before: number;
  game_id: string;
  is_winner: boolean;
  pt_id: string;
  squad_id: string;
  mu_before: number;
  sigma_before: number;
  wins_before: number;
  losses_before: number;
  win_streak_before: number;
  loss_streak_before: number;
  longest_win_streak_before: number;
  highest_elo_before: number;
  win_percent_before: number;
  elo_change_before: number;
  mu_after: number;
  sigma_after: number;
  wins_after: number;
  losses_after: number;
  win_streak_after: number;
  loss_streak_after: number;
  longest_win_streak_after: number;
  highest_elo_after: number;
  win_percent_after: number;
  elo_change_after: number;
};

export type PlayerType = {
  id: string;
  name: string;
};

export type NewPlayerType = {
  pt_id: string;
  player_id: string;
  team_id: string;
  name: string;
  win_streak: number;
  loss_streak: number;
  wins: number;
  losses: number;
  elo: number;
  elo_change: number;
  mu: number;
  sigma: number;
  win_percent: number;
  highest_elo: number;
  longest_win_streak: number;
  last_updated: string;
  teams?: TeamType;
};

export type PlayerRating = {
  pt_id: string;
  mu: number;
  sigma: number;
  elo: number;
  elo_change: number;
  highest_elo: number;
  wins: number;
  losses: number;
  win_streak: number;
  loss_streak: number;
  longest_win_streak: number;
  win_percent: number;
};

export type PlayerTeamType = {
  pt_id: string;
  player_id: string;
  team_id: string;
  elo: number;
  elo_change: number;
  mu: number;
  sigma: number;
  wins: number;
  losses: number;
  win_percent: number;
  win_streak: number;
  loss_streak: number;
  longest_win_streak: number;
  highest_elo: number;
  last_updated: string;
  player: {
    name: string;
  };
};

export type TeamType = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type PlayerTeamsType = {
  player: PlayerTeamType;
  team: TeamType;
};

export type GameFormSquadType = {
  id: string;
  name: string;
  players: Player[];
  score: number;
};

export interface SquadType {
  name: string;
  id: string;
  team_id: string;
}

export interface SquadTypeWithSession extends SquadType {
  session_id: string;
  session_round: number;
}

export type PlayerHistoryType = {
  pt_id: string;
  player_id: string;
  name: string;
  elo: number;
  elo_before: number;
  elo_after: number;
  win_streak: number;
  loss_streak: number;
  wins: number;
  losses: number;
  mu: number;
  sigma: number;
  win_percent: number;
  highest_elo: number;
  longest_win_streak: number;
};

export type GameHistoryType = {
  id: string;
  team_id: string;
  match_date: string;
  squad_a_score: number;
  squad_b_score: number;
  squad_a_id: string;
  squad_b_id: string;
  game_weight: string;
  session_id: string;
  session: {
    title: string;
  };
  team: TeamType;
  squadA: {
    info: SquadType;
    players: PlayerHistoryType[];
  };
  squadB: {
    info: SquadType;
    players: PlayerHistoryType[];
  };
};

export type AlertType = {
  message: string | null;
  severity: "info" | "success" | "error";
};

// Types for Retroactive Editing
export interface Player {
  pt_id: string;
  name: string;
  elo?: number;
}

export interface GamePlayerWithPlayer extends Player {
  is_winner?: boolean;
  elo_before?: number;
  elo_after?: number;
  player_id?: string;
}

export interface Squad {
  id: string;
  name: string;
  players: GamePlayerWithPlayer[];
}

export interface Game {
  id: string;
  match_date: string;
  team_id: string;
  squad_a_id: string;
  squad_b_id: string;
  squad_a_score: number;
  squad_b_score: number;
  game_weight: string;
  session_id: string;
}

export interface GameDetails {
  game: Game;
  squadA: Squad;
  squadB: Squad;
}

export type GameScheduleType = {
  id: string;
  squad_a_id: string;
  squad_b_id: string;
  status: string;
  squad_a_score: number;
  squad_b_score: number;
  created_at: string;
  updated_at: string;
  session_id: string;
  game_number: number;
  round_no: number;
};

export type GameScheduleInsertType = {
  id?: string;
  squad_a_id: string;
  squad_b_id: string;
  status: string;
  squad_a_score: number;
  squad_b_score: number;
  created_at?: string;
  updated_at?: string;
  session_id: string;
  game_number: number;
  round_no: number;
};

export type SessionType = {
  id: string;
  team_id: string;
  title: string;
  session_date: string;
  created_at: string;
  updated_at: string;
  active: boolean;
};

export interface PlayerTeam {
  player_id: string;
  players: Player;
}

// Add these within SessionPage.tsx or to your types file

export type SessionAttendeeWithStats = {
  id: string; // session_attendees table's own ID
  session_id: string;
  pt_id: string; // Foreign key to player_teams
  created_at: string;
  updated_at: string;

  rank_before: number;
  // Include joined player details (current info) for display
  player_teams: PlayerTeamType;
};

// Type for the result of: session_attendees(*, player_teams(*, players(*)))
export type FetchedSessionAttendee = {
  id: string;
  pt_id: string;
  session_id: string;
  player_teams: PlayerTeamType; // Supabase might return 'players' object
};

// Type for the result of: squad_players(*, player_teams(*, players(*)))
export type FetchedSquadPlayer = {
  pt_id: string;
  squad_id: string;
  player_teams: PlayerTeamType;
};

// Type for the result of: squads(*, squad_players(*, player_teams(*, players(*))))
export type SquadWithPlayerDetails = SquadType & {
  session_round: number;
  squad_players: FetchedSquadPlayer[];
};

// Type for the result of: game_schedule(*, squad_a:squad_a_id(*), squad_b:squad_b_id(*))
export type GameScheduleWithSquadDetails = GameScheduleType & {
  squad_a: SquadType | null;
  squad_b: SquadType | null;
};

export type GameScheduleWithPlayerDetails = GameScheduleType & {
  round_no: number;
  squad_a: SquadWithPlayerDetails;
  squad_b: SquadWithPlayerDetails;
};

// Type for the result of: games(*, squad_a:squad_a_id(*), squad_b:squad_b_id(*))
export type GameWithSquadDetails = GameType & {
  squad_a: SquadType | null;
  squad_b: SquadType | null;
};

export type Database = MergeDeep<
  GeneratedDatabase,
  {
    public: {
      Tables: {
        game_edits: {
          Row: {
            id: string;
            game_id: string;
            edited_at: string;
            edited_by_user_id: string;
            previous_game_data: GameType;
            previous_game_players_data: GamePlayerType[];
          };
        };
      };
    };
  }
>;
