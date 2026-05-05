import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Divider,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Avatar,
  Stack,
  alpha,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import api from "../services/api";
import {
  Devices as DevicesIcon,
  PersonAdd as PersonAddIcon,
  Memory as MemoryIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Security as SecurityIcon,
  Fingerprint as FingerprintIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Dashboard as DashboardIcon
} from "@mui/icons-material";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState([]);
  const [caretakers, setCaretakers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCaretaker, setEditingCaretaker] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", elderName: "", deviceId: "" });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [caretakerToDelete, setCaretakerToDelete] = useState(null);

  const [form, setForm] = useState({ name: "", username: "", elders: [] });
  const [currentElder, setCurrentElder] = useState({ elderName: "", deviceId: "" });

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/devices");
      setDevices(res.data);
    } catch {
      showSnackbar("Failed to fetch devices", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCaretakers = async () => {
    try {
      const res = await api.get("/admin/caretakers/all");
      setCaretakers(res.data);
    } catch {
      showSnackbar("Failed to fetch caretakers", "error");
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchCaretakers();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const registerDevice = async () => {
    if (!deviceId.trim()) { showSnackbar("Please enter a device ID", "error"); return; }
    try {
      setLoading(true);
      await api.post("/admin/device", { deviceId });
      setDeviceId("");
      await fetchDevices();
      showSnackbar("Device registered successfully");
    } catch {
      showSnackbar("Failed to register device", "error");
    } finally {
      setLoading(false);
    }
  };

  const addElder = () => {
    if (!currentElder.elderName.trim() || !currentElder.deviceId.trim()) {
      showSnackbar("Please fill in elder name and device ID", "error"); return;
    }
    if (form.elders.some(e => e.deviceId === currentElder.deviceId)) {
      showSnackbar("This device is already assigned", "error"); return;
    }
    setForm({ ...form, elders: [...form.elders, { ...currentElder }] });
    setCurrentElder({ elderName: "", deviceId: "" });
  };

  const removeElder = (index) => {
    setForm({ ...form, elders: form.elders.filter((_, i) => i !== index) });
  };

  const createCaretaker = async () => {
    if (!form.name || !form.username || form.elders.length === 0) {
      showSnackbar("Please fill in all fields and add at least one elder", "error"); return;
    }
    try {
      setLoading(true);
      await api.post("/admin/caretaker", form);
      setForm({ name: "", username: "", elders: [] });
      setCurrentElder({ elderName: "", deviceId: "" });
      await fetchCaretakers();
      showSnackbar("Caretaker created successfully");
    } catch {
      showSnackbar("Failed to create caretaker", "error");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (caretaker) => {
    setEditingCaretaker(caretaker);
    setEditForm({ name: caretaker.name, elderName: "", deviceId: "" });
    setEditDialogOpen(true);
  };

  const updateCaretaker = async () => {
    if (!editingCaretaker || !editForm.name) {
      showSnackbar("Please fill in caretaker name", "error"); return;
    }
    try {
      setLoading(true);
      await api.put(`/admin/caretaker/${editingCaretaker._id}`, {
        name: editForm.name,
        elders: editingCaretaker.elders
      });
      setEditDialogOpen(false);
      setEditingCaretaker(null);
      await fetchCaretakers();
      showSnackbar("Caretaker updated successfully");
    } catch {
      showSnackbar("Failed to update caretaker", "error");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (caretaker) => {
    setCaretakerToDelete(caretaker);
    setDeleteConfirmOpen(true);
  };

  const deleteCaretaker = async () => {
    if (!caretakerToDelete) return;
    try {
      setLoading(true);
      await api.delete(`/admin/caretaker/${caretakerToDelete._id}`);
      setDeleteConfirmOpen(false);
      setCaretakerToDelete(null);
      await fetchCaretakers();
      showSnackbar("Caretaker deleted successfully");
    } catch {
      showSnackbar("Failed to delete caretaker", "error");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Total Devices", value: devices.length, icon: <DevicesIcon />, color: "#6366f1" },
    { label: "Active Devices", value: devices.length, icon: <CheckCircleIcon />, color: "#10b981" },
    { label: "Caretakers", value: caretakers.length, icon: <PersonIcon />, color: "#f59e0b" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3, mb: 4,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 3, color: "white", position: "relative", overflow: "hidden"
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}>
              <SecurityIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Admin Dashboard</Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage devices and caretakers for the Elder Fall Detection System
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {stats.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 4 }} key={index}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", borderRadius: 2, border: "1px solid rgba(255,255,255,0.2)" }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 48, height: 48 }}>{stat.icon}</Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{stat.value}</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>{stat.label}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e9ecef", height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar sx={{ bgcolor: alpha("#6366f1", 0.1), color: "#6366f1", width: 48, height: 48 }}><MemoryIcon /></Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Register New Device</Typography>
                  <Typography variant="body2">Add a new monitoring device to the system</Typography>
                </Box>
              </Stack>
              <TextField
                fullWidth label="Device ID" value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                InputProps={{ startAdornment: (<InputAdornment position="start"><FingerprintIcon /></InputAdornment>) }}
                sx={{ mb: 3 }}
              />
              <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={registerDevice} disabled={loading}>
                Register Device
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e9ecef" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                <Avatar sx={{ bgcolor: alpha("#10b981", 0.1), color: "#10b981", width: 48, height: 48 }}><PersonAddIcon /></Avatar>
                <Box><Typography variant="h6">Create New Caretaker</Typography></Box>
              </Stack>
              <Stack spacing={2}>
                <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} size="small" />
                <TextField fullWidth label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} size="small" />

                <Box sx={{ p: 2, bgcolor: alpha("#10b981", 0.05), borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: "block" }}>Add Assigned Elder</Typography>
                  <Stack spacing={1.5}>
                    <TextField fullWidth label="Elder Name" value={currentElder.elderName} onChange={(e) => setCurrentElder({ ...currentElder, elderName: e.target.value })} size="small" />
                    <TextField select fullWidth label="Device ID" value={currentElder.deviceId} onChange={(e) => setCurrentElder({ ...currentElder, deviceId: e.target.value })} size="small">
                      {devices.map(d => <MenuItem key={d._id} value={d.deviceId}>{d.deviceId}</MenuItem>)}
                    </TextField>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={addElder}>Add Elder</Button>
                  </Stack>
                </Box>

                {form.elders.map((elder, index) => (
                  <Chip key={index} label={`${elder.elderName} (${elder.deviceId})`} onDelete={() => removeElder(index)} sx={{ m: 0.5 }} />
                ))}

                <Button fullWidth variant="contained" color="success" startIcon={<AssignmentIcon />} onClick={createCaretaker}>
                  Create Caretaker Account
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e9ecef", borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell>Caretaker</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Elders</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {caretakers.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.username}</TableCell>
                    <TableCell>
                      {c.elders?.map((e, idx) => (
                        <Chip key={idx} label={e.elderName} size="small" sx={{ mr: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => openEditDialog(c)}><EditIcon /></IconButton>
                      <IconButton onClick={() => openDeleteConfirm(c)} color="error"><DeleteIcon /></IconButton>
                      <IconButton onClick={() => navigate(`/caretaker/${c._id}`)} color="primary"><DashboardIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth>
        <DialogTitle>Edit Caretaker</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={updateCaretaker} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete {caretakerToDelete?.name}?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={deleteCaretaker} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
