import { supabase } from "@/lib/supabase";
import { TeamType } from "@/lib/types";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal"; // NEW IMPORT
import NoAccessPage from "./NoAccess";

interface TeamSettingsTabProps {
  team: TeamType;
  onTeamUpdated: () => void;
  setSnackbarMessage: (message: string) => void;
  setSnackbarOpen: (open: boolean) => void;
  isAdmin: boolean;
  ownerName: string | undefined;
}

const TeamSettingsTab = ({
  team,
  onTeamUpdated,
  setSnackbarMessage,
  setSnackbarOpen,
  isAdmin,
  ownerName,
}: TeamSettingsTabProps) => {
  const router = useRouter();
  const [teamName, setTeamName] = useState(team?.name || "");
  const [initialTeamName, setInitialTeamName] = useState(team?.name || "");
  const [initialLogoUrl, setInitialLogoUrl] = useState(team?.logo_url || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [disabled, setDisabled] = useState(true);
  const [isRemovingLogo, setIsRemovingLogo] = useState(false);
  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    setTeamName(team?.name || "");
    setInitialTeamName(team?.name || "");
    setInitialLogoUrl(team?.logo_url || null);
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setIsRemovingLogo(false);
  }, [team]);

  // ... (Logo and Save functions remain the same) ...

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    } else {
      setLogoFile(null);
      setLogoPreviewUrl(null);
    }
    setIsRemovingLogo(false);
  };

  const handleButtonClick = () => {
    if (!isAdmin) return;
    fileInputRef.current?.click();
  };

  const handleRemoveNewLogo = () => {
    if (!isAdmin) return;
    setLogoFile(null);
    setLogoPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsRemovingLogo(false);
  };

  const handleRemoveExistingLogo = () => {
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setIsRemovingLogo(true);
  };

  const uploadLogo = async (
    file: File,
    teamId: string
  ): Promise<string | null> => {
    if (!isAdmin) return null;
    try {
      const fileExt = file.name.split(".").pop();
      const timestamp = Date.now();
      const filePath = `team-logos/${teamId}-${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("team-logos") // Replace with your bucket name
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading logo:", uploadError);
        setSnackbarMessage(`Error uploading logo: ${uploadError.message}`);
        setSnackbarOpen(true);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from("team-logos") // Replace with your bucket name
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error("Error during logo upload:", err);
      setSnackbarMessage("An unexpected error occurred during logo upload.");
      setSnackbarOpen(true);
      return null;
    }
  };

  const handleSaveSettings = async () => {
    if (!team?.id || !isAdmin) return;
    let hasChanges = false;

    // Update team name if changed
    if (teamName !== initialTeamName) {
      hasChanges = true;
      const { error } = await supabase
        .from("teams")
        .update({ name: teamName })
        .eq("id", team.id);

      if (error) {
        console.error("Error updating team name:", error.message);
        setSnackbarMessage(`Error updating team name: ${error.message}`);
        setSnackbarOpen(true);
        return; // Stop if name update fails
      } else {
        setSnackbarMessage("Team settings updated successfully!");
        setSnackbarOpen(true);
      }
    }

    // Handle logo updates
    if (logoFile) {
      hasChanges = true;
      const logoUrl = await uploadLogo(logoFile, team.id);
      if (logoUrl) {
        const { error } = await supabase
          .from("teams")
          .update({ logo_url: logoUrl })
          .eq("id", team.id);

        if (error) {
          console.error("Error updating team with logo URL:", error.message);
          setSnackbarMessage(`Error updating team logo: ${error.message}`);
          setSnackbarOpen(true);
          return; // Stop if logo update fails
        } else if (!hasChanges) {
          setSnackbarMessage("Team settings updated successfully!");
          setSnackbarOpen(true);
        }
        setLogoFile(null);
        setLogoPreviewUrl(null);
        setInitialLogoUrl(logoUrl); // Update initial logo URL after successful upload
      }
    } else if (isRemovingLogo && initialLogoUrl !== null) {
      hasChanges = true;
      const { error } = await supabase
        .from("teams")
        .update({ logo_url: null })
        .eq("id", team.id);

      if (error) {
        console.error("Error removing team logo:", error.message);
        setSnackbarMessage(`Error removing team logo: ${error.message}`);
        setSnackbarOpen(true);
        return; // Stop if logo removal fails
      } else if (!hasChanges) {
        setSnackbarMessage("Team settings updated successfully!");
        setSnackbarOpen(true);
      }
      setInitialLogoUrl(null);
      setIsRemovingLogo(false);
    }

    if (hasChanges) {
      onTeamUpdated(); // Refresh data in parent component
    } else if (!hasChanges && logoFile === null && !isRemovingLogo) {
      setSnackbarMessage("No changes to save.");
      setSnackbarOpen(true);
    }
  };

  const handleRevertChanges = () => {
    setTeamName(initialTeamName);
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setIsRemovingLogo(false);
  };

  const isSaveDisabled =
    teamName === initialTeamName &&
    logoFile === null &&
    logoPreviewUrl === null &&
    team?.logo_url === initialLogoUrl &&
    !isRemovingLogo;

  useEffect(() => {
    setDisabled(isSaveDisabled);
  }, [isSaveDisabled]);

  // --- Delete Logic Updated ---

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  // This function is now passed to the modal as onConfirmDelete
  const handleDeleteTeam = async () => {
    if (!team?.id || !isAdmin) return;

    const { error } = await supabase.from("teams").delete().eq("id", team.id);

    if (error) {
      console.error("Error deleting team:", error.message);
      setSnackbarMessage(`Error deleting team: ${error.message}`);
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage(`Team '${team.name}' successfully deleted.`);
      setSnackbarOpen(true);
      void router.push("/");
    }
    // The modal handles its own close and state reset,
    // but a final close here ensures it is closed after success/error.
    handleCloseDeleteModal();
  };

  // --- End Delete Logic ---

  return !isAdmin ? (
    <NoAccessPage ownerName={ownerName} isAdmin={isAdmin} team={team} />
  ) : (
    <Box p={2} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="h5" fontWeight={"bold"}>
        Edit {team.name}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, px: 1 }}>
        <TextField
          label="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          fullWidth
          margin="normal"
          size="small"
        />
        <Typography variant="h6" fontWeight={"bold"}>
          Team Logo
        </Typography>
        {team?.logo_url && !logoPreviewUrl && !isRemovingLogo && (
          <Box
            sx={{
              position: "relative",
              width: "100px",
              borderRadius: "4px",
              overflow: "hidden",
              mb: 2,
            }}
          >
            <Image
              src={team.logo_url}
              alt="Current Team Logo"
              width={100}
              height={100}
              style={{ objectFit: "cover" }}
            />
          </Box>
        )}
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            component="span"
            onClick={handleButtonClick}
            startIcon={<CloudUploadIcon />}
            size="small"
            sx={{ textWrap: "nowrap" }}
          >
            Choose New Logo
          </Button>
          <Typography variant="body2" color="textSecondary">
            {logoFile ? logoFile.name : "No file chosen"}
          </Typography>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          {logoPreviewUrl && (
            <IconButton
              onClick={handleRemoveNewLogo}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
        {team?.logo_url && !logoPreviewUrl && !isRemovingLogo && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleRemoveExistingLogo}
            size="small"
            className="mt-2"
          >
            Remove Logo
          </Button>
        )}
        {logoPreviewUrl && (
          <Box
            sx={{
              position: "relative",
              width: "100px",
              borderRadius: "4px",
              overflow: "hidden",
              mb: 2,
            }}
          >
            <Image
              src={logoPreviewUrl}
              alt="Logo Preview"
              width={100}
              height={100}
              style={{ objectFit: "cover" }}
            />
          </Box>
        )}
        {isRemovingLogo && (
          <Typography variant="body2" color="textSecondary" className="mt-2">
            Logo will be removed upon saving.
          </Typography>
        )}
        <Box
          mt={1}
          display={"flex"}
          justifyContent={"flex-end"}
          width={"100%"}
          gap={1}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={handleRevertChanges}
            color="secondary"
            disabled={disabled}
          >
            Revert Changes
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSettings}
            disabled={disabled}
            size="small"
          >
            Save Settings
          </Button>
        </Box>
      </Box>

      {/* --- Delete Team Section --- */}
      <Box
        mt={4}
        p={2}
        border={1}
        borderColor="error.main"
        borderRadius={1}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" color="error">
          Danger Zone
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleOpenDeleteModal}
          size="small"
        >
          Delete Team
        </Button>
      </Box>
      {/* --- End Delete Team Section --- */}

      {/* --- Confirm Delete Modal Component --- */}
      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        teamName={team.name}
        onConfirmDelete={handleDeleteTeam}
      />
      {/* --- End Confirm Delete Modal Component --- */}
    </Box>
  );
};

export default TeamSettingsTab;
