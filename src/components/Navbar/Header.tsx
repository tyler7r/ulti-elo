// Header.tsx - Updated Version
import { useAuth } from "@/contexts/AuthContext";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import LightModeIcon from "@mui/icons-material/LightMode";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SearchIcon from "@mui/icons-material/Search"; // For search
import StarIcon from "@mui/icons-material/Star";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List, // Use ListItemButton for clickable items
  ListItemIcon, // Added ListItemIcon
  ListItemText,
  ListSubheader, // Added ListItemText
  Menu,
  MenuItem,
  PopoverOrigin, // Added PopoverOrigin
  Toolbar,
  Tooltip, // Added Tooltip
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/router";
import React, { useState } from "react";
import LoginFirstWarning from "../Utils/LoginFirstWarning";
import NoLogoAvatar from "../Utils/NoLogoAvatar";
import CreatePlayer from "./CreatePlayer";
import CreateTeam from "./CreateTeam";
import InfoModal from "./InfoModal";
// Removed TeamModal import

type HeaderProps = {
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const Header = ({ toggleTheme, isDarkMode }: HeaderProps) => {
  const { user, userDetails, logout, loading: authLoading } = useAuth(); // Get userDetails, loading state
  const [createMenuAnchorEl, setCreateMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [favMenuAnchorEl, setFavMenuAnchorEl] = useState<null | HTMLElement>(
    null
  ); // State for Favorites menu
  const [openPlayerModal, setOpenPlayerModal] = useState(false);
  const [openTeamModal, setOpenTeamModal] = useState(false);
  const [openLoginWarning, setOpenLoginWarning] = useState(false); // Renamed from openLogin for clarity
  const [loginWarningAction, setLoginWarningAction] = useState(
    "perform this action"
  ); // Dynamic action text

  const openCreateMenu = Boolean(createMenuAnchorEl);
  const openFavMenu = Boolean(favMenuAnchorEl); // State for Favorites menu open

  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // --- Handlers for Create Menu ---
  const handleCreateMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setCreateMenuAnchorEl(event.currentTarget);
  };
  const handleCreateMenuClose = () => {
    setCreateMenuAnchorEl(null);
  };

  // --- Handlers for Favorites Menu ---
  const handleFavMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!user) {
      setLoginWarningAction("view favorites");
      setOpenLoginWarning(true);
      return;
    }
    setFavMenuAnchorEl(event.currentTarget);
  };
  const handleFavMenuClose = () => {
    setFavMenuAnchorEl(null);
  };

  // --- Handlers for Modals ---
  const openCreatePlayerModal = () => {
    if (user) {
      setOpenPlayerModal(true);
    } else {
      setLoginWarningAction("create a player");
      setOpenLoginWarning(true);
    }
    handleCreateMenuClose();
  };
  const openCreateTeamModal = () => {
    if (user) {
      setOpenTeamModal(true);
    } else {
      setLoginWarningAction("create a team");
      setOpenLoginWarning(true);
    }
    handleCreateMenuClose();
  };
  const closeCreateModals = () => {
    setOpenPlayerModal(false);
    setOpenTeamModal(false);
  };
  const closeLoginWarning = () => {
    setOpenLoginWarning(false);
  };

  // --- Handler for Search Modal ---
  const handleSearchNavigation = () => {
    void router.push("/search");
  };

  // --- Auth Action ---
  const handleAuthAction = () => {
    if (user) {
      void logout(); // Call logout from context
      handleFavMenuClose(); // Close fav menu if open on logout
    } else {
      void router.push("/auth/login");
    }
  };

  // --- Navigation Handler for Favorites ---
  const handleFavoriteNavigation = (path: string) => {
    handleFavMenuClose();
    void router.push(path);
  };

  // --- Menu anchor origins ---
  const menuAnchorOrigin: PopoverOrigin = {
    vertical: "bottom",
    horizontal: "right",
  };
  const menuTransformOrigin: PopoverOrigin = {
    vertical: "top",
    horizontal: "right",
  };
  const menuItemStyle = {
    py: 0,
    "& .MuiListItemIcon-root": { minWidth: 36 },
  }; // Consistent padding and icon spacing

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: "56px", // Ensure consistent height
            px: { xs: 1, sm: 2 },
          }}
          disableGutters // Remove default padding if managing manually
          // px={{ xs: 1, sm: 2 }} // Apply responsive padding
        >
          {/* Left Side: Logo / Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Consider adding your actual logo image here later */}
            <Typography
              component="span"
              onClick={() => void router.push("/")}
              variant={isMobile ? "body1" : "h6"} // Keep h6 or adjust as needed
              sx={{
                fontWeight: "bold",
                cursor: "pointer",
                display: { sm: "block" },
              }} // Hide text on xs
            >
              Ulti ELO
            </Typography>
            {/* Optionally show a small icon logo on xs */}
            <InfoModal />
          </Box>

          {/* Right Side: Actions */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1 },
            }}
          >
            {/* Search Button */}
            <Tooltip title="Search">
              <IconButton
                onClick={handleSearchNavigation}
                color="inherit"
                size={"small"}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>

            {/* Favorites Button (Logged-in only) */}
            {user && (
              <Tooltip title="Favorites">
                <IconButton
                  onClick={handleFavMenuClick}
                  color="secondary"
                  aria-controls={openFavMenu ? "favorites-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={openFavMenu ? "true" : undefined}
                  size={"small"}
                >
                  <StarIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Create (+) Menu Button */}
            <Tooltip title="Create">
              <IconButton
                onClick={handleCreateMenuClick}
                color="inherit"
                aria-controls={openCreateMenu ? "plus-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={openCreateMenu ? "true" : undefined}
                size={"small"}
              >
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>

            {/* Theme Toggle Button */}
            <Tooltip
              title={
                isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
              }
            >
              <IconButton onClick={toggleTheme} size={"small"} color="primary">
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Auth Button */}
            <Button
              onClick={handleAuthAction}
              variant={user ? "outlined" : "contained"} // Changed to outlined for less emphasis than create potentially
              color={user ? "secondary" : "primary"}
              size="small"
              sx={{
                fontSize: { xs: "10px", sm: "12px" }, // Responsive font size
                py: { xs: 0.4, sm: 0.5 },
                px: { xs: 1, sm: 1.5 }, // Responsive padding
              }}
            >
              {user ? "Logout" : "Log In"}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Create Menu */}
      <Menu
        id="plus-menu"
        anchorEl={createMenuAnchorEl}
        open={openCreateMenu}
        onClose={handleCreateMenuClose}
        anchorOrigin={menuAnchorOrigin}
        transformOrigin={menuTransformOrigin}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        <Box
          display={"flex"}
          width={"100%"}
          alignItems={"center"}
          px={1}
          pb={1}
          gap={1}
        >
          <AddCircleOutlineIcon color={"disabled"} />
          <Typography
            variant="button"
            sx={{
              display: "block",
              color: "text.secondary",
              fontWeight: "bold",
            }}
          >
            Create
          </Typography>
        </Box>
        <Divider sx={{ mb: 0.5 }} />
        {/* Added Header and Divider */}
        <List dense disablePadding>
          <MenuItem onClick={openCreatePlayerModal} sx={menuItemStyle}>
            <ListItemIcon>
              <PersonAddIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="New Player"
              slotProps={{
                primary: {
                  variant: "body2",
                  fontWeight: "bold",
                  color: "textSecondary",
                },
              }}
            />
          </MenuItem>
          <MenuItem onClick={openCreateTeamModal} sx={menuItemStyle}>
            <ListItemIcon>
              <GroupAddIcon fontSize="small" color="secondary" />
            </ListItemIcon>
            <ListItemText
              primary="New Team"
              slotProps={{
                primary: {
                  variant: "body2",
                  fontWeight: "bold",
                  color: "textSecondary",
                },
              }}
            />
          </MenuItem>
        </List>
      </Menu>

      {/* Favorites Menu */}
      <Menu
        id="favorites-menu"
        anchorEl={favMenuAnchorEl}
        open={openFavMenu}
        onClose={handleFavMenuClose}
        anchorOrigin={menuAnchorOrigin}
        transformOrigin={menuTransformOrigin}
        slotProps={{ paper: { sx: { maxHeight: 400, minWidth: 250 } } }}
      >
        <Box
          display={"flex"}
          width={"100%"}
          alignItems={"center"}
          px={2}
          pb={1}
          gap={1}
        >
          <StarIcon color="secondary" />
          <Typography
            variant="button"
            sx={{
              display: "block",
              color: "text.secondary",
              fontWeight: "bold",
            }}
          >
            Favorites
          </Typography>
        </Box>
        <Divider />
        {authLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box>
            {/* Favorite Teams */}
            {userDetails.favorite_teams.length === 0 &&
              userDetails.favorite_players.length === 0 && (
                <MenuItem
                  disabled
                  sx={{ fontStyle: "italic", fontSize: "14px" }}
                >
                  No favorites added yet.
                </MenuItem>
              )}

            {userDetails.favorite_teams.length > 0 && (
              <List dense disablePadding>
                <ListSubheader
                  sx={{ bgcolor: "transparent", lineHeight: "30px" }}
                >
                  Teams
                </ListSubheader>
                {userDetails.favorite_teams.map((favTeam) => (
                  <MenuItem
                    key={favTeam.favorite_id}
                    onClick={() =>
                      handleFavoriteNavigation(`/team/${favTeam.team.id}`)
                    }
                    sx={{ py: 0.5 }}
                  >
                    <ListItemIcon>
                      {favTeam.team.logo_url ? (
                        <Avatar
                          src={favTeam.team.logo_url}
                          sx={{ width: 24, height: 24 }}
                          variant="rounded"
                        />
                      ) : (
                        <NoLogoAvatar
                          name={favTeam.team.name}
                          size="x-small"
                          isColor="secondary"
                          leaderboard={true}
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={favTeam.team.name}
                      slotProps={{
                        primary: {
                          variant: "body2",
                          fontWeight: "bold",
                          noWrap: true,
                        },
                      }}
                    />
                  </MenuItem>
                ))}
              </List>
            )}

            {/* Favorite Players */}
            {userDetails.favorite_players.length > 0 && (
              <List dense disablePadding>
                <Divider sx={{ mt: 1, mx: 1 }} />
                <ListSubheader
                  sx={{ bgcolor: "transparent", lineHeight: "30px" }}
                >
                  Players
                </ListSubheader>
                {userDetails.favorite_players.map((favPlayer, index) => (
                  <MenuItem
                    key={favPlayer.favorite_id}
                    onClick={() =>
                      handleFavoriteNavigation(`/player/${favPlayer.player.id}`)
                    }
                    sx={{ py: 0.5 }}
                  >
                    <ListItemIcon>
                      {/* Placeholder Avatar */}
                      <NoLogoAvatar
                        size="x-small"
                        name={favPlayer.player.name}
                        isColor={index % 2 === 0 ? "primary" : "secondary"}
                        leaderboard={true}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={favPlayer.player.name}
                      slotProps={{
                        primary: {
                          variant: "body2",
                          noWrap: true,
                          fontWeight: "bold",
                        },
                      }}
                    />
                  </MenuItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Menu>

      {/* Other Modals */}
      <CreatePlayer
        onClose={closeCreateModals}
        openPlayerModal={openPlayerModal}
      />
      <CreateTeam onClose={closeCreateModals} openTeamModal={openTeamModal} />
      <LoginFirstWarning
        requestedAction={loginWarningAction}
        open={openLoginWarning}
        handleClose={closeLoginWarning}
      />
    </>
  );
};

export default Header;
