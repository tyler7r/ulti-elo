// pages/index.tsx
import LoggedInHomePage from "@/components/HomePage/LoggedInHomePage"; // Import the new component
import LoggedOutHomePage from "@/components/HomePage/LoggedOutHomePage";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { Box, CircularProgress } from "@mui/material";

export default function HomePage() {
  const { user, loading } = useAuth(); // Get user and loading state

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <Box
        width="100%"
        height="80vh" // Make it take significant height
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Conditionally render based on user presence
  return (
    <Box width={"100%"}>
      {user ? <LoggedInHomePage /> : <LoggedOutHomePage />}
    </Box>
  );
}
