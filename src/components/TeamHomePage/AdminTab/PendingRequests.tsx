import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Card, CardContent, IconButton, Typography } from "@mui/material";
import { useCallback } from "react";

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
  teamId: string;
  requests: AdminRequest[];
  onRequestsUpdated: () => void;
  setSnackbarMessage: (message: string) => void;
  setSnackbarOpen: (open: boolean) => void;
}

const PendingRequestsTab = ({
  teamId,
  requests,
  onRequestsUpdated,
  setSnackbarMessage,
  setSnackbarOpen,
}: PendingRequestsTabProps) => {
  const handleAdminAction = useCallback(
    async (
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
        onRequestsUpdated(); // Refresh requests in parent component
      } else {
        console.error("Failed to handle admin request");
        setSnackbarMessage("Failed to handle admin request.");
        setSnackbarOpen(true);
      }
    },
    [teamId, onRequestsUpdated, setSnackbarMessage, setSnackbarOpen]
  );

  return (
    <Box mt={3}>
      <Typography variant="h6" fontWeight="bold" sx={{ marginBottom: 1 }}>
        Pending Admin Requests
      </Typography>
      {requests.length === 0 ? (
        <Typography>No pending admin requests.</Typography>
      ) : (
        requests.map((req) => (
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
        ))
      )}
    </Box>
  );
};

export default PendingRequestsTab;
