import { supabase } from "@/lib/supabase";
import { PlayerTeamType } from "@/lib/types";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import GroupRemoveIcon from "@mui/icons-material/GroupRemove";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import {
  Box,
  Collapse,
  IconButton,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type SelectAttendeesStepProps = {
  attendees: PlayerTeamType[];
  onAttendeesChange: (attendees: PlayerTeamType[]) => void;
};

const SelectAttendeesStep = ({
  attendees,
  onAttendeesChange,
}: SelectAttendeesStepProps) => {
  const router = useRouter();
  const teamId = router.query.teamId as string;
  const [allPlayers, setAllPlayers] = useState<PlayerTeamType[]>([]);
  const [showAllPlayers, setShowAllPlayers] = useState(true);
  const [selectedPlayersOpen, setSelectedPlayersOpen] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (teamId) {
        try {
          const { data: playerTeams, error: ptError } = await supabase
            .from("player_teams")
            .select("*, player:players(name)")
            .eq("team_id", teamId)
            .order("player(name)", { ascending: true });

          if (ptError) {
            console.error("Error fetching player_teams:", ptError);
            return;
          }
          setAllPlayers(playerTeams);
        } catch (error) {
          console.error("An error occurred while fetching players:", error);
        }
      }
    };
    fetchPlayers();
  }, [teamId]);

  const handleAddAttendee = (player: PlayerTeamType) => {
    if (!attendees.find((attendee) => attendee.pt_id === player.pt_id)) {
      onAttendeesChange([...attendees, player]);
    }
  };

  const handleRemoveAttendee = (ptIdToRemove: string) => {
    onAttendeesChange(
      attendees.filter((attendee) => attendee.pt_id !== ptIdToRemove)
    );
  };

  const isPlayerAttendee = (player: PlayerTeamType) => {
    return attendees.some((attendee) => attendee.pt_id === player.pt_id);
  };

  const toggleMenuOpen = (allPlayers: boolean) => {
    if (allPlayers) {
      setShowAllPlayers((prev) => !prev);
      setSelectedPlayersOpen(false);
    } else {
      setSelectedPlayersOpen((prev) => !prev);
      setShowAllPlayers(false);
    }
  };

  const addAllPlayersToAttendees = () => {
    onAttendeesChange(allPlayers);
    setSelectedPlayersOpen(true);
    setShowAllPlayers(false);
  };

  const removeAllPlayersFromAttendees = () => {
    onAttendeesChange([]);
    setSelectedPlayersOpen(false);
    setShowAllPlayers(true);
  };

  return (
    <Box>
      <Typography variant="h6" mb={1} fontWeight={"bold"} fontStyle={"italic"}>
        Select Session Players
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Typography variant="body2" fontWeight={"bold"}>
          Add Session Players
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "flex-end",
          }}
        >
          <IconButton onClick={addAllPlayersToAttendees} size="small">
            <GroupAddIcon />
          </IconButton>
          <IconButton
            onClick={() => toggleMenuOpen(true)}
            aria-expanded={showAllPlayers}
            aria-label="show more"
            size="small"
          >
            {!showAllPlayers ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
      </Box>
      <Collapse in={showAllPlayers} sx={{ mb: !showAllPlayers ? 2 : 0 }}>
        <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
          {allPlayers.length === attendees.length && (
            <div className="text-xs px-2">All players already selected!</div>
          )}
          <List dense>
            {allPlayers
              .filter((player) => !isPlayerAttendee(player))
              .map((player) => (
                <ListItem
                  key={player.pt_id}
                  sx={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <div className="flex flex-col text-wrap cursor-default">
                    <div className="text-sm">{player.player.name}</div>
                    <div className="text-xs font-bold italic">
                      (ELO: {player.elo})
                    </div>
                  </div>
                  <IconButton
                    size="small"
                    onClick={() => handleAddAttendee(player)}
                  >
                    <PersonAddIcon />
                  </IconButton>
                </ListItem>
              ))}
          </List>
        </Box>
      </Collapse>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Typography variant="body2" fontWeight={"bold"} gutterBottom>
          Session Players ({attendees.length})
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "flex-end",
          }}
        >
          <IconButton onClick={removeAllPlayersFromAttendees} size="small">
            <GroupRemoveIcon />
          </IconButton>
          <IconButton
            onClick={() => toggleMenuOpen(false)}
            aria-expanded={selectedPlayersOpen}
            aria-label="show more"
            size="small"
          >
            {!selectedPlayersOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={selectedPlayersOpen} sx={{ mb: 2 }}>
        <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
          {attendees.length === 0 && (
            <div className="text-xs px-2">No players selected!</div>
          )}
          <List dense>
            {attendees.map((attendee) => (
              <ListItem
                key={attendee.pt_id}
                sx={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <div className="flex flex-col text-wrap cursor-default">
                  <div className="text-sm">{attendee.player.name}</div>
                  <div className="text-xs font-bold italic">
                    (ELO: {attendee.elo})
                  </div>
                </div>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveAttendee(attendee.pt_id)}
                >
                  <PersonRemoveIcon color="error" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Collapse>
    </Box>
  );
};

export default SelectAttendeesStep;
