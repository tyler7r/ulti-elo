// import { supabase } from "@/lib/supabase"; // Adjust path as needed
import { supabase } from "@/lib/supabase";
import { SessionTypeWithStats } from "@/lib/types"; // Adjust path as needed
import { PostgrestError } from "@supabase/supabase-js";

// Define the raw shape returned by Supabase query
// It's helpful for type safety during mapping
type RawSessionData = Omit<
  SessionTypeWithStats,
  "season_no" | "games_played_count" | "attendees_count"
> & {
  seasons: { season_no: number | null } | null; // Join result (can be null if LEFT JOIN implied or no season)
  games: { count: number }[]; // Count result is always an array
  session_attendees: { count: number }[]; // Count result is always an array
};

// Helper function to map raw data to SessionType
const mapRawDataToSessionType = (rawData: RawSessionData) => {
  return {
    // Spread all original fields from the raw session data
    id: rawData.id,
    session_date: rawData.session_date,
    team_id: rawData.team_id,
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    title: rawData.title,
    active: rawData.active,
    season_id: rawData.season_id,

    // Map the nested/calculated fields
    season_no: rawData.seasons?.season_no ?? null, // Safely access nested season_no
    games_played_count: rawData.games?.[0]?.count ?? 0, // Safely access count
    attendees_count: rawData.session_attendees?.[0]?.count ?? 0, // Safely access count
  };
};

type GetSessionsFilter = {
  teamId: string;
  active?: boolean;
  page?: number;
  limit?: number;
  excludeId?: string;
};

// Fetches sessions with pagination, status filtering, and related counts/info
export const getSessions = async ({
  teamId,
  active,
  page = 1,
  limit = 10,
  excludeId,
}: GetSessionsFilter): Promise<{
  sessions: SessionTypeWithStats[] | null;
  error?: PostgrestError | string;
  totalCount?: number; // Total count for the primary session filter
}> => {
  if (!teamId) {
    return { sessions: null, error: "Team ID is required." };
  }

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("sessions")
      .select(
        `
      *,
      seasons ( season_no ),
      games ( count ),
      session_attendees ( count )
    `,
        { count: "exact" }
      ) // Get total count of sessions matching filter
      .eq("team_id", teamId)
      // Order by session creation/update time or explicit session_date if available
      .order("created_at", { ascending: false }); // Or use 'updated_at' or 'session_date'

    // Apply active status filter (handle boolean explicitly)
    if (typeof active === "boolean") {
      query = query.eq("active", active);
    }

    // Apply exclusion filter
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    // Apply pagination
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching sessions:", error);
      return { sessions: null, error: error };
    }

    // Map the raw data to the desired SessionType structure
    const mappedSessions = data ? data.map(mapRawDataToSessionType) : [];

    return {
      sessions: mappedSessions,
      error: undefined,
      totalCount: count ?? 0,
    };
  } catch (err) {
    console.error("Unexpected error fetching sessions:", err);
    // Check if err is an object with a message property
    const errorMessage =
      typeof err === "object" && err !== null && "message" in err
        ? String(err.message)
        : "An unexpected error occurred.";
    return {
      sessions: null,
      error: errorMessage,
    };
  }
};

// Specific function to get the single active session for a team with related counts/info
export const getActiveSession = async (
  teamId: string
): Promise<{
  session: SessionTypeWithStats | null;
  error?: PostgrestError | string;
}> => {
  if (!teamId) {
    return { session: null, error: "Team ID is required." };
  }
  try {
    // Define the select string similar to getSessions
    const selectString = `
      *,
      seasons ( season_no ),
      games ( count ),
      session_attendees ( count )
    `;

    const { data, error } = await supabase
      .from("sessions")
      .select(selectString)
      .eq("team_id", teamId)
      .eq("active", true)
      .limit(1)
      .maybeSingle(); // Expect 0 or 1 result

    if (error) {
      console.error("Error fetching active session:", error);
      return { session: null, error: error };
    }

    // Map the raw data if found, otherwise return null
    const mappedSession = data ? mapRawDataToSessionType(data) : null;

    return { session: mappedSession, error: undefined };
  } catch (err) {
    console.error("Unexpected error fetching active session:", err);
    const errorMessage =
      typeof err === "object" && err !== null && "message" in err
        ? String(err.message)
        : "An unexpected error occurred.";
    return {
      session: null,
      error: errorMessage,
    };
  }
};
