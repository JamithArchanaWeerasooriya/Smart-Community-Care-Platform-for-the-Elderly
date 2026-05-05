import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#0D47A1" },
    secondary: { main: "#00897B" },
    background: { default: "#ffffff", paper: "#ffffff" }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "Inter, sans-serif",
    h5: { fontWeight: 600 }
  }
});

export default theme;
