import { User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";
import { UserDetailsType, UserRoleType } from "./AuthProvider";

// Define the context type
interface AuthContextType {
  user: User | null;
  userRoles: UserRoleType[];
  userDetails: UserDetailsType;
  loading: boolean;
  error: string | null;
  refreshUser: () => void;
  logout: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userRoles: [],
  userDetails: { name: null, favorite_players: [], favorite_teams: [] },
  loading: true,
  error: null,
  refreshUser: () => {},
  logout: async () => {},
  refreshFavorites: async () => {},
});

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
