import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import {
  Backdrop,
  Box,
  Fade,
  IconButton,
  List,
  ListItem,
  ListItemText,
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
        sx={{ padding: 0 }}
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
              maxWidth: 600,
              maxHeight: "80vh",
              overflow: "auto",
              bgcolor: "background.paper",
              boxShadow: 24,
              width: { xs: "90%", md: "500px" }, // Similar width
              p: { xs: 2, sm: 3, md: 4 }, // Responsive padding
              borderRadius: 2,
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h5" fontWeight="bold" color="primary">
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
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="ELO Calculation" />
              <Tab label="Get started" />
            </Tabs>

            <Paper elevation={0} sx={{ p: 2 }}>
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
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      🚀 Getting Started with Ulti-ELO
                    </Typography>
                    <Typography variant="body1">
                      Ready to track your games and climb the leaderboard?
                      Here&rsquo;s how:
                    </Typography>
                  </Box>

                  <List dense disablePadding>
                    {/* Step 1 */}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="bold">
                            1. Create Your Account & Team
                          </Typography>
                        }
                        secondary={
                          <>
                            First things first, you&rsquo;ll need an account to
                            save your progress. Once you&rsquo;re signed up,
                            create your team! Then, start adding players to your
                            team roster. You can add yourself and your teammates
                            here.
                          </>
                        }
                      />
                    </ListItem>
                    {/* Step 2 */}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="bold">
                            2. Start a Session
                          </Typography>
                        }
                        secondary={
                          <>
                            Sessions are key! They help manage who&rsquo;s
                            playing on a given day and make setting up games a
                            breeze. Click &quot;Create New Session&quot; on your
                            team&rsquo;s Play tab.
                          </>
                        }
                      />
                    </ListItem>
                    {/* Step 3 */}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="bold">
                            3. Build Your Squads
                          </Typography>
                        }
                        secondary={
                          <>
                            Inside the session setup, you&rsquo;ll add attendees
                            for the day. Then, create your squads! You can
                            manually drag players, auto-assign them randomly, or
                            let the app create balanced teams based on ELO. Feel
                            free to make multiple rounds of squads (like mini
                            teams first, then full-field). Don&rsquo;t worry if
                            things change – you can edit squads or add more
                            rounds later!
                          </>
                        }
                      />
                    </ListItem>
                    {/* Step 4 */}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="bold">
                            4. Follow the Game Schedule
                          </Typography>
                        }
                        secondary={
                          <>
                            Once squads are set, Ulti-ELO generates a handy game
                            schedule for the round. Just read off the matchups
                            and click &quot;Record Score&quot; when a game
                            finishes. Need to adjust? You can easily reorder
                            games, add extra matchups, or delete games that
                            didn&rsquo;t happen.
                          </>
                        }
                      />
                    </ListItem>
                    {/* Step 5 */}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="bold">
                            5. Complete the Session & Review
                          </Typography>
                        }
                        secondary={
                          <>
                            When practice is over, hit &quot;Mark Complete&quot;
                            at the top of the session page. Remember, only one
                            session can be active per team. Afterwards, check
                            out the &quot;Session Review&quot; tab to see who
                            made the biggest ELO jumps and racked up the most
                            wins!
                          </>
                        }
                      />
                    </ListItem>
                    {/* Step 6 */}
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="bold">
                            6. Need to Fix Something?
                          </Typography>
                        }
                        secondary={
                          <>
                            Mistakes happen! You can edit individual game scores
                            or player lineups for up to 3 days after the game
                            was played. For bigger session changes (like
                            adding/removing attendees after the fact), you have
                            up to 7 days.
                          </>
                        }
                      />
                    </ListItem>
                  </List>

                  <Typography
                    variant="body2"
                    color="secondary"
                    fontWeight={"bold"}
                    sx={{ mt: 2, textAlign: "center" }}
                  >
                    Start creating sessions, tracking games, and watch your
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
