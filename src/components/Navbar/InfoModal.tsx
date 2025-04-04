import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import {
  Backdrop,
  Box,
  Fade,
  IconButton,
  Modal,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

const InfoModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setTabIndex(newValue);

  return (
    <>
      {/* Info Button */}
      <IconButton
        onClick={handleOpen}
        aria-label="Info"
        color="secondary"
        size="small"
      >
        <InfoIcon fontSize="small" />
      </IconButton>

      {/* Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={open}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: 600,
              maxHeight: "50vh",
              overflow: "auto",
              bgcolor: "background.paper",
              boxShadow: 24,
              borderRadius: 2,
              p: 3,
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h5" fontWeight="bold" color="secondary">
                How Ulti ELO works
              </Typography>
              <IconButton
                onClick={handleClose}
                sx={{ position: "fixed", top: 5, right: 5 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{ mt: 2 }}
            >
              <Tab label="ELO Calculation" />
              <Tab label="Get started" />
            </Tabs>

            <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
              {tabIndex === 0 && (
                <Box display="flex" flexDirection="column" gap={2}>
                  <div className="flex flex-col">
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      🛠️ How ELO is calculated
                    </Typography>
                    <Typography variant="body1" component="p">
                      Your **ELO rating** is a number that represents your skill
                      level. After each game, your rating changes based on
                      whether you win or lose, who you played against, and the
                      score difference.
                    </Typography>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      ✨ Here is how it works:
                    </Typography>
                    <ul>
                      <li>
                        <strong>TrueSkill Ratings:</strong> Each player has two
                        hidden values: <em>mu</em> (your skill) and{" "}
                        <em>sigma</em> (uncertainty). After every game, your{" "}
                        <em>mu</em> goes up or down depending on your
                        performance. Your ELO is simply: <em>mu</em> * 100.
                      </li>
                      <li>
                        <strong>Uncertainty:</strong> Each match you play will
                        decrease your <em>sigma</em> (uncertainty). A high{" "}
                        <em>sigma</em> means a higher shift in ELO associated
                        with that game.
                        <Typography
                          variant="body2"
                          color="secondary"
                          fontWeight="bold"
                        >
                          Think of your first 10-15 games as your placement
                          games, you will likely see large ELO jumps with each
                          game but as you play more this measure will start to
                          stabilize.
                        </Typography>
                      </li>
                      <li>
                        <strong>Score Influence:</strong> The larger the score
                        difference, the more your rating changes. If you barely
                        win, your ELO will not increase much, but if you
                        dominate, you gain more.
                      </li>
                      <li>
                        <strong>Underdog Boost:</strong> Before each match, the
                        average ELO of each squad is taken to determine their
                        respective strength score. If your squad beats a
                        stronger opponent, you gain extra ELO points and in turn
                        they lose extra ELO points. This makes it rewarding to
                        upset higher-rated teams.
                      </li>
                    </ul>
                    <Typography variant="body2" color="textSecondary">
                      Example: If your team (lower ELO) beats a stronger team,
                      you will gain more points than usual. If you lose to a
                      lower-rated team, you will lose more points.
                    </Typography>
                  </div>
                </Box>
              )}

              {tabIndex === 1 && (
                <Box
                  display="flex"
                  flexDirection="column"
                  gap={2}
                  className="text-sm"
                >
                  <div className="flex flex-col">
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      🚀 Getting Started with Ulti-ELO
                    </Typography>
                    <Typography variant="body1" component="p">
                      Here is how you can **start tracking your games** and
                      climbing the leaderboard:
                    </Typography>
                  </div>

                  <Typography variant="body1">
                    ✅ 1. Create Your Player & Team
                  </Typography>
                  <ul className="text-sm">
                    <li>
                      Click the <strong className="text-lg">+</strong> button in
                      the top-right corner. Then{" "}
                      <strong>
                        &ldquo;Create Player&rdquo; / &ldquo;Create Team&rdquo;
                      </strong>
                      .
                    </li>
                    <li>Name your player and associate it with your team.</li>
                    <li>
                      Create your team and add your teammates by repeating the
                      process.
                    </li>
                  </ul>

                  <Typography variant="body1">
                    📋 2. Manage Your Squads
                  </Typography>
                  <ul>
                    <li>
                      Once your team is created, it will appear on the home
                      screen.
                    </li>
                    <li>
                      Click into your team to **create scrimmage squads** from
                      your player list.
                    </li>
                    <li>
                      You must have at least **two squads** before recording
                      your first game.
                    </li>
                  </ul>

                  <Typography variant="body1">
                    🎯 3. Playing Multiple Games
                  </Typography>
                  <ul>
                    <li>
                      If you plan on playing multiple games, **reuse your
                      squads** instead of creating new ones every time.
                    </li>
                    <li>
                      Players can not be on **two active squads** at once. To
                      switch a player between squads, edit the squads first.
                    </li>
                  </ul>

                  <Typography variant="body1">
                    🔥 4. Retire & Refresh
                  </Typography>
                  <ul>
                    <li>
                      After a series of games, you can **retire your squads**
                      and create new ones for fresh matchups.
                    </li>
                    <li>
                      No stress—retiring squads will not delete your game
                      history!
                    </li>
                  </ul>

                  <Typography variant="body2" color="textSecondary">
                    Start creating squads, tracking games, and watch your
                    **Ulti-ELO climb**! 🚀
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default InfoModal;
