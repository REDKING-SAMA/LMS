import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Box, Grid, Typography, Paper, Chip, Avatar,
  ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import {
  PeopleRounded, BadgeRounded, MenuBookRounded,
  EventAvailableRounded, AccessTimeRounded, FiberManualRecordRounded,
} from "@mui/icons-material";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  collection, getDocs, onSnapshot, query,
  orderBy, limit,
} from "firebase/firestore";
import { db } from "../../firebase";

// ── Brand tokens ─────────────────────────────────────────────────────────────
const B = {
  navy: "#0f172a", mid: "#1a2744", blue: "#3b82f6",
  green: "#10b981", amber: "#f59e0b", red: "#ef4444",
  purple: "#8b5cf6", muted: "rgba(15,23,42,0.45)",
  border: "#e2e8f0", bg: "#f8fafc", surface: "#ffffff",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (ts) => (!ts?.toDate) ? "" : ts.toDate().toISOString().split("T")[0];
const isP   = (s)  => s?.toString().trim().toLowerCase() === "present";
const isA   = (s)  => s?.toString().trim().toLowerCase() === "absent";
const today = new Date().toISOString().split("T")[0];
const month = new Date().toISOString().slice(0, 7);

const calcAvg = (arr) =>
  arr.length === 0 ? 0 : Math.round((arr.filter(d => isP(d.status)).length / arr.length) * 100);

const aggregate = (data, view) => {
  const cutoff = new Date();
  if (view === "weekly") cutoff.setDate(cutoff.getDate() - 7);
  const filtered = data.filter(d =>
    view === "daily"   ? fmt(d.dateString) === today :
    view === "weekly"  ? d.dateString?.toDate?.() >= cutoff : true
  );
  const map = filtered.reduce((acc, d) => {
    const date = fmt(d.dateString); if (!date) return acc;
    if (!acc[date]) acc[date] = { name: date, present: 0, absent: 0 };
    if (isP(d.status)) acc[date].present++; else if (isA(d.status)) acc[date].absent++;
    return acc;
  }, {});
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
};

// ── Sub-components ────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay, ease: "easeOut" },
});

function KpiCard({ label, value, icon, color, delay }) {
  return (
    <motion.div {...fadeUp(delay)} style={{ height: "100%" }}>
      <Paper elevation={0} sx={{
        p: 2.5, borderRadius: "16px", border: `1px solid ${B.border}`,
        display: "flex", alignItems: "center", gap: 2, height: "100%",
        transition: "box-shadow .2s,transform .2s",
        "&:hover": { boxShadow: "0 8px 28px rgba(15,23,42,0.09)", transform: "translateY(-2px)" },
      }}>
        <Avatar sx={{ bgcolor: `${color}18`, width: 48, height: 48 }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
        </Avatar>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 600, color: B.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: B.navy, lineHeight: 1.1 }}>{value}</Typography>
        </Box>
      </Paper>
    </motion.div>
  );
}

const toggleSx = (accent) => ({
  bgcolor: B.surface, border: `1px solid ${B.border}`, borderRadius: "10px", p: 0.4,
  "& .MuiToggleButton-root": {
    border: "none", borderRadius: "8px !important", px: 2, py: 0.5,
    fontSize: 12, fontWeight: 500, color: B.muted, textTransform: "none",
    transition: "all .18s",
    "&.Mui-selected": { bgcolor: accent, color: "#fff", "&:hover": { bgcolor: accent } },
    "&:hover": { bgcolor: "#f1f5f9", color: B.navy },
  },
});

