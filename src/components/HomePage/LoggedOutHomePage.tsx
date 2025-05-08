// pages/index.tsx (Or your designated homepage route)

import BarChartIcon from "@mui/icons-material/BarChart";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import {
  alpha,
  Box,
  Button,
  Container,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/router";
import GlobalSearchAutocomplete from "./GlobalSearchAutocomplete";

const LoggedOutHomePage = () => {
  const theme = useTheme();
  const router = useRouter();
  const isDarkMode = theme.palette.mode === "dark";

  const handleNavigate = (path: string) => {
    void router.push(path);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* 1. Hero Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 4, sm: 6, md: 8 },
          bgcolor: isDarkMode
            ? alpha(theme.palette.primary.dark, 0.2)
            : alpha(theme.palette.primary.light, 0.15), // Adjusted secondary
          color: theme.palette.text.primary,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h1"
            component="h1"
            fontWeight="bold"
            gutterBottom
            // color={theme.palette.primary.main}
            sx={{ fontSize: { xs: "2.5rem", sm: "3.25rem", md: "4rem" } }}
          >
            Track Your Team&rsquo;s ELO & Climb the Ranks
          </Typography>
          <Typography
            variant="h6"
            component="p"
            // If hero background is light, text.secondary is fine. If dark, might need lighter secondary or custom.
            color={
              isDarkMode
                ? theme.palette.grey[400]
                : theme.palette.text.secondary
            }
            sx={{
              mt: 2,
              mb: 3,
              maxWidth: "750px",
              mx: "auto",
              lineHeight: 1.4,
            }}
          >
            Join or create teams, record game results, track real-time ELO
            changes, analyze stats, and compete on leaderboards.
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => handleNavigate("/auth/signup")}
              sx={{ px: 2, py: 1.5, fontSize: "1rem" }}
            >
              Sign Up Free
            </Button>
            <Button
              variant="outlined"
              // color for outlined button might need adjustment based on hero bg
              color={isDarkMode ? "primary" : "inherit"}
              size="large"
              onClick={() => handleNavigate("/auth/login")}
              sx={{ px: 2, py: 1.5, fontSize: "1rem" }}
            >
              Log In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 2. Search/Discovery Bar Section */}
      <Container
        maxWidth="md"
        sx={{ py: { xs: 2, sm: 4 }, pt: { xs: 4, sm: 6 }, textAlign: "center" }}
      >
        <Typography variant="h5" component="h2" fontWeight="600" gutterBottom>
          Find Your Team or Players
        </Typography>
        <GlobalSearchAutocomplete centered={true} />
      </Container>

      {/* 3. Feature Highlights Section */}
      <Box
        sx={{
          py: { xs: 2, sm: 4 },
          pb: { xs: 4, sm: 6 },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            component="h2"
            fontWeight="bold"
            textAlign="center"
            gutterBottom
            sx={{ mb: 2 }}
          >
            Key Features
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {[
              {
                icon: (
                  <TrackChangesIcon
                    color="primary"
                    sx={{ fontSize: 48, mb: 1 }}
                  />
                ),
                title: "Real-time ELO",
                description:
                  "Accurate ELO ratings update instantly after every recorded game based on the TrueSkill algorithm.",
              },
              {
                icon: (
                  <EventNoteIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                ),
                title: "Session Tracking",
                description:
                  "Organize play days, manage attendees, auto-generate balanced squads, and track game schedules easily.",
              },
              {
                icon: (
                  <BarChartIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
                ),
                title: "Detailed Stats",
                description:
                  "Analyze player and team performance with stats like win percentage, streaks, ELO history, and more.",
              },
              {
                icon: (
                  <LeaderboardIcon
                    color="primary"
                    sx={{ fontSize: 48, mb: 1 }}
                  />
                ),
                title: "Leaderboards",
                description:
                  "See how you and your teammates stack up with sortable player rankings.",
              },
            ].map((feature, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  height: "100%",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  borderColor: theme.palette.divider,
                }}
              >
                {feature.icon}
                <Typography
                  variant="h6"
                  component="h3"
                  fontWeight="bold"
                  gutterBottom
                >
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* 4. Public Showcase Section */}
      <Box
        sx={{
          py: { xs: 4, sm: 6 },
          bgcolor: isDarkMode
            ? alpha(theme.palette.secondary.dark, 0.2)
            : alpha(theme.palette.secondary.light, 0.15), // Adjusted secondary
          color: theme.palette.text.primary,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h4"
            component="h2"
            fontWeight="bold"
            textAlign="center"
            gutterBottom
            sx={{ mb: 2 }}
          >
            Explore the Community
          </Typography>
          <Typography
            variant="body1"
            color={isDarkMode ? theme.palette.grey[400] : "text.secondary"}
            textAlign="center"
            sx={{ mb: 3, maxWidth: "600px", mx: "auto" }}
          >
            Find active teams, players, and see who&rsquo;s climbing the ranks.
            Your next match awaits!
          </Typography>
          <Box sx={{ textAlign: "center" }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => handleNavigate("/search")}
              sx={{ px: 4, py: 1.5, fontSize: "1rem" }}
            >
              Global Search
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Optional Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          bgcolor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Ulti ELO. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LoggedOutHomePage;
