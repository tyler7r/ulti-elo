export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_requests: {
        Row: {
          created_at: string;
          status: string;
          team_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          status?: string;
          team_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          status?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_requests_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      favorite_players: {
        Row: {
          favorite_id: string;
          player_id: string;
          user_id: string;
        };
        Insert: {
          favorite_id?: string;
          player_id: string;
          user_id: string;
        };
        Update: {
          favorite_id?: string;
          player_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorite_players_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorite_players_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      favorite_teams: {
        Row: {
          favorite_id: string;
          team_id: string;
          user_id: string;
        };
        Insert: {
          favorite_id?: string;
          team_id: string;
          user_id?: string;
        };
        Update: {
          favorite_id?: string;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorite_teams_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorite_teams_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      game_edits: {
        Row: {
          edited_at: string;
          edited_by_user_id: string;
          game_id: string;
          id: string;
          previous_game_data: Json | null;
          previous_game_players_data: Json[] | null;
        };
        Insert: {
          edited_at?: string;
          edited_by_user_id: string;
          game_id: string;
          id?: string;
          previous_game_data?: Json | null;
          previous_game_players_data?: Json[] | null;
        };
        Update: {
          edited_at?: string;
          edited_by_user_id?: string;
          game_id?: string;
          id?: string;
          previous_game_data?: Json | null;
          previous_game_players_data?: Json[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_edits_edited_by_user_id_fkey";
            columns: ["edited_by_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_edits_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          }
        ];
      };
      game_players: {
        Row: {
          elo_after: number;
          elo_before: number;
          elo_change_after: number;
          elo_change_before: number;
          game_id: string;
          highest_elo_after: number;
          highest_elo_before: number;
          is_winner: boolean;
          longest_win_streak_after: number;
          longest_win_streak_before: number;
          loss_streak_after: number;
          loss_streak_before: number;
          losses_after: number;
          losses_before: number;
          mu_after: number;
          mu_before: number;
          pt_id: string;
          sigma_after: number;
          sigma_before: number;
          squad_id: string;
          win_percent_after: number;
          win_percent_before: number;
          win_streak_after: number;
          win_streak_before: number;
          wins_after: number;
          wins_before: number;
        };
        Insert: {
          elo_after?: number;
          elo_before?: number;
          elo_change_after?: number;
          elo_change_before?: number;
          game_id?: string;
          highest_elo_after?: number;
          highest_elo_before?: number;
          is_winner?: boolean;
          longest_win_streak_after?: number;
          longest_win_streak_before?: number;
          loss_streak_after?: number;
          loss_streak_before?: number;
          losses_after?: number;
          losses_before?: number;
          mu_after?: number;
          mu_before?: number;
          pt_id?: string;
          sigma_after?: number;
          sigma_before?: number;
          squad_id: string;
          win_percent_after?: number;
          win_percent_before?: number;
          win_streak_after?: number;
          win_streak_before?: number;
          wins_after?: number;
          wins_before?: number;
        };
        Update: {
          elo_after?: number;
          elo_before?: number;
          elo_change_after?: number;
          elo_change_before?: number;
          game_id?: string;
          highest_elo_after?: number;
          highest_elo_before?: number;
          is_winner?: boolean;
          longest_win_streak_after?: number;
          longest_win_streak_before?: number;
          loss_streak_after?: number;
          loss_streak_before?: number;
          losses_after?: number;
          losses_before?: number;
          mu_after?: number;
          mu_before?: number;
          pt_id?: string;
          sigma_after?: number;
          sigma_before?: number;
          squad_id?: string;
          win_percent_after?: number;
          win_percent_before?: number;
          win_streak_after?: number;
          win_streak_before?: number;
          wins_after?: number;
          wins_before?: number;
        };
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_players_player_id_fkey";
            columns: ["pt_id"];
            isOneToOne: false;
            referencedRelation: "player_teams";
            referencedColumns: ["pt_id"];
          },
          {
            foreignKeyName: "game_players_squad_id_fkey";
            columns: ["squad_id"];
            isOneToOne: false;
            referencedRelation: "squads";
            referencedColumns: ["id"];
          }
        ];
      };
      game_schedule: {
        Row: {
          created_at: string;
          game_id: string | null;
          game_number: number;
          id: string;
          round_no: number;
          session_id: string;
          squad_a_id: string;
          squad_a_score: number;
          squad_b_id: string;
          squad_b_score: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          game_id?: string | null;
          game_number?: number;
          id?: string;
          round_no?: number;
          session_id: string;
          squad_a_id: string;
          squad_a_score?: number;
          squad_b_id: string;
          squad_b_score?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          game_id?: string | null;
          game_number?: number;
          id?: string;
          round_no?: number;
          session_id?: string;
          squad_a_id?: string;
          squad_a_score?: number;
          squad_b_id?: string;
          squad_b_score?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_schedule_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_schedule_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_schedule_squad_a_id_fkey";
            columns: ["squad_a_id"];
            isOneToOne: false;
            referencedRelation: "squads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_schedule_squad_b_id_fkey";
            columns: ["squad_b_id"];
            isOneToOne: false;
            referencedRelation: "squads";
            referencedColumns: ["id"];
          }
        ];
      };
      games: {
        Row: {
          game_weight: string;
          id: string;
          match_date: string;
          session_id: string;
          squad_a_id: string;
          squad_a_score: number;
          squad_b_id: string;
          squad_b_score: number;
          team_id: string;
        };
        Insert: {
          game_weight?: string;
          id?: string;
          match_date?: string;
          session_id: string;
          squad_a_id?: string;
          squad_a_score?: number;
          squad_b_id?: string;
          squad_b_score?: number;
          team_id: string;
        };
        Update: {
          game_weight?: string;
          id?: string;
          match_date?: string;
          session_id?: string;
          squad_a_id?: string;
          squad_a_score?: number;
          squad_b_id?: string;
          squad_b_score?: number;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "games_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_squad_a_id_fkey";
            columns: ["squad_a_id"];
            isOneToOne: false;
            referencedRelation: "squads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_squad_b_id_fkey";
            columns: ["squad_b_id"];
            isOneToOne: false;
            referencedRelation: "squads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      player_awards: {
        Row: {
          award_type: Database["public"]["Enums"]["season_award_type"];
          award_value: number;
          awarded_at: string;
          id: string;
          player_id: string;
          pt_id: string;
          season_id: string;
          team_id: string;
        };
        Insert: {
          award_type: Database["public"]["Enums"]["season_award_type"];
          award_value: number;
          awarded_at?: string;
          id?: string;
          player_id: string;
          pt_id: string;
          season_id: string;
          team_id: string;
        };
        Update: {
          award_type?: Database["public"]["Enums"]["season_award_type"];
          award_value?: number;
          awarded_at?: string;
          id?: string;
          player_id?: string;
          pt_id?: string;
          season_id?: string;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_awards_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_awards_pt_id_fkey";
            columns: ["pt_id"];
            isOneToOne: false;
            referencedRelation: "player_teams";
            referencedColumns: ["pt_id"];
          },
          {
            foreignKeyName: "player_awards_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_awards_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      player_team_season_stats: {
        Row: {
          archived_at: string;
          final_elo: number;
          final_mu: number;
          final_sigma: number;
          id: string;
          player_id: string;
          pt_id: string;
          season_games_played: number;
          season_highest_elo: number;
          season_id: string;
          season_longest_win_streak: number;
          season_losses: number;
          season_win_percent: number | null;
          season_wins: number;
          team_id: string;
        };
        Insert: {
          archived_at?: string;
          final_elo: number;
          final_mu: number;
          final_sigma: number;
          id?: string;
          player_id: string;
          pt_id: string;
          season_games_played?: number;
          season_highest_elo?: number;
          season_id: string;
          season_longest_win_streak?: number;
          season_losses?: number;
          season_win_percent?: number | null;
          season_wins?: number;
          team_id: string;
        };
        Update: {
          archived_at?: string;
          final_elo?: number;
          final_mu?: number;
          final_sigma?: number;
          id?: string;
          player_id?: string;
          pt_id?: string;
          season_games_played?: number;
          season_highest_elo?: number;
          season_id?: string;
          season_longest_win_streak?: number;
          season_losses?: number;
          season_win_percent?: number | null;
          season_wins?: number;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_team_season_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_team_season_stats_pt_id_fkey";
            columns: ["pt_id"];
            isOneToOne: false;
            referencedRelation: "player_teams";
            referencedColumns: ["pt_id"];
          },
          {
            foreignKeyName: "player_team_season_stats_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_team_season_stats_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      player_teams: {
        Row: {
          elo: number;
          elo_change: number;
          highest_elo: number;
          last_updated: string;
          longest_win_streak: number;
          loss_streak: number;
          losses: number;
          mu: number;
          player_id: string;
          pt_id: string;
          sigma: number;
          team_id: string;
          win_percent: number;
          win_streak: number;
          wins: number;
        };
        Insert: {
          elo?: number;
          elo_change?: number;
          highest_elo?: number;
          last_updated?: string;
          longest_win_streak?: number;
          loss_streak?: number;
          losses?: number;
          mu?: number;
          player_id: string;
          pt_id?: string;
          sigma?: number;
          team_id: string;
          win_percent?: number;
          win_streak?: number;
          wins?: number;
        };
        Update: {
          elo?: number;
          elo_change?: number;
          highest_elo?: number;
          last_updated?: string;
          longest_win_streak?: number;
          loss_streak?: number;
          losses?: number;
          mu?: number;
          player_id?: string;
          pt_id?: string;
          sigma?: number;
          team_id?: string;
          win_percent?: number;
          win_streak?: number;
          wins?: number;
        };
        Relationships: [
          {
            foreignKeyName: "team_memberships_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_memberships_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      players: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      seasons: {
        Row: {
          active: boolean;
          created_at: string;
          end_date: string | null;
          id: string;
          season_no: number;
          start_date: string;
          team_id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          end_date?: string | null;
          id?: string;
          season_no?: number;
          start_date?: string;
          team_id: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          end_date?: string | null;
          id?: string;
          season_no?: number;
          start_date?: string;
          team_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seasons_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      session_attendees: {
        Row: {
          created_at: string;
          elo_before: number;
          id: string;
          losses_before: number;
          mu_before: number;
          pt_id: string;
          rank_before: number;
          session_id: string;
          sigma_before: number;
          updated_at: string;
          wins_before: number;
        };
        Insert: {
          created_at?: string;
          elo_before?: number;
          id?: string;
          losses_before?: number;
          mu_before?: number;
          pt_id: string;
          rank_before?: number;
          session_id: string;
          sigma_before?: number;
          updated_at?: string;
          wins_before?: number;
        };
        Update: {
          created_at?: string;
          elo_before?: number;
          id?: string;
          losses_before?: number;
          mu_before?: number;
          pt_id?: string;
          rank_before?: number;
          session_id?: string;
          sigma_before?: number;
          updated_at?: string;
          wins_before?: number;
        };
        Relationships: [
          {
            foreignKeyName: "session_attendees_pt_id_fkey";
            columns: ["pt_id"];
            isOneToOne: false;
            referencedRelation: "player_teams";
            referencedColumns: ["pt_id"];
          },
          {
            foreignKeyName: "session_attendees_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      sessions: {
        Row: {
          active: boolean;
          created_at: string;
          id: string;
          season_id: string | null;
          session_date: string;
          team_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          id?: string;
          season_id?: string | null;
          session_date?: string;
          team_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          id?: string;
          season_id?: string | null;
          session_date?: string;
          team_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      squad_players: {
        Row: {
          active: boolean;
          pt_id: string;
          squad_id: string;
        };
        Insert: {
          active?: boolean;
          pt_id?: string;
          squad_id?: string;
        };
        Update: {
          active?: boolean;
          pt_id?: string;
          squad_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "squad_players_player_id_fkey";
            columns: ["pt_id"];
            isOneToOne: false;
            referencedRelation: "player_teams";
            referencedColumns: ["pt_id"];
          },
          {
            foreignKeyName: "squad_players_squad_id_fkey";
            columns: ["squad_id"];
            isOneToOne: false;
            referencedRelation: "squads";
            referencedColumns: ["id"];
          }
        ];
      };
      squads: {
        Row: {
          id: string;
          name: string;
          session_id: string;
          session_round: number;
          team_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          session_id: string;
          session_round?: number;
          team_id?: string;
        };
        Update: {
          id?: string;
          name?: string;
          session_id?: string;
          session_round?: number;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "squads_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "squads_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      team_admins: {
        Row: {
          created_at: string | null;
          id: string;
          is_owner: boolean | null;
          team_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_owner?: boolean | null;
          team_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_owner?: boolean | null;
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_admins_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_admins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string;
        };
        Insert: {
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id: string;
        };
        Update: {
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          name: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_decompress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_options: {
        Args: { "": unknown };
        Returns: undefined;
      };
      gtrgm_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      set_limit: {
        Args: { "": number };
        Returns: number;
      };
      show_limit: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      show_trgm: {
        Args: { "": string };
        Returns: string[];
      };
    };
    Enums: {
      season_award_type:
        | "highest_elo_1st"
        | "highest_elo_2nd"
        | "highest_elo_3rd"
        | "most_wins"
        | "longest_win_streak";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      season_award_type: [
        "highest_elo_1st",
        "highest_elo_2nd",
        "highest_elo_3rd",
        "most_wins",
        "longest_win_streak",
      ],
    },
  },
} as const;
