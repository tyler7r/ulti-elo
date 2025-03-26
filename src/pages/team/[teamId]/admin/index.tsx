import { supabase } from "@/lib/supabase";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

interface AdminRequest {
  user_id: string;
  team_id: string;
  created_at: string;
  user: {
    email: string;
    name: string;
  };
  team: {
    name: string;
  };
}

const AdminPage = () => {
  const router = useRouter();
  const teamId = router.query.teamId as string;
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!teamId) return;

    const { data, error } = await supabase
      .from("admin_requests")
      .select(
        `
        user_id,
        team_id,
        created_at,
        user:users (email, name),
        team: teams (name)
      `
      )
      .eq("team_id", teamId)
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching admin requests:", error.message);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAdminAction = async (
    userId: string,
    action: "approve" | "reject",
    email: string,
    name: string,
    teamName: string
  ) => {
    const res = await fetch(`/api/admin-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        action,
        teamId,
        email,
        name,
        teamName,
      }),
    });

    if (res.ok) {
      fetchRequests();
    } else {
      console.error("Failed to handle admin request");
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-4">
      <IconButton onClick={() => router.push(`/team/${teamId}`)}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h4" fontWeight="bold" className="mb-4">
        Admin Requests
      </Typography>

      {requests.length === 0 ? (
        <Typography>No pending admin requests.</Typography>
      ) : (
        requests.map((req) => (
          <Card key={req.team_id + req.user_id} className="mb-4">
            <CardContent className="flex justify-between items-center">
              <div>
                <Typography variant="h6">{req.user.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {req.user.email}
                </Typography>
              </div>

              <div className="flex gap-2">
                <IconButton
                  color="success"
                  onClick={() =>
                    handleAdminAction(
                      req.user_id,
                      "approve",
                      req.user.email,
                      req.user.name,
                      req.team.name
                    )
                  }
                >
                  <CheckIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() =>
                    handleAdminAction(
                      req.user_id,
                      "reject",
                      req.user.email,
                      req.user.name,
                      req.team.name
                    )
                  }
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default AdminPage;
