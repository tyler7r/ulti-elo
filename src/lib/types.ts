export type GameType = {
  id: string;
  team_id: string;
  match_date: string;
  squad_a_score: number;
  squad_b_score: number;
};

export type GamePlayerType = {
  game_id: string;
  player_id: string;
  squad: "A" | "B";
  is_winner: boolean;
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
