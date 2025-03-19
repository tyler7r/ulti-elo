import AddIcon from "@mui/icons-material/Add"; // PlusIcon
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import {
  AppBar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import React, { useState } from "react";
import CreatePlayer from "./CreatePlayer";
import CreateTeam from "./CreateTeam";

type HeaderProps = {
  toggleTheme: () => void;
  isDarkMode: boolean;
};

const Header = ({ toggleTheme, isDarkMode }: HeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openPlayerModal, setOpenPlayerModal] = useState(false);
  const [openTeamModal, setOpenTeamModal] = useState(false);
  const open = Boolean(anchorEl);
  const router = useRouter();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const openCreatePlayerModal = () => {
    setOpenPlayerModal(true);
    handleClose();
  };

  const openCreateTeamModal = () => {
    setOpenTeamModal(true);
    handleClose();
  };

  const closeModal = () => {
    setOpenPlayerModal(false);
    setOpenTeamModal(false);
  };

  return (
    <>
      <AppBar position="sticky" color="default">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Logo / Title */}
          <Typography
            component="span"
            onClick={() => void router.push("/")}
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: "bold", cursor: "pointer" }}
          >
            Ulti ELO
          </Typography>

          {/* Plus Icon Button */}
          <Box>
            <IconButton
              onClick={handleMenuClick}
              color="inherit"
              aria-controls="plus-menu"
              aria-haspopup="true"
              size="small"
            >
              <AddIcon fontSize="large" />
            </IconButton>

            {/* Menu */}
            <Menu
              id="plus-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={openCreatePlayerModal}>
                Create New Player
              </MenuItem>
              <MenuItem onClick={openCreateTeamModal}>Create New Team</MenuItem>
            </Menu>
          </Box>
          <IconButton onClick={toggleTheme} size="small">
            {isDarkMode ? (
              <LightModeIcon color="primary" fontSize="large" />
            ) : (
              <DarkModeIcon color="primary" fontSize="large" />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>
      <CreatePlayer onClose={closeModal} openPlayerModal={openPlayerModal} />
      <CreateTeam onClose={closeModal} openTeamModal={openTeamModal} />
    </>
  );
};

export default Header;
