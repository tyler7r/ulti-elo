// pages/search.tsx (Updated with Browse Links)

import GlobalSearchAutocomplete from "@/components/HomePage/GlobalSearchAutocomplete"; // Adjust path if needed
import GroupsIcon from "@mui/icons-material/Groups"; // Icon for Teams
import PeopleIcon from "@mui/icons-material/People"; // Icon for Players
import { Box, Button, Divider, Typography } from "@mui/material";
import { useRouter } from "next/router";
// import Layout from '@/components/Layout'; // If you have a Layout component

const SearchPage = () => {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    void router.push(path);
  };

  return (
    // Wrap with Layout if you have one: <Layout> ... </Layout>
    // Use Box for overall padding
    <Box p={2}>
      {/* 1. Title */}
      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        gutterBottom
        sx={{ mb: 2 }}
      >
        Global Search
      </Typography>

      {/* 2. Search Bar Container */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 2, // Add margin below search bar
        }}
      >
        <GlobalSearchAutocomplete centered={false} />
      </Box>

      {/* Divider */}
      <Divider sx={{ my: 3, maxWidth: "600px", mx: "auto" }}>
        <Typography variant="overline" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* 3. Browse Options */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" }, // Stack on mobile, row on larger
          justifyContent: "center",
          alignItems: "center", // Center items horizontally/vertically
          gap: 2, // Spacing between buttons
        }}
      >
        {/* <Typography
          variant="body1"
          color="text.secondary"
          sx={{ display: { xs: "block", sm: "none" }, mb: 1 }}
        >
          Browse all:
        </Typography> */}
        <Button
          variant="outlined" // Use outlined for secondary actions
          color="primary"
          startIcon={<GroupsIcon />}
          onClick={() => handleNavigate("/teams")} // Navigate to /teams page (create this page later)
          sx={{ minWidth: "180px" }} // Give buttons some minimum width
        >
          Browse All Teams
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<PeopleIcon />}
          onClick={() => handleNavigate("/players")} // Navigate to /players page (create this page later)
          sx={{ minWidth: "180px" }} // Give buttons some minimum width
        >
          Browse All Players
        </Button>
      </Box>
    </Box>
  );
};

export default SearchPage;
