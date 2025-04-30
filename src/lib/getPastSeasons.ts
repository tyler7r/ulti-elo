// /lib/getPastSeasons.ts (Create this new file or add to an existing utils file)

import { supabase } from "@/lib/supabase"; // Adjust path as needed
import { SeasonType } from "@/lib/types"; // Adjust path as needed
import { PostgrestError } from "@supabase/supabase-js";

type GetPastSeasonsFilter = {
  teamId: string;
  page?: number;
  limit?: number;
};

export const getPastSeasons = async ({
  teamId,
  page = 1,
  limit = 10, // Default limit
}: GetPastSeasonsFilter): Promise<{
  seasons: SeasonType[] | null;
  error?: PostgrestError | string;
  totalCount?: number;
}> => {
  // Validate required parameters
  if (!teamId) {
    console.error("getPastSeasons error: Team ID is required.");
    return { seasons: null, error: "Team ID is required." };
  }
  // Calculate offset for pagination
  const offset = page > 0 && limit > 0 ? (page - 1) * limit : 0;
  try {
    // Start building the query from the 'seasons' table
    let query = supabase
      .from("seasons")
      .select("*", { count: "exact" }) // Select all season columns and request total count
      .eq("team_id", teamId) // Filter by team
      .eq("active", false) // Filter for completed seasons (active = false)
      .order("season_no", { ascending: false }); // Order by season number descending (most recent completed first)
    // Apply pagination range if limit is positive
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }
    // Execute the query
    const { data, error, count } = await query;
    // Handle potential errors during the query
    if (error) {
      console.error("Error fetching past seasons:", error);
      return { seasons: null, error: error };
    }

    // Return the fetched seasons, no error, and the total count
    return {
      seasons: (data as SeasonType[]) ?? [], // Ensure data is typed as Season[], default to empty array
      error: undefined,
      totalCount: count ?? 0, // Provide the total count matching the filters
    };
  } catch (err) {
    // Catch any unexpected errors during the process
    console.error("Unexpected error fetching past seasons:", err);
    return {
      seasons: null,
      error: "An unexpected error occurred.",
    };
  }
};
