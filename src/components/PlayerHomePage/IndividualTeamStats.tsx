import { PlayerTeamType } from "@/lib/types";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";

type IndividualTeamStatsProps = {
  playerStats: PlayerTeamType;
  currentSeason: boolean;
  selectedSeasonNo: number | undefined;
};

const IndividualTeamStats = ({
  playerStats,
  currentSeason,
  selectedSeasonNo,
}: IndividualTeamStatsProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const headerBackgroundColor = isDarkMode ? "grey.700" : "grey.300";
  const rowBackgroundColor = isDarkMode ? "grey.900" : "grey.100";

  if (!playerStats) {
    return (
      <Typography variant="body2" fontWeight={"bold"}>
        Stats not found for this team.
      </Typography>
    );
  }

  const eloChangeColor =
    playerStats.elo_change > 0
      ? theme.palette.success.main
      : theme.palette.error.main;

  return (
    <div className="mt-2 w-full">
      <div className="overflow-x-auto rounded-sm">
        <Paper elevation={4}>
          <TableContainer
            component={Paper}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              cursor: "default",
            }}
          >
            <Table aria-label="individual player stats table" size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: headerBackgroundColor,
                  }}
                >
                  <TableCell align="center">
                    <Typography variant="body1" fontWeight={"bold"}>
                      ELO
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body1" fontWeight={"bold"}>
                      W/L
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body1" fontWeight={"bold"}>
                      {currentSeason ? "Streak" : "Season"}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow
                  key={playerStats.pt_id}
                  sx={{
                    backgroundColor: rowBackgroundColor,
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  <TableCell align="center">
                    <div className="flex gap-1 items-center justify-center">
                      <Typography variant="body1" fontWeight={"bold"}>
                        {playerStats.elo}
                      </Typography>
                      {currentSeason && (
                        <div className={`flex items-center`}>
                          {playerStats.elo_change > 0 ? (
                            <ArrowDropUpIcon color="success" fontSize="small" />
                          ) : playerStats.elo_change < 0 ? (
                            <ArrowDropDownIcon color="error" fontSize="small" />
                          ) : (
                            <ArrowRightIcon color="disabled" fontSize="small" />
                          )}
                          <Typography
                            variant="subtitle2"
                            fontStyle={"italic"}
                            color={
                              playerStats.elo_change > 0
                                ? "success"
                                : playerStats.elo_change < 0
                                ? "error"
                                : "textDisabled"
                            }
                          >
                            {playerStats.elo_change < 0
                              ? playerStats.elo_change * -1
                              : playerStats.elo_change}
                          </Typography>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <div className="flex items-center justify-center w-full gap-1">
                      <Typography
                        fontWeight={"bold"}
                        variant="body1"
                        sx={{ textWrap: "nowrap" }}
                      >
                        {playerStats.wins} - {playerStats.losses}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        fontStyle={"italic"}
                        color="textSecondary"
                      >
                        ({playerStats.win_percent}%)
                      </Typography>
                    </div>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      color: eloChangeColor,
                    }}
                  >
                    {playerStats.win_streak > 0 ? (
                      <Typography color="success" fontWeight={"bold"}>
                        W{playerStats.win_streak}
                      </Typography>
                    ) : playerStats.loss_streak > 0 ? (
                      <Typography color="error" fontWeight={"bold"}>
                        L{playerStats.loss_streak}
                      </Typography>
                    ) : !currentSeason && selectedSeasonNo ? (
                      <Typography color="textSecondary" fontWeight={"bold"}>
                        S{selectedSeasonNo}
                      </Typography>
                    ) : (
                      <Typography color="textSecondary">--</Typography>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
    </div>
  );
};

export default IndividualTeamStats;
