import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AlertType } from "@/lib/types";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";

const Login = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });
  const [showPwd, setShowPwd] = useState(false);

  const [forgotPasswordDialog, setForgotPasswordDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<
    string | null
  >(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ message: null, severity: "error" });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAlert({ message: error.message, severity: "error" });
    } else {
      setAlert({
        message: "Login successful! Redirecting...",
        severity: "success",
      });
      refreshUser();
      setTimeout(() => {
        void router.push("/");
      }, 500); // Redirect to homepage after login
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setForgotPasswordLoading(true);
    setForgotPasswordMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setForgotPasswordMessage("Failed to send reset email. Please try again.");
    } else {
      setForgotPasswordMessage(
        "Password reset email sent successfully. Check your spam folder!"
      );
    }

    setForgotPasswordLoading(false);
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
      <div className="p-6 mt-8 w-full max-w-md">
        <Typography
          variant="h4"
          fontWeight={"bold"}
          sx={{ textAlign: "center", marginBottom: "16px" }}
        >
          Log In
        </Typography>

        <form onSubmit={handleLogin} className="space-y-4 flex flex-col gap-4">
          {/* Email Input */}
          <TextField
            fullWidth
            label="Email"
            type="email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password Input */}
          <TextField
            fullWidth
            label="Password"
            type={showPwd ? "text" : "password"}
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            slotProps={{
              input: {
                endAdornment: showPwd ? (
                  <IconButton
                    size="small"
                    onClick={() => setShowPwd((prev) => !prev)}
                  >
                    <VisibilityIcon color="secondary" />
                  </IconButton>
                ) : (
                  <IconButton
                    size="small"
                    onClick={() => setShowPwd((prev) => !prev)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                ),
              },
            }}
          />

          {alert.message && (
            <Alert severity={alert.severity} className="mb-4">
              {alert.message}
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Log In"}
          </Button>

          <Button
            color="secondary"
            variant="outlined"
            onClick={() => setForgotPasswordDialog(true)}
          >
            Forgot Password?
          </Button>

          <Typography
            className="text-center"
            component={"p"}
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
          >
            {`Don't have an account?`}
            <Button
              onClick={() => void router.push("/auth/signup")}
              color="secondary"
            >
              Sign Up
            </Button>
          </Typography>
        </form>
      </div>
      <Dialog
        open={forgotPasswordDialog}
        onClose={() => setForgotPasswordDialog(false)}
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Forgot Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Enter your email"
            type="email"
            variant="outlined"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
            sx={{ marginTop: "8px" }}
          />

          {forgotPasswordMessage && (
            <Alert
              severity={
                forgotPasswordMessage.includes("success") ? "success" : "error"
              }
            >
              {forgotPasswordMessage}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setForgotPasswordDialog(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleForgotPassword}
            color="secondary"
            disabled={forgotPasswordLoading}
          >
            {forgotPasswordLoading ? (
              <CircularProgress size={20} />
            ) : (
              "Send Reset Email"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Login;
