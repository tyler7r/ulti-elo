import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TeamType } from "@/lib/types";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add"; // PlusIcon
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Divider,
  IconButton,
  MenuItem,
  Popover,
  Typography,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import NoLogoAvatar from "../Utils/NoLogoAvatar";
import CreateTeam from "./CreateTeam";

type TeamModalProps = {
  setOpenLogin: (openLogin: boolean) => void;
};

const TeamModal = ({ setOpenLogin }: TeamModalProps) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamType[]>([]);
  const [openTeamModal, setOpenTeamModal] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openPopover, setOpenPopover] = useState<boolean>(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase.from("teams").select("*");
      if (error) {
        console.error("Error fetching teams:", error);
        setError(error.message);
        setLoading(false);
      } else {
        setTeams(data);
        setLoading(false);
      }
    };
    fetchTeams();

    const channel = supabase
      .channel("team_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => {
          void fetchTeams();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleTeamPageRedirect = (teamId: string) => {
    void router.push(`/team/${teamId}`);
    handleClosePopover(); // Close the popover after redirecting
  };

  const openCreateTeamModal = () => {
    if (user) {
      setOpenTeamModal(true);
    } else {
      setOpenLogin(true);
    }
  };

  const closeModal = () => {
    setOpenTeamModal(false);
    setOpenLogin(false);
  };

  const handlePopoverClick = () => {
    setOpenPopover((prev) => !prev);
  };

  const handleClosePopover = () => {
    setOpenPopover(false);
  };

  const open = Boolean(openPopover);
  const id = open ? "teams-popover" : undefined;

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <Box className="mb-0 flex flex-col items-center gap-2 w-full relative">
      <Button
        aria-describedby={id}
        onClick={handlePopoverClick}
        variant="contained"
        fullWidth
        endIcon={
          !open ? (
            <KeyboardArrowDown fontSize="small" />
          ) : (
            <KeyboardArrowUp fontSize="small" />
          )
        }
        startIcon={
          !open ? (
            <KeyboardArrowDown fontSize="small" />
          ) : (
            <KeyboardArrowUp fontSize="small" />
          )
        }
        ref={anchorRef}
        sx={{
          fontWeight: "bold",
          opacity: 0.6,
          backgroundColor:
            theme.palette.mode === "light"
              ? theme.palette.grey[300]
              : theme.palette.grey[800],
          color: theme.palette.text.primary,
          "&:hover": {
            backgroundColor:
              theme.palette.mode === "light"
                ? theme.palette.grey[400]
                : theme.palette.grey[700],
            opacity: 0.7,
          },
        }}
      >
        Teams
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        PaperProps={{
          // Style the paper (background) of the popover
          style: {
            width: "100vw",
            top: 0,
            left: 0,
            transform: "translateY(0)", // Override default transform
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <IconButton
            onClick={handleClosePopover}
            color="inherit"
            aria-label="close"
            size="small"
            sx={{ position: "absolute", top: 5, right: 5 }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            sx={{
              display: "flex",

              alignItems: "center",
            }}
          >
            <Typography sx={{ fontWeight: "bold", mb: 1 }} variant="h5">
              Teams
            </Typography>
            <IconButton
              onClick={openCreateTeamModal}
              color="inherit"
              aria-controls="plus-menu"
              aria-haspopup="true"
              size="small"
              title="Create New Team"
              sx={{ mb: 1 }}
            >
              <AddIcon color="primary" />
            </IconButton>
          </Box>
          <Divider />

          <Typography sx={{ p: 1.5, fontWeight: "bold" }}>All Teams</Typography>
          <Divider />
          <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
            {loading ? (
              <Typography sx={{ p: 1 }}>Loading teams...</Typography>
            ) : (
              teams.map((team) => (
                <MenuItem
                  key={team.id}
                  onClick={() => handleTeamPageRedirect(team.id)}
                  className="flex gap-1.5"
                >
                  {team.logo_url ? (
                    <Image
                      src={team.logo_url}
                      alt={`${team.name} Logo`}
                      width={35}
                      height={35}
                      className="rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <NoLogoAvatar name={team.name} size="small" />
                  )}

                  <Typography>{team.name}</Typography>
                </MenuItem>
              ))
            )}
          </Box>
        </Box>
      </Popover>
      {openTeamModal && (
        <CreateTeam onClose={closeModal} openTeamModal={openTeamModal} />
      )}
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
};

export default TeamModal;
