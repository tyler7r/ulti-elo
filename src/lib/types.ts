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
};

export type GamePlayerType = {
  elo_after: number;
  elo_before: number;
  game_id: string;
  is_winner: boolean;
  player_id: string;
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
};

export type PlayerType = {
  id: string;
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
};

export type PlayerRating = {
  player_id: string;
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

export type PlayerStatsType = {
  newWinStreak: number;
  newLossStreak: number;
  wins: number;
  losses: number;
  newWinPercent: number;
  newLongestStreak: number;
};

export type PlayerTeamType = {
  player_id: string;
  team_id: string;
  elo: number;
  elo_change: number;
  mu: number;
  sigma: number;
};

export type TeamType = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type PlayerSelectType = {
  player_id: string;
  players: PlayerType;
};

export type PlayerEloType = {
  id: string;
  name: string;
  elo: number;
};

export type SquadPlayersType = {
  squads: {
    id: string;
    name: string;
    active: boolean;
  };
  players: {
    id: string;
    name: string;
  };
};

export type GameFormSquadType = {
  id: string;
  name: string;
  players: Player[];
  score: number;
};

export type SquadType = {
  name: string;
  id: string;
  team_id: string;
  active: boolean;
};

export type PlayerHistoryType = {
  id: string;
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
  id: string;
  name: string;
  elo?: number;
}

export interface GamePlayerWithPlayer extends Player {
  is_winner?: boolean;
  elo_before?: number;
  elo_after?: number;
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
}

// export interface GameDetails {
//   game: Game;
//   squadA: Squad & { players: SquadPlayerWithPlayer[] };
//   squadB: Squad & { players: SquadPlayerWithPlayer[] };
// }

export interface GameDetails {
  game: Game;
  squadA: Squad;
  squadB: Squad;
}

export interface PlayerTeam {
  player_id: string;
  players: Player;
}

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
