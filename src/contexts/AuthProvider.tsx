import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

export type UserRoleType = {
  team_id: string;
  role: string;
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      setError(error.message);
      setUser(null);
      setUserRoles([]);
    } else {
      setUser(data?.user || null);
      if (data?.user) {
        fetchUserRoles(data.user.id);
      }
    }

    setLoading(false);
  }, []);

  const fetchUserRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from("team_admins")
      .select("team_id, is_owner")
      .eq("user_id", userId);
    if (error) {
      setError(error.message);
    } else {
      const rolesFormatted = data.map((r) => ({
        team_id: r.team_id,
        role: r.is_owner ? "owner" : "admin",
      }));
      setUserRoles(rolesFormatted);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes (sign in, sign out)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userRoles,
        loading,
        error,
        refreshUser: fetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
