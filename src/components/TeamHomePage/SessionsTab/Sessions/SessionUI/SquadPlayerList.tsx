// /components/Sessions/SquadPlayerList.tsx (or your component path)

import { getRank } from "@/lib/getRank"; // Assuming this utility exists and path is correct
import { FetchedSquadPlayer, PlayerTeamType } from "@/lib/types"; // Adjust path as needed
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip, // Import Tooltip
  Typography,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/router"; // Use next/router for Pages Router

// Update prop type to accept an array containing potentially mixed types or just one type
type SquadPlayerListProps = {
  players: (FetchedSquadPlayer | PlayerTeamType)[]; // Array can contain either type
  squadName?: string; // Optional squad name header
  squadA?: boolean; // Optional flag for primary/secondary color
  color?: string; // Optional direct color override
  disablePlayerClick?: boolean; // Option to disable clicking player name
  handleOpenModal?: (player: PlayerTeamType) => void; // Optional handler for remove button
  isEditing?: boolean; // Optional flag to show remove button
  noEloChange?: boolean;
};

const SquadPlayerList = ({
  players,
  squadName,
  squadA,
  color,
  disablePlayerClick = false, // Default to clickable
  handleOpenModal,
  isEditing = false, // Default to not editing
  noEloChange,
}: SquadPlayerListProps) => {
  const theme = useTheme();
  const router = useRouter();
  const isDarkMode = theme.palette.mode === "dark";

  const headerBackgroundColor = isDarkMode ? "grey.700" : "grey.300";
  const rowBackgroundColor = isDarkMode ? "grey.900" : "grey.100";
  const rowHoverBackgroundColor = isDarkMode ? "grey.800" : "grey.200";

  // Navigate to player detail page
  const handlePlayerClick = (playerId: string | undefined) => {
    if (disablePlayerClick || !playerId) return; // Check disable flag and ID existence
    void router.push(`/player/${playerId}`);
  };

  // Helper function to check if an object is FetchedSquadPlayer
  const isFetchedSquadPlayer = (
    player: FetchedSquadPlayer | PlayerTeamType
  ): player is FetchedSquadPlayer => {
    // Check for a property unique to FetchedSquadPlayer, like player_teams
    return (player as FetchedSquadPlayer).player_teams !== undefined;
  };

  return (
    <Box>
      {/* Squad Header (Optional) */}
      {squadName && (
        <Typography
          variant="body1"
          fontWeight="bold"
          sx={{
            mb: 1,
            color: color
              ? color
              : squadA
              ? theme.palette.primary.main
              : theme.palette.secondary.main,
          }}
        >
          {squadName} Players ({players.length}):
        </Typography>
      )}

      {/* Player Table */}
      <TableContainer
        component={Paper}
        elevation={1}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          cursor: "default",
        }}
      >
        <Table
          size="small"
          aria-label={`${squadName ?? "Squad"} player stats table`}
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: headerBackgroundColor }}>
              <TableCell sx={{ fontWeight: "bold", padding: 1 }} align="left">
                Player
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", padding: 1 }} align="center">
                ELO
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", padding: 1 }} align="center">
                W
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", padding: 1 }} align="center">
                L
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((player) => {
              // --- Normalize Data ---
              let p: PlayerTeamType | null = null;
              if (isFetchedSquadPlayer(player)) {
                p = player.player_teams;
              } else {
                p = player;
              }
              if (!p || !p.player) {
                return null;
              } // Skip if data missing
              // --- End Normalize Data ---

              const eloChange = p.elo_change ?? 0;
              const eloChangeColor =
                eloChange > 0
                  ? theme.palette.success.main
                  : eloChange < 0
                  ? theme.palette.error.main
                  : theme.palette.text.disabled;

              // Ensure keys are unique and stable
              const rowKey = p.pt_id || `player-${Math.random()}`; // Fallback key if pt_id is missing

              return (
                // Ensure no whitespace between TableRow and TableCell
                <TableRow
                  key={rowKey}
                  sx={{
                    backgroundColor: rowBackgroundColor,
                    "&:last-child td, &:last-child th": { border: 0 },
                    "&:hover": { backgroundColor: rowHoverBackgroundColor },
                  }}
                >
                  <TableCell // Player Name Cell
                    component="th"
                    scope="row"
                    align="left"
                    sx={{ padding: 1 }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      {handleOpenModal && isEditing ? (
                        <IconButton
                          edge="end"
                          aria-label="remove player"
                          onClick={() => handleOpenModal(p!)}
                          color="error"
                          size="small"
                          sx={{ p: 0.25 }}
                        >
                          <PersonRemoveIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <Tooltip title={getRank(p.elo).name} placement="top">
                          <IconButton
                            size="small"
                            sx={{ p: 0.25, fontSize: "14px" }}
                            disableRipple
                          >
                            {getRank(p.elo).icon}
                          </IconButton>
                        </Tooltip>
                      )}
                      <Typography
                        variant="body2"
                        onClick={() => handlePlayerClick(p?.player_id)}
                        sx={{
                          cursor: disablePlayerClick ? "default" : "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={p.player.name}
                      >
                        {p.player.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell // ELO Cell
                    align="center"
                    sx={{ padding: 1 }}
                  >
                    <Box
                      display="flex"
                      gap={0.5}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Typography variant="body2" component="span">
                        {p.elo ?? "-"}
                      </Typography>
                      {!isEditing && !noEloChange && (
                        <Box
                          display="flex"
                          alignItems="center"
                          component="span"
                        >
                          {eloChange > 0 ? (
                            <ArrowDropUpIcon
                              color="success"
                              sx={{ fontSize: "1.2rem" }}
                            />
                          ) : eloChange < 0 ? (
                            <ArrowDropDownIcon
                              color="error"
                              sx={{ fontSize: "1.2rem" }}
                            />
                          ) : (
                            <ArrowRightIcon
                              color="disabled"
                              sx={{ fontSize: "1.2rem" }}
                            />
                          )}
                          <Typography
                            variant="caption"
                            fontWeight="bold"
                            component="span"
                            sx={{ color: eloChangeColor }}
                          >
                            {Math.abs(eloChange)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell // Wins Cell
                    align="center"
                    sx={{ padding: 1 }}
                  >
                    {p.wins ?? 0}
                  </TableCell>
                  <TableCell // Losses Cell
                    align="center"
                    sx={{ padding: 1 }}
                  >
                    {p.losses ?? 0}
                  </TableCell>
                </TableRow> // Ensure no whitespace before closing tag
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default SquadPlayerList;
