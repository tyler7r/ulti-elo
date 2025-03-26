import { User } from "@supabase/supabase-js";
import { createContext, useContext } from "react";
import { UserRoleType } from "./AuthProvider";

// Define the context type
interface AuthContextType {
  user: User | null;
  userRoles: UserRoleType[];
  loading: boolean;
  error: string | null;
  refreshUser: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userRoles: [],
  loading: true,
  error: null,
  refreshUser: () => {},
  logout: async () => {},
});

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);
