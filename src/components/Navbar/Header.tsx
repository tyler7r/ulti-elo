import { useAuth } from "@/contexts/AuthContext";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import React, { useState } from "react";
import LoginFirstWarning from "../Utils/LoginFirstWarning";
import CreatePlayer from "./CreatePlayer";
import CreateTeam from "./CreateTeam";
import InfoModal from "./InfoModal";
import TeamModal from "./TeamsModal";

type HeaderProps = {
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const Header = ({ toggleTheme, isDarkMode }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openPlayerModal, setOpenPlayerModal] = useState(false);
  const [openTeamModal, setOpenTeamModal] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const openCreatePlayerModal = () => {
    if (user) {
      setOpenPlayerModal(true);
      handleClose();
    } else {
      setOpenLogin(true);
    }
  };

  const openCreateTeamModal = () => {
    if (user) {
      setOpenTeamModal(true);
      handleClose();
    } else {
      setOpenLogin(true);
    }
  };

  const closeModal = () => {
    setOpenPlayerModal(false);
    setOpenTeamModal(false);
    setOpenLogin(false);
    setAnchorEl(null);
  };

  const handleAuthAction = () => {
    if (user) {
      logout();
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <>
      <AppBar position="sticky" color="default">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Logo / Title */}
          <div className="flex items-center justify-center gap-2">
            <Typography
              component="span"
              onClick={() => void router.push("/")}
              variant="h6"
              sx={{ flexGrow: 1, fontWeight: "bold", cursor: "pointer" }}
            >
              Ulti ELO
            </Typography>
            <InfoModal />
          </div>

          {/* Plus Icon Button */}
          <div className="flex items-center justify-center">
            <Box>
              <IconButton
                onClick={handleMenuClick}
                color="inherit"
                aria-controls="plus-menu"
                aria-haspopup="true"
                size="small"
              >
                <AddCircleOutlineIcon />
              </IconButton>
              {/* Menu */}
              <Menu
                id="plus-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                sx={{ padding: 0 }}
              >
                <MenuItem
                  onClick={openCreatePlayerModal}
                  sx={{ fontWeight: "bold", fontSize: "14px" }}
                >
                  Create New Player
                </MenuItem>
                <MenuItem
                  onClick={openCreateTeamModal}
                  sx={{ fontWeight: "bold", fontSize: "14px" }}
                >
                  Create New Team
                </MenuItem>
              </Menu>
            </Box>
            <IconButton onClick={toggleTheme} size="small">
              {isDarkMode ? (
                <LightModeIcon color="primary" fontSize="large" />
              ) : (
                <DarkModeIcon color="primary" fontSize="large" />
              )}
            </IconButton>
            <Button
              onClick={handleAuthAction}
              variant="outlined"
              color={user ? "secondary" : "primary"}
              size="small"
            >
              {user ? "Logout" : "Sign in"}
            </Button>
          </div>
        </Toolbar>
      </AppBar>
      <TeamModal setOpenLogin={setOpenLogin} />
      <CreatePlayer onClose={closeModal} openPlayerModal={openPlayerModal} />
      <CreateTeam onClose={closeModal} openTeamModal={openTeamModal} />
      <LoginFirstWarning
        requestedAction="Create Team"
        open={openLogin}
        handleClose={closeModal}
      />
    </>
  );
};

export default Header;
