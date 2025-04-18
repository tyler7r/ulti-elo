export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_requests: {
        Row: {
          created_at: string
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_edits: {
        Row: {
          edited_at: string
          edited_by_user_id: string
          game_id: string
          id: string
          previous_game_data: Json | null
          previous_game_players_data: Json[] | null
        }
        Insert: {
          edited_at?: string
          edited_by_user_id: string
          game_id: string
          id?: string
          previous_game_data?: Json | null
          previous_game_players_data?: Json[] | null
        }
        Update: {
          edited_at?: string
          edited_by_user_id?: string
          game_id?: string
          id?: string
          previous_game_data?: Json | null
          previous_game_players_data?: Json[] | null
        }
        Relationships: [
          {
            foreignKeyName: "game_edits_edited_by_user_id_fkey"
            columns: ["edited_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_edits_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          elo_after: number
          elo_before: number
          elo_change_after: number
          elo_change_before: number
          game_id: string
          highest_elo_after: number
          highest_elo_before: number
          is_winner: boolean
          longest_win_streak_after: number
          longest_win_streak_before: number
          loss_streak_after: number
          loss_streak_before: number
          losses_after: number
          losses_before: number
          mu_after: number
          mu_before: number
          pt_id: string
          sigma_after: number
          sigma_before: number
          squad_id: string
          win_percent_after: number
          win_percent_before: number
          win_streak_after: number
          win_streak_before: number
          wins_after: number
          wins_before: number
        }
        Insert: {
          elo_after?: number
          elo_before?: number
          elo_change_after?: number
          elo_change_before?: number
          game_id?: string
          highest_elo_after?: number
          highest_elo_before?: number
          is_winner?: boolean
          longest_win_streak_after?: number
          longest_win_streak_before?: number
          loss_streak_after?: number
          loss_streak_before?: number
          losses_after?: number
          losses_before?: number
          mu_after?: number
          mu_before?: number
          pt_id?: string
          sigma_after?: number
          sigma_before?: number
          squad_id: string
          win_percent_after?: number
          win_percent_before?: number
          win_streak_after?: number
          win_streak_before?: number
          wins_after?: number
          wins_before?: number
        }
        Update: {
          elo_after?: number
          elo_before?: number
          elo_change_after?: number
          elo_change_before?: number
          game_id?: string
          highest_elo_after?: number
          highest_elo_before?: number
          is_winner?: boolean
          longest_win_streak_after?: number
          longest_win_streak_before?: number
          loss_streak_after?: number
          loss_streak_before?: number
          losses_after?: number
          losses_before?: number
          mu_after?: number
          mu_before?: number
          pt_id?: string
          sigma_after?: number
          sigma_before?: number
          squad_id?: string
          win_percent_after?: number
          win_percent_before?: number
          win_streak_after?: number
          win_streak_before?: number
          wins_after?: number
          wins_before?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["pt_id"]
            isOneToOne: false
            referencedRelation: "player_teams"
            referencedColumns: ["pt_id"]
          },
          {
            foreignKeyName: "game_players_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          game_weight: string
          id: string
          match_date: string
          squad_a_id: string
          squad_a_score: number
          squad_b_id: string
          squad_b_score: number
          team_id: string
        }
        Insert: {
          game_weight?: string
          id?: string
          match_date?: string
          squad_a_id?: string
          squad_a_score?: number
          squad_b_id?: string
          squad_b_score?: number
          team_id: string
        }
        Update: {
          game_weight?: string
          id?: string
          match_date?: string
          squad_a_id?: string
          squad_a_score?: number
          squad_b_id?: string
          squad_b_score?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_squad_a_id_fkey"
            columns: ["squad_a_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_squad_b_id_fkey"
            columns: ["squad_b_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_teams: {
        Row: {
          elo: number
          elo_change: number
          highest_elo: number
          last_updated: string
          longest_win_streak: number
          loss_streak: number
          losses: number
          mu: number
          player_id: string
          pt_id: string
          sigma: number
          team_id: string
          win_percent: number
          win_streak: number
          wins: number
        }
        Insert: {
          elo?: number
          elo_change?: number
          highest_elo?: number
          last_updated?: string
          longest_win_streak?: number
          loss_streak?: number
          losses?: number
          mu?: number
          player_id: string
          pt_id?: string
          sigma?: number
          team_id: string
          win_percent?: number
          win_streak?: number
          wins?: number
        }
        Update: {
          elo?: number
          elo_change?: number
          highest_elo?: number
          last_updated?: string
          longest_win_streak?: number
          loss_streak?: number
          losses?: number
          mu?: number
          player_id?: string
          pt_id?: string
          sigma?: number
          team_id?: string
          win_percent?: number
          win_streak?: number
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      squad_players: {
        Row: {
          active: boolean
          pt_id: string
          squad_id: string
        }
        Insert: {
          active?: boolean
          pt_id?: string
          squad_id?: string
        }
        Update: {
          active?: boolean
          pt_id?: string
          squad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_players_player_id_fkey"
            columns: ["pt_id"]
            isOneToOne: false
            referencedRelation: "player_teams"
            referencedColumns: ["pt_id"]
          },
          {
            foreignKeyName: "squad_players_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          active: boolean
          id: string
          name: string
          team_id: string
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
          team_id?: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_admins: {
        Row: {
          created_at: string | null
          id: string
          is_owner: boolean | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_owner?: boolean | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_owner?: boolean | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_admins_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          logo_url: string | null
          name: string
          owner_id: string
        }
        Insert: {
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
        }
        Update: {
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
