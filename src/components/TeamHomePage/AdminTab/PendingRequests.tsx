import { TeamType } from "@/lib/types";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Card, CardContent, IconButton, Typography } from "@mui/material";
import { useCallback } from "react";
import NoAccessPage from "./NoAccess";

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

interface PendingRequestsTabProps {
  team: TeamType;
  requests: AdminRequest[];
  onRequestsUpdated: () => void;
  setSnackbarMessage: (message: string) => void;
  setSnackbarOpen: (open: boolean) => void;
  isAdmin: boolean;
  ownerName: string | undefined;
}

const PendingRequestsTab = ({
  team,
  requests,
  onRequestsUpdated,
  setSnackbarMessage,
  setSnackbarOpen,
  isAdmin,
  ownerName,
}: PendingRequestsTabProps) => {
  const handleAdminAction = useCallback(
    async (
      userId: string,
      action: "approve" | "reject",
      email: string,
      name: string,
      teamName: string
    ) => {
      if (!isAdmin) return;
      const res = await fetch(`/api/admin-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
          teamId: team.id,
          email,
          name,
          teamName,
        }),
      });

      if (res.ok) {
        onRequestsUpdated(); // Refresh requests in parent component
      } else {
        console.error("Failed to handle admin request");
        setSnackbarMessage("Failed to handle admin request.");
        setSnackbarOpen(true);
      }
    },
    [team, onRequestsUpdated, setSnackbarMessage, setSnackbarOpen, isAdmin]
  );

  return !isAdmin ? (
    <NoAccessPage isAdmin={isAdmin} ownerName={ownerName} team={team} />
  ) : (
    <Box p={2} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="h5" fontWeight="bold">
        Pending Admin Requests
      </Typography>
      {requests.length === 0 ? (
        <Typography px={1}>No pending admin requests.</Typography>
      ) : (
        <Box sx={{ px: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          {requests.map((req) => (
            <Card key={req.team_id + req.user_id} className="mb-2">
              <CardContent className="flex justify-between items-center">
                <div>
                  <Typography variant="body1" fontWeight={"bold"}>
                    {req.user.name}
                  </Typography>
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
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PendingRequestsTab;
