import EloHistoryChart from "@/components/PlayerHomePage/EloHistoryChart";
import { getRank } from "@/lib/getRank";
import { supabase } from "@/lib/supabase";
import { PlayerTeamsType } from "@/lib/types";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NoLogoAvatar from "../Utils/NoLogoAvatar";
import IndividualTeamStats from "./IndividualTeamStats";

interface PlayerTeamStatsProps {
  teamData: PlayerTeamsType;
  openTeamId: string | null;
  onTeamOpen: (teamId: string | null) => void;
}

interface EloHistoryEntry {
  date: string;
  elo: number;
}

const PlayerTeamStats = ({
  teamData,
  openTeamId,
  onTeamOpen,
}: PlayerTeamStatsProps) => {
  const isOpen = openTeamId === teamData.player.pt_id;
  const [eloHistory, setEloHistory] = useState<EloHistoryEntry[]>([]);
  const [loadingEloHistory, setLoadingEloHistory] = useState<boolean>(false);
  const [errorFetchingElo, setErrorFetchingElo] = useState<string | null>(null);

  const rank = getRank(teamData.player.elo);
  const router = useRouter();

  const fetchEloHistory = async (playerTeamId: string) => {
    setLoadingEloHistory(true);
    setErrorFetchingElo("");
    try {
      const { data: eloHistoryData, error: eloHistoryError } = await supabase
        .from("game_players")
        .select(
          `
              elo_after,
              pt_id,
              games!inner(
                match_date
              )
            `
        )
        .eq("pt_id", playerTeamId)
        .order("games(match_date)", { ascending: true });

      if (eloHistoryError) {
        throw eloHistoryError;
      }

      const history: EloHistoryEntry[] = eloHistoryData.map((item) => {
        const d = new Date(item.games.match_date);
        const month = (d.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed
        const day = d.getDate().toString().padStart(2, "0");
        const year = d.getFullYear().toString().slice(-2);

        const formattedDate = `${month}/${day}/${year}`;
        return { date: formattedDate, elo: item.elo_after };
      });

      const dailyEloMap = new Map<string, EloHistoryEntry>();
      history.forEach((entry) => {
        dailyEloMap.set(entry.date, entry);
      });
      const processedEloHistory = Array.from(dailyEloMap.values());

      setEloHistory(processedEloHistory);

      setLoadingEloHistory(false);
    } catch (error) {
      console.error("Error fetching Elo history:", error);
      setErrorFetchingElo("Failed to load Elo history for this team.");
      setLoadingEloHistory(false);
    }
  };

  const handleExpandClick = () => {
    onTeamOpen(isOpen ? null : teamData.player.pt_id);
  };

  useEffect(() => {
    if (
      eloHistory.length === 0 &&
      !loadingEloHistory &&
      !errorFetchingElo &&
      isOpen
    ) {
      fetchEloHistory(teamData.player.pt_id);
    }
  }, [
    isOpen,
    eloHistory,
    loadingEloHistory,
    errorFetchingElo,
    teamData.player.pt_id,
  ]);

  return (
    <Paper className="mb-4 p-4 rounded" elevation={2}>
      <Box display={"flex"} flexDirection={"column"}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box
            display="flex"
            alignItems="center"
            justifyContent={"center"}
            gap={1}
          >
            {teamData.team.logo_url ? (
              <Image
                src={teamData.team.logo_url}
                alt={`${teamData.team.name} Logo`}
                width={40}
                height={40}
                className="rounded cursor-pointer"
                onClick={() => void router.push(`/team/${teamData.team.id}`)}
              />
            ) : (
              <NoLogoAvatar name={teamData.team.name} size="small" />
            )}
            <Typography variant="h6" fontWeight="bold">
              {teamData.team.name}
            </Typography>
          </Box>
          <IconButton
            onClick={handleExpandClick}
            aria-expanded={isOpen}
            aria-label="show more"
          >
            {!isOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        </Box>
        <IndividualTeamStats playerStats={teamData.player} />
      </Box>

      <Collapse
        in={isOpen}
        timeout="auto"
        unmountOnExit
        sx={{ display: "flex", flexDirection: "column", gap: 4 }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="subtitle1"
              color="textSecondary"
              fontWeight={"bold"}
            >
              Current Rank
            </Typography>
            <div className="flex items-center justify-center gap-1">
              <Typography fontWeight={"bold"} variant="h6">
                {rank.name}
              </Typography>
              <div className="text-xl">{rank.icon}</div>
            </div>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="subtitle1"
                color="textSecondary"
                fontWeight={"bold"}
              >
                Peak ELO
              </Typography>
              <div className="flex items-center justify-center gap-0.5">
                <Typography variant="h5" fontWeight={"bold"}>
                  {teamData.player.highest_elo}
                </Typography>
                <EmojiEventsIcon color="warning" />
              </div>
            </Box>
            <Divider flexItem orientation="vertical" variant="middle" />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="subtitle1"
                color="textSecondary"
                fontWeight={"bold"}
              >
                Best Streak
              </Typography>
              <div className="flex items-center justify-center gap-0.5 w-full">
                <Typography variant="h5" fontWeight={"bold"}>
                  {teamData.player.longest_win_streak}
                </Typography>
                <WhatshotIcon color="warning" />
              </div>
            </Box>
          </Box>
        </Box>
        <Divider flexItem sx={{ my: 2 }} />
        {loadingEloHistory && (
          <Typography variant="body2" color="textSecondary">
            Loading Elo history...
          </Typography>
        )}
        {errorFetchingElo && (
          <Typography variant="body2" color="error">
            {errorFetchingElo}
          </Typography>
        )}
        {!loadingEloHistory && eloHistory.length > 0 && (
          <div className="p-1">
            <Typography variant="body1" fontWeight={"bold"} gutterBottom>
              Elo History
            </Typography>
            <EloHistoryChart data={eloHistory} />
          </div>
        )}
      </Collapse>
    </Paper>
  );
};

export default PlayerTeamStats;
