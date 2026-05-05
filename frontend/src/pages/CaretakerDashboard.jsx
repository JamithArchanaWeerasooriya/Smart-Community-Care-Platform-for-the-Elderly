import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  Grid,
  Avatar,
  Stack,
  Chip,
  Dialog,
  DialogContent,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  alpha,
  Zoom,
  CircularProgress,
} from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import PersonIcon from "@mui/icons-material/Person";
import DevicesIcon from "@mui/icons-material/Devices";
import WarningIcon from "@mui/icons-material/Warning";
import ElderlyIcon from "@mui/icons-material/Elderly";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";

import Layout from "../components/Layout";
import api from "../services/api";

const CaretakerDashboard = () => {
  const { caretakerId } = useParams();
  const [caretaker, setCaretaker] = useState(null);
  const [selectedElder, setSelectedElder] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingCaretaker, setFetchingCaretaker] = useState(true);
  const [fallAlertOpen, setFallAlertOpen] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("/alarm.wav");
    audioRef.current.loop = true;
  }, []);

  useEffect(() => {
    if (!caretakerId) return;
    const fetchCaretaker = async () => {
      setFetchingCaretaker(true);
      try {
        const caretakerRes = await api.get(`/admin/caretakers`);
        const found = caretakerRes.data.find((c) => c._id === caretakerId);
        if (found) {
          setCaretaker(found);
          if (found.elders && found.elders.length > 0) {
            setSelectedElder(found.elders[0].deviceId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch caretaker:", err);
      } finally {
        setFetchingCaretaker(false);
      }
    };
    fetchCaretaker();
  }, [caretakerId]);

  useEffect(() => {
    if (!caretaker || !selectedElder) return;
    const controller = new AbortController();
    let cancelled = false;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const year = new Date().getFullYear();
        const res = await api.get(
          `/caretaker/monthly-report?deviceId=${selectedElder}&month=${selectedMonth}&year=${year}`,
          { signal: controller.signal }
        );
        if (!cancelled) setReport(res.data);
      } catch (err) {
        if (cancelled) return;
        if (err.name === "AbortError" || err.name === "CanceledError") return;
        setReport(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchReport();
    return () => { cancelled = true; controller.abort(); };
  }, [caretaker, selectedElder, selectedMonth]);

  useEffect(() => {
    if (!caretaker || !selectedElder) return;
    const checkFall = async () => {
      try {
        const res = await api.get(`/caretaker/fall/${selectedElder}`);
        const { fall, createdAt } = res.data;
        if (fall && createdAt !== lastCheckedTime) {
          setLastCheckedTime(createdAt);
          setFallAlertOpen(true);
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(() => {});
          }
        }
      } catch { /* silent fail */ }
    };
    checkFall();
    const interval = setInterval(checkFall, 5000);
    return () => clearInterval(interval);
  }, [caretaker, selectedElder, lastCheckedTime]);

  const stopAlarm = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setFallAlertOpen(false);
  };

  if (fetchingCaretaker) {
    return (
      <Layout role="caretaker">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!caretaker) {
    return (
      <Layout role="caretaker">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
            <InfoIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "#475569" }}>Caretaker not found.</Typography>
          </Paper>
        </Box>
      </Layout>
    );
  }

  const dailyData = Array.isArray(report?.dailyData) ? report.dailyData : [];
  const avgFalls = dailyData.length > 0
    ? (dailyData.reduce((acc, d) => acc + (d.falls || 0), 0) / dailyData.length).toFixed(1)
    : "0.0";
  const maxFalls = dailyData.length > 0 ? Math.max(...dailyData.map((d) => d.falls || 0)) : 0;
  const peakDay = dailyData.length > 0
    ? dailyData.reduce((mx, d) => ((d.falls || 0) > (mx.falls || 0) ? d : mx), dailyData[0])?.day ?? "N/A"
    : "N/A";
  const top3Days = [...dailyData].sort((a, b) => (b.falls || 0) - (a.falls || 0)).slice(0, 3);
  const prob = report?.probability ?? 0;
  const riskColor = prob > 70 ? "#ef4444" : prob > 30 ? "#f59e0b" : "#10b981";
  const riskLabel = prob > 70 ? "High" : prob > 30 ? "Medium" : "Low";

  return (
    <Layout role="caretaker">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Avatar sx={{ bgcolor: alpha("#ef4444", 0.1), color: "#ef4444", width: 56, height: 56 }}>
            <NotificationsActiveIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b" }}>Caretaker Dashboard</Typography>
            <Typography variant="body1" sx={{ color: "#64748b" }}>Monitor and respond to fall detection alerts</Typography>
          </Box>
        </Stack>
        <Divider sx={{ borderColor: "#e2e8f0" }} />
      </Box>

      {/* Profile Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", height: "100%", transition: "all 0.2s ease", "&:hover": { borderColor: "#3b82f6", boxShadow: "0 8px 24px rgba(59,130,246,0.1)" } }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: alpha("#3b82f6", 0.1), color: "#3b82f6", width: 56, height: 56 }}>
                <PersonIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 0.5 }}>Caretaker</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>{caretaker.name}</Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8" }}>@{caretaker.username}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", height: "100%" }}>
            {caretaker.elders && caretaker.elders.length > 0 ? (
              <FormControl fullWidth>
                <InputLabel sx={{ color: "#64748b" }}>Select Elder</InputLabel>
                <Select value={selectedElder} label="Select Elder" onChange={(e) => setSelectedElder(e.target.value)}
                  sx={{ borderRadius: 2, bgcolor: alpha("#10b981", 0.05) }}>
                  {caretaker.elders.map((elder) => (
                    <MenuItem key={elder.deviceId} value={elder.deviceId}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ElderlyIcon sx={{ fontSize: 18 }} />
                        <Typography>{elder.elderName}</Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>({elder.deviceId})</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#fef2f2", borderRadius: 2, border: "1px solid #fee2e2" }}>
                <ElderlyIcon sx={{ fontSize: 48, color: "#ef4444", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "#1e293b", fontWeight: 600, mb: 1 }}>No Elders Assigned</Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>Please contact the admin to assign elders.</Typography>
              </Paper>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", height: "100%" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: alpha("#8b5cf6", 0.1), color: "#8b5cf6", width: 56, height: 56 }}>
                <DevicesIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 0.5 }}>Assigned Device</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip icon={<DevicesIcon />} label={selectedElder || "None"} size="medium"
                    sx={{ bgcolor: alpha("#8b5cf6", 0.1), color: "#8b5cf6", fontWeight: 600 }} />
                  {selectedElder && <Chip label="Active" size="small" sx={{ bgcolor: alpha("#10b981", 0.1), color: "#10b981", height: 24 }} />}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Falls", value: report?.totalFalls ?? 0, color: "#3b82f6", icon: <WarningAmberIcon /> },
          { label: "Total Records", value: report?.totalRecords ?? 0, color: "#10b981", icon: <ShowChartIcon /> },
          { label: "Probability", value: `${prob}%`, color: "#f59e0b", icon: <TrendingUpIcon /> },
          { label: "Daily Average", value: avgFalls, color: "#8b5cf6", icon: <CalendarMonthIcon /> },
        ].map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0" }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: alpha(stat.color, 0.1), color: stat.color }}>{stat.icon}</Avatar>
                <Box>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>{stat.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>{stat.value}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Chart + Sidebar */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <Box sx={{ p: 3, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Avatar sx={{ bgcolor: alpha("#3b82f6", 0.1), color: "#3b82f6" }}><ShowChartIcon /></Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>Monthly Fall Report</Typography>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    {caretaker.elders?.find((e) => e.deviceId === selectedElder)?.elderName ?? "Elder"} • {new Date(0, selectedMonth - 1).toLocaleString("default", { month: "long" })} {new Date().getFullYear()}
                  </Typography>
                </Box>
              </Stack>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Month</InputLabel>
                <Select value={selectedMonth} label="Select Month" onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  sx={{ borderRadius: 2, bgcolor: "#ffffff" }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("default", { month: "long" })}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ p: 3 }}>
              {loading ? (
                <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <CircularProgress size={40} sx={{ color: "#3b82f6" }} />
                  <Typography variant="body2" sx={{ color: "#94a3b8" }}>Loading report data…</Typography>
                </Box>
              ) : dailyData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                      <Area type="monotone" dataKey="falls" stroke="#3b82f6" strokeWidth={3} fill="url(#colorFalls)"
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }} />
                      <ReferenceLine y={0} stroke="#e2e8f0" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <Box sx={{ mt: 2, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>Peak Fall Day</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 0.5 }}>Day {peakDay}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>Maximum Falls</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mt: 0.5 }}>{maxFalls}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>Risk Level</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip label={riskLabel} size="small" sx={{ bgcolor: alpha(riskColor, 0.1), color: riskColor, fontWeight: 600 }} />
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <ShowChartIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 2 }} />
                  <Typography variant="h6" sx={{ color: "#64748b", mb: 1 }}>No Data Available</Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8" }}>No fall records found for the selected month</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <Box sx={{ p: 2.5, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ bgcolor: alpha("#ef4444", 0.1), color: "#ef4444", width: 40, height: 40 }}>
                    <TrendingUpIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1e293b" }}>Top 3 Days</Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>Highest fall counts</Typography>
                  </Box>
                </Stack>
              </Box>
              <Box sx={{ p: 2.5 }}>
                {loading ? (
                  <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress size={28} /></Box>
                ) : top3Days.length > 0 ? (
                  <Stack spacing={2}>
                    {top3Days.map((day, idx) => {
                      const color = idx === 0 ? "#ef4444" : idx === 1 ? "#f59e0b" : "#3b82f6";
                      return (
                        <Box key={idx} sx={{ p: 2, bgcolor: alpha(color, 0.05), borderRadius: 2, border: `1px solid ${alpha(color, 0.2)}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1e293b" }}>#{idx + 1} Day {day.day}</Typography>
                            <Typography variant="caption" sx={{ color: "#64748b" }}>
                              {new Date(0, selectedMonth - 1, day.day).toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric" })}
                            </Typography>
                          </Stack>
                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color }}>{day.falls}</Typography>
                            <Typography variant="caption" sx={{ color: "#94a3b8" }}>falls</Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center", py: 4 }}>No fall data available</Typography>
                )}
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", p: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Avatar sx={{ bgcolor: alpha("#3b82f6", 0.1), color: "#3b82f6", width: 40, height: 40 }}>
                  <ShowChartIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1e293b" }}>This Month Summary</Typography>
              </Stack>
              <Stack spacing={2}>
                <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>Total Falls</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b", mt: 0.5 }}>{report?.totalFalls ?? 0}</Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>Average per Day</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b", mt: 0.5 }}>{avgFalls}</Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5 }}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500 }}>Risk Assessment</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={report?.probability != null ? `${report.probability}% Risk` : "N/A"} size="small"
                      sx={{ bgcolor: alpha(riskColor, 0.1), color: riskColor, fontWeight: 600 }} />
                  </Box>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* Emergency Alert Dialog */}
      <Dialog open={fallAlertOpen} fullWidth maxWidth="sm" TransitionComponent={Zoom}
        PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}>
        <Box sx={{ bgcolor: "#ef4444", p: 2, textAlign: "center" }}>
          <Typography variant="h5" sx={{ color: "#ffffff", fontWeight: 700 }}>EMERGENCY ALERT</Typography>
        </Box>
        <DialogContent sx={{ p: 4, textAlign: "center" }}>
          <Zoom in>
            <WarningIcon sx={{ fontSize: 100, color: "#ef4444", mb: 2 }} />
          </Zoom>
          <Typography variant="h3" sx={{ fontWeight: 800, color: "#ef4444", mb: 2, letterSpacing: 2 }}>FALL DETECTED!</Typography>
          <Paper elevation={0} sx={{ p: 3, bgcolor: "#fef2f2", borderRadius: 3, mb: 3, border: "1px solid #fee2e2" }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} mb={2}>
              <ElderlyIcon sx={{ color: "#ef4444", fontSize: 32 }} />
              <Typography variant="h5" sx={{ color: "#1e293b", fontWeight: 600 }}>
                {caretaker.elders?.find((e) => e.deviceId === selectedElder)?.elderName ?? "Elder"}
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ color: "#475569", mb: 1 }}><strong>Device ID:</strong> {selectedElder}</Typography>
            <Typography variant="body1" sx={{ color: "#475569" }}><strong>Time:</strong> {new Date().toLocaleTimeString()}</Typography>
          </Paper>
          <Typography variant="body1" sx={{ color: "#64748b", mb: 4 }}>Immediate medical attention is required. Please respond immediately.</Typography>
          <Button variant="contained" size="large" onClick={stopAlarm} startIcon={<CheckCircleIcon />}
            sx={{ px: 6, py: 2, fontSize: "1.2rem", fontWeight: 700, borderRadius: 3, background: "#ef4444",
              "&:hover": { background: "#dc2626" }, transition: "all 0.2s ease" }}>
            ACKNOWLEDGE & STOP ALARM
          </Button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CaretakerDashboard;
