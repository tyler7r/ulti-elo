export type GameType = {
  id: string;
  team_id: string;
  match_date: string;
  squad_a_score: number;
  squad_b_score: number;
  squad_a_id: string;
  squad_b_id: string;
  // squad_a_gameNo: number;
  // squad_b_gameNo: number;
};

export type GamePlayerType = {
  elo_after: number;
  elo_before: number;
  game_id: string;
  is_winner: boolean;
  player_id: string;
  squad: string;
  squad_id: string;
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

export type SquadType = {
  name: string;
  id: string;
  team_id: string;
  active: boolean;
  games_played: number;
};

export type SquadHistoryType = {
  squad: SquadType;
  players: PlayerGameHistoryType[];
};

export type PlayerGameHistoryType = {
  elo_before: number;
  elo_after: number;
  player: PlayerType;
};

export type GameHistoryType = {
  id: string;
  team_id: string;
  match_date: string;
  squad_a_score: number;
  squad_b_score: number;
  squadA: SquadHistoryType;
  squadB: SquadHistoryType;
};

export type GameFormSquadType = {
  id: string;
  name: string;
  players: { id: string; name: string; elo: number }[];
  score: number;
};
