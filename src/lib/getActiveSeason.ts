import { supabase } from "./supabase";
import { SeasonType } from "./types";

export const getActiveSeason = async (
  teamId: string
): Promise<{ season: SeasonType | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from("seasons")
      .select("*")
      .eq("team_id", teamId)
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (error && error.code !== "PGRST116")
      return { season: null, error: error.message };
    return { season: data ?? null, error: null };
  } catch (error) {
    console.error(error);
    return {
      season: null,
      error: "There was an unexpected error getting the active season.",
    };
  }
};