function AttendanceChart({ title, data, accent, view, onView }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: "16px", border: `1px solid ${B.border}`, width:'100%' }}>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", mb: 2.5 }}>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: B.navy }}>{title}</Typography>
          <Typography sx={{ fontSize: 12, color: B.muted }}>Present vs Absent</Typography>
        </Box>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && onView(v)} sx={toggleSx(accent)}>
          {["daily", "weekly", "monthly"].map(v => <ToggleButton key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            {[["p", accent], ["a", B.red]].map(([k, c]) => (
              <linearGradient key={k} id={`g${k}${accent}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={c} stopOpacity={0.15} />
                <stop offset="95%" stopColor={c} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: B.muted }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: B.muted }} axisLine={false} tickLine={false} width={28} />
          <Tooltip contentStyle={{ background: B.navy, border: "none", borderRadius: 10, fontSize: 12, color: "#fff" }} itemStyle={{ color: "#fff" }} labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }} />
          <Area type="monotone" dataKey="present" stroke={accent} fill={`url(#gp${accent})`} strokeWidth={2.5} dot={false} name="Present" activeDot={{ r: 5, fill: accent, stroke: "#fff", strokeWidth: 2 }} />
          <Area type="monotone" dataKey="absent"  stroke={B.red}   fill={`url(#ga${accent})`} strokeWidth={2.5} dot={false} name="Absent"  activeDot={{ r: 5, fill: B.red,   stroke: "#fff", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
}

const DOT_COLORS = { events: B.blue, attendance: B.green, registrations: B.amber, courses: B.purple };

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [counts,         setCounts]         = useState({ totalStudents: 0, totalStaff: 0, totalCourses: 0 });
  const [studentStats,   setStudentStats]   = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [staffStats,     setStaffStats]     = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [studentView,    setStudentView]    = useState("weekly");
  const [staffView,      setStaffView]      = useState("weekly");
  const [studentChart,   setStudentChart]   = useState([]);
  const [staffChart,     setStaffChart]     = useState([]);
  const [events,         setEvents]         = useState([]);
  const [logs,           setLogs]           = useState([]);

  // Counts
  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "registrations")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "courses")),
    ]).then(([r, u, c]) => setCounts({ totalStudents: r.size, totalStaff: u.size, totalCourses: c.size }));
  }, []);

  // Attendance snapshot
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "attendance")), (snap) => {
      const raw = snap.docs.map(d => ({ ...d.data() }));
      const students = raw.filter(d => d.role === "Student");
      const staff    = raw.filter(d => d.role === "Staff");
      const getStats = (arr) => {
        const weekly = new Date(); weekly.setDate(weekly.getDate() - 7);
        return {
          daily:   calcAvg(arr.filter(d => fmt(d.dateString) === today)),
          weekly:  calcAvg(arr.filter(d => d.dateString?.toDate?.() >= weekly)),
          monthly: calcAvg(arr.filter(d => fmt(d.dateString).startsWith(month))),
        };
      };
      setStudentStats(getStats(students));
      setStaffStats(getStats(staff));
      setStudentChart(aggregate(students, studentView));
      setStaffChart(aggregate(staff, staffView));
    });
    return () => unsub();
  }, [studentView, staffView]);

  // Events
  useEffect(() => {
    getDocs(query(collection(db, "events"), orderBy("date", "asc"), limit(4)))
      .then(s => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // Activity logs
  useEffect(() => {
    const unsubs = ["events", "attendance", "registrations", "courses"].map(col =>
      onSnapshot(
        query(collection(db, col), orderBy("createdAt", "desc"), limit(2)),
        (snap) => {
          const next = snap.docs.map(d => ({
            id: `${col}-${d.id}`,
            action: `${col.charAt(0).toUpperCase() + col.slice(1)}: ${d.data().title || "Updated"}`,
            time: (d.data().createdAt?.toDate?.() || new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            col,
          }));
          setLogs(prev => [...next, ...prev.filter(l => !l.id.startsWith(col))].slice(0, 10));
        }
      )
    );
    return () => unsubs.forEach(u => u());
  }, []);

  const statChips = (stats, accent) =>
    ["daily", "weekly", "monthly"].map(k => (
      <Chip key={k} label={`${stats[k]}% ${k}`} size="small"
        sx={{ bgcolor: `${accent}14`, color: accent, fontWeight: 600, fontSize: 11, borderRadius: "8px", height: 26, textTransform: "capitalize" }} />
    ));

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, bgcolor: B.bg, minHeight: "100vh" }}>

      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 800, color: B.navy, letterSpacing: "-0.5px" }}>
            Admin Dashboard
          </Typography>
          <Typography sx={{ fontSize: 13, color: B.muted }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </Typography>
        </Box>
      </motion.div>

      {/* KPI row */}
      <Grid container spacing={2} sx={{ mb: 10, justifyContent:'space-between' }}>
        {[
          { label: "Total Students", value: counts.totalStudents, icon: <PeopleRounded />,   color: B.blue,   delay: 0.05 },
          { label: "Total Staff",    value: counts.totalStaff,    icon: <BadgeRounded />,    color: B.green,  delay: 0.1  },
          { label: "Active Courses", value: counts.totalCourses,  icon: <MenuBookRounded />, color: B.amber,  delay: 0.15 },
        ].map(p => (
          <Grid item xs={12} sm={4} sx={{width:'30%'}} key={p.label}>
            <KpiCard {...p} />
          </Grid>
        ))}
      </Grid>

      {/* Charts row */}
      <Grid container spacing={2} sx={{ mb: 2, mr:5, justifyContent:'space-between', }}>
        {/* Student attendance */}
        <Grid item xs={12} lg={6}>
          <motion.div {...fadeUp(0.18)}>
            <Box sx={{ mb: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>{statChips(studentStats, B.blue)}</Box>
            <AttendanceChart title="Student Attendance" data={studentChart} accent={B.blue}   view={studentView} onView={setStudentView} />
          </motion.div>
        </Grid>
        {/* Staff atendance */}
        <Grid item xs={12} lg={6} >
          <motion.div {...fadeUp(0.22)}>
            <Box sx={{ mb: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>{statChips(staffStats, B.purple)}</Box>
            <AttendanceChart title="Staff Attendance"    data={staffChart}   accent={B.purple} view={staffView}   onView={setStaffView}   />
          </motion.div>
        </Grid>
      </Grid>

      {/* Events + Activity */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <motion.div {...fadeUp(0.26)}>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: "16px", border: `1px solid ${B.border}` }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: B.navy, mb: 2 }}>Upcoming Events</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {events.length === 0 && <Typography sx={{ fontSize: 13, color: B.muted, textAlign: "center", py: 2 }}>No upcoming events</Typography>}
                {events.map(ev => (
                  <Box key={ev.id} sx={{
                    display: "flex", alignItems: "center", gap: 1.5, p: 1.5,
                    bgcolor: B.bg, borderRadius: "12px", borderLeft: `3px solid ${B.blue}`,
                  }}>
                    <Avatar sx={{ bgcolor: `${B.blue}14`, width: 36, height: 36 }}>
                      <EventAvailableRounded sx={{ color: B.blue, fontSize: 18 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: B.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</Typography>
                      <Typography sx={{ fontSize: 11, color: B.muted, display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                        <AccessTimeRounded sx={{ fontSize: 12 }} />
                        {ev.date?.toDate ? ev.date.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "TBC"}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div {...fadeUp(0.3)}>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: "16px", border: `1px solid ${B.border}`, height: "100%" }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: B.navy, mb: 2 }}>Recent Activity</Typography>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {logs.length === 0 && <Typography sx={{ fontSize: 13, color: B.muted, textAlign: "center", py: 2 }}>No recent activity</Typography>}
                {logs.map((log, i) => (
                  <Box key={log.id} sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    py: 1.25, borderBottom: i < logs.length - 1 ? `1px solid ${B.border}` : "none",
                  }}>
                    <FiberManualRecordRounded sx={{ fontSize: 8, color: DOT_COLORS[log.col] || B.muted, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 12, color: B.navy, flex: 1 }}>{log.action}</Typography>
                    <Typography sx={{ fontSize: 11, color: B.muted, flexShrink: 0 }}>{log.time}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}