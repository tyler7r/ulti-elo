import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AlertType } from "@/lib/types";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";

const Signup = () => {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // Add name field
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setAlert({ message: "Passwords do not match.", severity: "error" });
      return;
    }

    setLoading(true);
    setAlert({ message: null, severity: "error" });

    // 1️⃣ Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Signup error:", error.message);
      setAlert({ message: error.message, severity: "error" });
      setLoading(false);
      return;
    }

    const user = data.user;
    if (user) {
      // 2️⃣ Insert the user into the `players` table
      const { error: dbError } = await supabase.from("users").insert([
        {
          id: user.id,
          name,
          email,
        },
      ]);

      if (dbError) {
        console.error("Error inserting into users:", dbError.message);
        setAlert({
          message: "Failed to create user profile.",
          severity: "error",
        });
      } else {
        setAlert({
          message: "User created successfully, check email to confirm signup!",
          severity: "success",
        });
        refreshUser();
        setTimeout(() => {
          void router.push("/");
        }, 1000);
        // Redirect to homepage after signup
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center mt-16 flex-col w-full">
      <Typography
        variant="h4"
        color="secondary"
        fontWeight={"bold"}
        fontStyle={"italic"}
      >
        Welcome to Ulti ELO
      </Typography>
      <div className="rounded-lg p-6 w-full max-w-md mt-8">
        <Typography
          variant="h4"
          fontWeight={"bold"}
          sx={{ textAlign: "center", marginBottom: "16px" }}
        >
          Sign Up
        </Typography>

        <form onSubmit={handleSignup} className="space-y-4 flex flex-col gap-4">
          {/* Name Input */}
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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

          {/* Confirm Password Input */}
          <TextField
            fullWidth
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            variant="outlined"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            slotProps={{
              input: {
                endAdornment: showConfirm ? (
                  <IconButton
                    size="small"
                    onClick={() => setShowConfirm((prev) => !prev)}
                  >
                    <VisibilityIcon color="secondary" />
                  </IconButton>
                ) : (
                  <IconButton
                    size="small"
                    onClick={() => setShowConfirm((prev) => !prev)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                ),
              },
            }}
          />

          {alert.message && (
            <Alert severity={alert.severity}>{alert.message}</Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Sign Up"}
          </Button>

          <Typography
            component={"p"}
            textAlign={"center"}
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
          >
            Already have an account?{" "}
            <Button
              onClick={() => router.push("/auth/login")}
              color="secondary"
            >
              Log In
            </Button>
          </Typography>
        </form>
      </div>
    </div>
  );
};

export default Signup;
