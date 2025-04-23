// /lib/getSessions.ts (Create this new file or add to an existing utils file)

import { supabase } from "@/lib/supabase"; // Adjust path as needed
import { SessionType } from "@/lib/types"; // Adjust path as needed
import { PostgrestError } from "@supabase/supabase-js";

type GetSessionsFilter = {
  teamId: string;
  active?: boolean; // Allow single status or array
  page?: number;
  limit?: number;
  excludeId?: string; // Optional: To exclude a specific session ID (e.g., the active one)
};

// Fetches sessions with pagination and status filtering
export const getSessions = async ({
  teamId,
  active,
  page = 1,
  limit = 10, // Adjust default limit as needed
  excludeId,
}: GetSessionsFilter): Promise<{
  sessions: SessionType[] | null;
  error?: PostgrestError | string; // Allow string errors for custom messages
  totalCount?: number; // Optional: Total count for the filter
}> => {
  if (!teamId) {
    return { sessions: null, error: "Team ID is required." };
  }

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from("sessions") // Correct table name 'session'
      .select("*", { count: "exact" }) // Select all columns and get total count
      .eq("team_id", teamId)
      .order("session_date", { ascending: false }); // Order by date descending

    // Apply status filter
    const act = !!active;
    if (act) {
      query = query.eq("active", active);
    } else {
      query = query.eq("active", act);
    }

    // Apply exclusion filter
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    // Apply pagination only if limit is positive
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching sessions:", error);
      return { sessions: null, error: error };
    }

    return {
      sessions: (data as SessionType[]) ?? [],
      error: undefined,
      totalCount: count ?? 0,
    };
  } catch (err) {
    console.error("Unexpected error fetching sessions:", err);
    return {
      sessions: null,
      error: "An unexpected error occurred.",
    };
  }
};

// Specific function to get the single active session for a team
export const getActiveSession = async (
  teamId: string
): Promise<{
  session: SessionType | null;
  error?: PostgrestError | string;
}> => {
  if (!teamId) {
    return { session: null, error: "Team ID is required." };
  }
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("team_id", teamId)
      .eq("active", true)
      .limit(1)
      .maybeSingle(); // Expect 0 or 1 result

    if (error) {
      console.error("Error fetching active session:", error);
      return { session: null, error: error };
    }
    return { session: data as SessionType | null, error: undefined };
  } catch (err) {
    console.error("Unexpected error fetching active session:", err);
    return {
      session: null,
      error: "An unexpected error occurred.",
    };
  }
};
