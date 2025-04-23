import Header from "@/components/Navbar/Header";
import AuthProvider from "@/contexts/AuthProvider";
import "@/styles/globals.css";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const lightTheme = createTheme({
    palette: {
      mode: "light", // Specifies it's a light theme
      primary: {
        main: "#1976d2", // Custom primary color for light mode
      },
      secondary: {
        main: "#ff4081", // Custom secondary color for light mode
      },
      background: {
        default: "#f4f6f8", // Custom background color for light mode
        paper: "#ffffff", // Paper background for light mode
      },
      text: {
        primary: "#000000", // Custom text color for light mode
        secondary: "#555555", // Secondary text color for light mode
      },
    },
  });

  const darkTheme = createTheme({
    palette: {
      mode: "dark", // Specifies it's a dark theme
      primary: {
        main: "#90caf9", // Custom primary color for dark mode
      },
      secondary: {
        main: "#f48fb1", // Custom secondary color for dark mode
      },
      background: {
        default: "#222222", // Custom background color for dark mode
        paper: "#333333", // Paper background for dark mode
      },
      text: {
        primary: "#ffffff", // Custom text color for dark mode
        secondary: "#bbbbbb", // Secondary text color for dark mode
      },
    },
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <AuthProvider>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <div
          style={{
            minHeight: "100vh",
            background: isDarkMode ? "#222222" : "#f4f6f8",
            color: isDarkMode ? "#ffffff" : "#000000",
          }}
        >
          <Head>
            <title>Ulti ELO</title>
          </Head>
          <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
