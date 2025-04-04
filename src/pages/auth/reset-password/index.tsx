import { supabase } from "@/lib/supabase";
import { AlertType } from "@/lib/types";
import {
  Alert,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";

const ResetPassword = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setAlert({
        message: `Failed to reset password: ${error.message}. Please try again.`,
        severity: "error",
      });
    } else {
      setAlert({
        message: "Password reset successfully. Redirecting...",
        severity: "success",
      });
      setTimeout(() => router.push("/auth/login"), 500);
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center mt-16 flex-col">
      <Typography
        variant="h4"
        color="secondary"
        fontWeight={"bold"}
        fontStyle={"italic"}
      >
        Welcome to Ulti ELO
      </Typography>
      <div className="p-6 mt-8 w-full max-w-md flex flex-col gap-4">
        <Typography
          variant="h4"
          sx={{ textAlign: "center" }}
          fontWeight={"bold"}
        >
          Reset Password
        </Typography>

        <form
          onSubmit={handleResetPassword}
          className="space-y-4 flex flex-col w-full items-center justify-center gap-4"
        >
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          {alert.message && (
            <Alert severity={alert.severity}>{alert.message}</Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
