import {
  AppBar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Divider,
  useTheme,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";

const drawerWidth = 260;

const Layout = ({ children, role }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* APP BAR */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: "#ffffff",
          color: "#1e293b",
          borderBottom: "1px solid #e2e8f0",
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MedicalServicesIcon sx={{ color: "#2563eb" }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              ElderCare Sentinel
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Typography variant="body2" sx={{ mr: 2 }}>
            {role === "admin" ? "Administrator" : "Caregiver"}
          </Typography>

          <Avatar sx={{ bgcolor: "#2563eb" }}>
            {role === "admin" ? "A" : "C"}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* DRAWER */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            backgroundColor: "#ffffff",
            display: "flex",
            flexDirection: "column"
          }
        }}
      >
        <Toolbar />
        <Box sx={{ px: 2, py: 3, flexGrow: 1 }}>
          <List>
            <ListItemButton selected>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </List>
          <Divider sx={{ my: 3 }} />
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          mt: 8,
          backgroundColor: "#f8fafc"
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
