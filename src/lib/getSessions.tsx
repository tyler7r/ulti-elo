// /lib/getSessions.ts (or your preferred utility file path)

import { supabase } from "@/lib/supabase"; // Adjust path as needed
import { SessionType } from "@/lib/types"; // Adjust path as needed
import { PostgrestError } from "@supabase/supabase-js";

// Define the filter parameters accepted by the function
type GetSessionsFilter = {
  teamId: string;
  active?: boolean | null; // Filter by active status (true, false, or null/undefined for all)
  page?: number; // Page number for pagination (1-based)
  limit?: number; // Number of items per page
  excludeId?: string; // Optional: To exclude a specific session ID
};

export const getSessions = async ({
  teamId,
  active, // Use boolean filter
  page = 1,
  limit = 10, // Default limit
  excludeId,
}: GetSessionsFilter): Promise<{
  sessions: SessionType[] | null;
  error?: PostgrestError | string;
  totalCount?: number;
}> => {
  // Validate required parameters
  if (!teamId) {
    console.error("getSessions error: Team ID is required.");
    return { sessions: null, error: "Team ID is required." };
  }

  // Calculate offset for pagination
  const offset = page > 0 && limit > 0 ? (page - 1) * limit : 0;

  try {
    // Start building the query, selecting all columns and enabling count
    let query = supabase
      .from("sessions") // Use the correct table name 'sessions'
      .select("*", { count: "exact" }) // Select all session columns and request total count
      .eq("team_id", teamId) // Filter by team
      .order("session_date", { ascending: false }); // Order newest first

    // Apply active status filter if provided (true or false)
    if (active !== undefined && active !== null) {
      query = query.eq("active", active);
    }
    // Apply exclusion filter if provided
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    // Apply pagination range if limit is positive
    if (limit > 0) {
      query = query.range(offset, offset + limit - 1);
    }
    // Execute the query
    const { data, error, count } = await query;
    // Handle potential errors during the query
    if (error) {
      console.error("Error fetching sessions:", error);
      // Return the Supabase error object
      return { sessions: null, error: error };
    }
    // Return the fetched sessions, no error, and the total count
    return {
      sessions: (data as SessionType[]) ?? [], // Ensure data is typed correctly, default to empty array
      error: undefined,
      totalCount: count ?? 0, // Provide the total count matching the filters
    };
  } catch (err) {
    // Catch any unexpected errors during the process
    console.error("Unexpected error fetching sessions:", err);
    return {
      sessions: null,
      error: "An unexpected error occurred.",
    };
  }
};
