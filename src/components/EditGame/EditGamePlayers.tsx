import { GamePlayerWithPlayer, Squad } from "@/lib/types";
import { Delete as DeleteIcon } from "@mui/icons-material";
import {
  Autocomplete,
  FormControl,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";

type EditGamePlayersProps = {
  squad: Squad;
  players: GamePlayerWithPlayer[];
  removePlayerFromSquad: (squad: string, playerId: string) => void;
  addPlayerToSquad: (squad: string, playerId: string) => void;
  allPlayers: GamePlayerWithPlayer[];
  squadPlayerIDs: string[];
  isSquadA: boolean;
  singleGame?: boolean;
};

const EditGamePlayers = ({
  squad,
  players,
  removePlayerFromSquad,
  allPlayers,
  addPlayerToSquad,
  squadPlayerIDs,
  isSquadA,
  singleGame,
}: EditGamePlayersProps) => {
  const { name } = squad;

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const headerBackgroundColor = isDarkMode ? "grey.700" : "grey.300";
  const rowBackgroundColor = isDarkMode ? "grey.900" : "grey.100";
  const rowHoverBackgroundColor = isDarkMode ? "grey.800" : "grey.200";
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] =
    useState<GamePlayerWithPlayer | null>(null);

  if (players.length === 0) {
    return <p>No players found for {name}</p>;
  }

  const availablePlayers = allPlayers.filter(
    (player) => !squadPlayerIDs.includes(player.pt_id)
  );

  const handleAddPlayer = (player: GamePlayerWithPlayer | null) => {
    if (player) {
      addPlayerToSquad(squad.id, player.pt_id);
      setSelectedValue(null); // Clear the selected value after adding
      setInputValue(""); // Clear the input value as well
    }
  };

  return (
    <div className="flex flex-col w-full">
      <Typography
        variant={singleGame ? "h5" : "body1"}
        fontWeight={"bold"}
        color={isSquadA ? "primary" : "secondary"}
      >
        {name}
      </Typography>
      <Paper elevation={8} sx={{ borderRadius: "4px" }}>
        <TableContainer
          component={Paper}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            cursor: "default",
          }}
        >
          <Table aria-label="elo change table" size="small">
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: headerBackgroundColor,
                }}
              >
                <TableCell sx={{ fontWeight: "bold" }}>Player</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Before</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Impact</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>ELO</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.map((player) => {
                const eloChange =
                  player.elo_after && player.elo_before
                    ? player.elo_after - player.elo_before
                    : 0;
                const eloChangeColor =
                  eloChange > 0
                    ? `${theme.palette.success.main}`
                    : eloChange === 0
                    ? `${theme.palette.grey[500]}`
                    : `${theme.palette.error.main}`;

                return (
                  <TableRow
                    key={player.pt_id}
                    sx={{
                      backgroundColor: rowBackgroundColor,
                      "&:last-child td, &:last-child th": { border: 0 },
                      "&:hover": { backgroundColor: rowHoverBackgroundColor },
                    }}
                  >
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <div className="text-nowrap">{player.name}</div>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() =>
                          removePlayerFromSquad(squad.id, player.pt_id)
                        }
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell>{player.elo_before ?? "N/A"}</TableCell>
                    <TableCell
                      sx={{ fontWeight: "bold", color: eloChangeColor }}
                    >
                      {eloChange > 0 ? `+${eloChange}` : eloChange}
                    </TableCell>
                    <TableCell>{player.elo_after ?? "N/A"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <FormControl fullWidth sx={{ marginTop: 2 }}>
        <Autocomplete
          size="small"
          value={selectedValue}
          inputValue={inputValue}
          onChange={(_event, newValue) => {
            setSelectedValue(newValue);
            handleAddPlayer(newValue);
          }}
          onInputChange={(_event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          id={`add-player-autocomplete-${name.toLowerCase().replace(" ", "-")}`}
          options={availablePlayers}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField {...params} label={`Add Player to ${name}`} />
          )}
        />
      </FormControl>
    </div>
  );
};

export default EditGamePlayers;
