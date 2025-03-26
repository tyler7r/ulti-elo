import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    // 1️⃣ Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Signup error:", error.message);
      setError(error.message);
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
        setError("Failed to create user profile.");
      } else {
        setSuccess("User created successfully, check email to confirm signup!");
        refreshUser();
        router.push("/"); // Redirect to homepage after signup
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="shadow-md dark:shadow-md rounded-lg p-6 w-full max-w-md">
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

          {error && (
            <Typography
              color="error"
              variant="overline"
              sx={{ fontWeight: "bold" }}
            >
              {error}
            </Typography>
          )}
          {success && (
            <Typography
              color="success"
              variant="overline"
              sx={{ fontWeight: "bold" }}
            >
              {success}
            </Typography>
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
