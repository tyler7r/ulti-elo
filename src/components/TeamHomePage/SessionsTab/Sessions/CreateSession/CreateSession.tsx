import { PlayerTeamType } from "@/lib/types";
import { saveNewSession } from "@/pages/api/create-session";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Fade,
  Modal,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import ConfirmSquadsStep from "./ConfirmSquadsStep";
import ResetSquadsConfirmation from "./CreateSessionModals/ResetSquadsConfirmation";
import CreateSquadsStep, { SessionSquad } from "./CreateSquads"; // Import types
import SelectAttendeesStep from "./SelectAttendees";

export type ColoredSquad = SessionSquad & { color: string };

export type AttendeeAssignment = {
  [attendeeId: string]: number | null;
};

type CreateSessionModalProps = {
  open: boolean;
  onClose: () => void;
  teamId: string;
  onSessionCreated: () => void;
};

export type RoundType = SessionSquad[] | null;

type AlertType = { message: null | string; severity: "error" | "success" };

const CreateSessionModal = ({
  open,
  onClose,
  teamId,
  onSessionCreated,
}: CreateSessionModalProps) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [sessionTitle, setSessionTitle] = useState("");
  const [defaultTitle, setDefaultTitle] = useState("");
  const [attendees, setAttendees] = useState<PlayerTeamType[]>([]);
  const firstOpen = useRef<boolean>(true);
  const [alert, setAlert] = useState<AlertType>({
    message: null,
    severity: "error",
  });
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
  const [squads, setSquads] = useState<RoundType[]>([null, null, null]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0); // To track the current round within CreateSquads
  const [haveSquadsBeenSaved, setHaveSquadsBeenSaved] = useState(false);
  const [isResetSquadsConfirmationOpen, setIsResetSquadsConfirmationOpen] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    "Session Details",
    "Select Players",
    "Create Squads",
    "Confirm Squads",
  ];

  useEffect(() => {
    if (open) {
      // Only calculate and set default title if it's the first time opening *since last close*
      if (firstOpen.current) {
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const day = now.getDate().toString().padStart(2, "0");
        const year = now.getFullYear().toString().slice(-2);
        const generatedTitle = `${month}/${day}/${year} Session`;
        setDefaultTitle(generatedTitle);
        if (sessionTitle === "") {
          setSessionTitle(generatedTitle);
        }
        firstOpen.current = false; // Mark as no longer the first open
      }
    } else {
      // Reset state when modal closes (moved from handleCloseModal for better effect management)
      setActiveStep(0);
      setSessionTitle(""); // Clear title on close
      setDefaultTitle("");
      setAttendees([]);
      setSquads([null, null, null]);
      setAlert({ message: null, severity: "error" });
      setHaveSquadsBeenSaved(false);
      setCurrentRoundIndex(0);
      setIsSubmitting(false); // Reset submitting state
      firstOpen.current = true;
    }
  }, [open, sessionTitle]);

  const handleNext = () => {
    if (activeStep === 0 && sessionTitle === "") {
      setSessionTitle(defaultTitle);
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    if (activeStep === 2 && haveSquadsBeenSaved) {
      setIsResetSquadsConfirmationOpen(true);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
      setAlert({ message: null, severity: "error" });
      if (activeStep === 2) {
        setCurrentRoundIndex(0); // Reset round index if going back from squads
      }
    }
  };

  const handleConfirmResetSquads = () => {
    setSquads([null, null, null]);
    setHaveSquadsBeenSaved(false);
    setIsResetSquadsConfirmationOpen(false);
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setCurrentRoundIndex(0);
  };

  const handleCloseResetSquadsConfirmation = () => {
    setIsResetSquadsConfirmationOpen(false);
  };

  const handleCloseModal = () => {
    onClose();
  };

  const handleAttendeesChange = (newAttendees: PlayerTeamType[]) => {
    setAttendees(newAttendees);
  };

  const handleRoundIndexChange = (index: number) => {
    setCurrentRoundIndex(index);
  };

  const handleSquadsSaved = (newSquads: RoundType[]) => {
    setSquads(newSquads);
    setHaveSquadsBeenSaved(true);
  };

  const handleEditRound = (roundIndex: number) => {
    setCurrentRoundIndex(roundIndex);
    setActiveStep(2);
  };

  const handleDeleteRound = (roundIndex: number) => {
    const updatedSquads = [...squads];
    updatedSquads[roundIndex] = null;
    setSquads(updatedSquads);
  };

  useEffect(() => {
    if (attendees.length < 4) {
      if (activeStep === 0 && sessionTitle !== "") {
        setNextBtnDisabled(false);
      } else setNextBtnDisabled(true);
    } else {
      setNextBtnDisabled(false);
    }
  }, [attendees, activeStep, sessionTitle]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setAlert({ message: null, severity: "error" });

    const result = await saveNewSession(
      teamId,
      sessionTitle,
      attendees,
      squads
    );

    setIsSubmitting(false);

    if (result.error) {
      console.error("Session save failed: ", result.error);
      setAlert({ message: "Failed to save session.", severity: "error" });
    } else {
      setAlert({ message: "Session saved successfully!", severity: "success" });
      setTimeout(() => {
        handleCloseModal();
        onSessionCreated();
        setAlert({ message: null, severity: "error" });
        void router.push(`/team/${teamId}/sessions/${result.sessionId}`);
      }, 500);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <>
            <Typography variant="h6" fontWeight={"bold"} fontStyle={"italic"}>
              Create New Session
            </Typography>
            <TextField
              fullWidth
              label="Session Title"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              margin="normal"
            />
          </>
        );
      case 1:
        return (
          <SelectAttendeesStep
            attendees={attendees}
            onAttendeesChange={handleAttendeesChange}
          />
        );
      case 2: // Create Squads Step
        return (
          <CreateSquadsStep
            attendees={attendees}
            onSkipToSchedule={() => setActiveStep(3)}
            handleBack={handleBack} // Use the modified handleBack
            currentRoundIndex={currentRoundIndex}
            onRoundIndexChange={handleRoundIndexChange}
            squads={squads}
            setSquads={handleSquadsSaved} // Use the new handler to track saving
          />
        );
      case 3:
        return (
          <ConfirmSquadsStep
            squads={squads}
            onEditRound={handleEditRound}
            onDeleteRound={handleDeleteRound}
            onAddRound={handleEditRound}
          />
        );
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleCloseModal}
      aria-labelledby="create-session-modal-title"
      aria-describedby="create-session-modal-description"
      closeAfterTransition
      slotProps={{ backdrop: { timeout: 500 } }}
      slots={{ backdrop: Backdrop }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", md: "50%" },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            overflow: "scroll",
            maxHeight: "80vh",
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box mt={2}>
            {alert.message && (
              <Alert severity={alert.severity} sx={{ mb: 2 }}>
                {alert.message}
              </Alert>
            )}
            {getStepContent(activeStep)}
          </Box>
          <Box
            mt={2}
            display="flex"
            width="100%"
            justifyContent={activeStep !== 0 ? "space-between" : "flex-end"}
          >
            {activeStep > 0 && activeStep !== 2 && (
              <Button onClick={handleBack}>Back</Button>
            )}
            {activeStep < steps.length - 1 && activeStep !== 2 && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={nextBtnDisabled}
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                Next
              </Button>
            )}
            {activeStep === 3 && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Session"}
              </Button>
            )}
          </Box>
          <ResetSquadsConfirmation
            handleCloseResetSquadsConfirmation={
              handleCloseResetSquadsConfirmation
            }
            handleConfirmResetSquads={handleConfirmResetSquads}
            isResetSquadsConfirmationOpen={isResetSquadsConfirmationOpen}
          />
        </Box>
      </Fade>
    </Modal>
  );
};

export default CreateSessionModal;
