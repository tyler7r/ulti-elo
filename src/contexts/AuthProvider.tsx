import { supabase } from "@/lib/supabase";
import { PlayerType, TeamType } from "@/lib/types";
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

export type FavoriteTeamType = {
  favorite_id: string;
  team: TeamType;
};

export type FavoritePlayerType = {
  favorite_id: string;
  player: PlayerType;
};

export type UserDetailsType = {
  name: string | null;
  favorite_teams: FavoriteTeamType[];
  favorite_players: FavoritePlayerType[];
};

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleType[]>([]);
  // const [userName, setUserName] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetailsType>({
    name: null,
    favorite_teams: [],
    favorite_players: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
    setLoadingDetails(true);
    setError(null);

    try {
      const [rolesResult, nameResult, playersResult, teamsResult] =
        await Promise.all([
          supabase
            .from("team_admins")
            .select("team_id, is_owner")
            .eq("user_id", userId),
          supabase.from("users").select("name").eq("id", userId).single(),
          supabase
            .from("favorite_players")
            .select("favorite_id, player: players(*)")
            .eq("user_id", userId),
          supabase
            .from("favorite_teams")
            .select("favorite_id, team: teams(*)")
            .eq("user_id", userId),
        ]);
      if (rolesResult.error) {
        console.error(`Error fetching user roles: `, rolesResult.error.message);
        setError(`Error fetching user roles.`);
        setUserRoles([]);
      } else {
        const rolesFormatted = (rolesResult.data ?? []).map((r) => ({
          team_id: r.team_id,
          role: r.is_owner ? "owner" : "admin",
        }));
        setUserRoles(rolesFormatted);
      }
      const fetchedName = nameResult.error
        ? null
        : nameResult.data.name ?? null;
      if (nameResult.error)
        console.error(`Error fetching user name: `, nameResult.error.message);

      const fetchedTeams = teamsResult.error
        ? []
        : (teamsResult.data as FavoriteTeamType[]) ?? [];
      if (teamsResult.error)
        console.error(
          `Error fetching favorite teams: `,
          teamsResult.error.message
        );

      const fetchedPlayers = playersResult.error
        ? []
        : (playersResult.data as FavoritePlayerType[]) ?? [];
      if (playersResult.error)
        console.error(
          `Error fetching favorite players: `,
          playersResult.error.message
        );

      setUserDetails({
        name: fetchedName,
        favorite_teams: fetchedTeams,
        favorite_players: fetchedPlayers,
      });
    } catch (err) {
      console.error("Unexpected error fetching user data: ", err);
      setError("Failed to load user data.");
      setUserRoles([]);
      setUserDetails({ name: null, favorite_players: [], favorite_teams: [] });
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    if (!user) return; // Only run if user is logged in
    try {
      const [teamsResult, playersResult] = await Promise.all([
        supabase
          .from("favorite_teams")
          .select("favorite_id, team:teams(*)")
          .eq("user_id", user.id),
        supabase
          .from("favorite_players")
          .select("favorite_id, player:players(*)")
          .eq("user_id", user.id),
      ]);

      const fetchedTeams = teamsResult.error
        ? []
        : (teamsResult.data as FavoriteTeamType[]) ?? [];
      if (teamsResult.error)
        console.error(
          "Error refreshing favorite teams:",
          teamsResult.error.message
        );

      const fetchedPlayers = playersResult.error
        ? []
        : (playersResult.data as FavoritePlayerType[]) ?? [];
      if (playersResult.error)
        console.error(
          "Error refreshing favorite players:",
          playersResult.error.message
        );

      // Update only the favorites part of the userDetails state
      setUserDetails((prevDetails) => ({
        ...prevDetails, // Keep existing name and other potential future fields
        favorite_teams: fetchedTeams,
        favorite_players: fetchedPlayers,
      }));
    } catch (err) {
      console.error("Unexpected error refreshing favorites:", err);
    }
  }, [user]); // Depends on user object

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setLoadingDetails(true);
    setError(null);
    setUser(null);
    setUserRoles([]);
    setUserDetails({ name: null, favorite_players: [], favorite_teams: [] });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Auth error:", authError.message);
      setError("Authentication error.");
      // Ensure states remain reset
    } else if (authData?.user) {
      setUser(authData.user);
      // User found, now fetch their roles and details
      await fetchUserData(authData.user.id); // fetchUserData handles its own loading/error
    } else {
      // No user logged in, states remain reset
      setUser(null);
    }

    setLoading(false); // Initial auth check finished
  }, [fetchUserData]);

  const logout = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setUser(null);
      setUserRoles([]);
      setUserDetails({ name: null, favorite_players: [], favorite_teams: [] });
    } catch (error) {
      console.error("Error during logout:", error);
      setError("Logout failed");
    }
  };

  useEffect(() => {
    refreshUser();

    // Listen for auth state changes (sign in, sign out)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const contextLoading = loading || (user !== null && loadingDetails);

  return (
    <AuthContext.Provider
      value={{
        user,
        userRoles,
        userDetails,
        loading: contextLoading,
        error,
        refreshUser,
        logout,
        refreshFavorites,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
