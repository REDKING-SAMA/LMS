import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Box, Typography, ToggleButton, ToggleButtonGroup,
  Card, CardContent, Grid, Avatar, Chip, CircularProgress,
} from "@mui/material";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import {
  TrendingUpRounded, TrendingDownRounded, PeopleRounded,
  CheckCircleRounded, CancelRounded, BadgeRounded,
} from "@mui/icons-material";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../firebase";

// ── Palette (matches sidebar branding) ──────────────────────────────────────
const BRAND = {
  navy: "#0f172a", mid: "#1a2744", blue: "#3b82f6", blueSoft: "#60a5fa",
  teal: "#0ea5e9", green: "#10b981", amber: "#f59e0b", red: "#ef4444",
  muted: "rgba(15,23,42,0.45)", surface: "#ffffff", bg: "#f8fafc", border: "#e2e8f0",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (ts) => ts?.toDate ? ts.toDate().toISOString().split("T")[0] : "";
const isP   = (s) => s?.toString().trim().toLowerCase() === "present";
const today = new Date().toISOString().split("T")[0];

const DAY_LABELS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_BUCKETS = ["8 AM","9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM"];

// Bucket raw attendance docs into chart rows based on the selected view
function buildChartData(docs, view) {
  if (view === "day") {
    // Group today's records by hour of day
    const buckets = HOUR_BUCKETS.reduce((acc, h) => ({ ...acc, [h]: { period: h, present: 0, absent: 0 } }), {});
    docs.filter(d => fmt(d.dateString) === today).forEach(d => {
      const hr = d.dateString.toDate().getHours();
      const label = HOUR_BUCKETS[Math.min(Math.max(hr - 8, 0), 7)];
      if (isP(d.status)) buckets[label].present++; else buckets[label].absent++;
    });
    return Object.values(buckets);
  }

  if (view === "week") {
    // Last 7 days, grouped by weekday
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 6);
    const map = {};
    docs.filter(d => d.dateString?.toDate?.() >= cutoff).forEach(d => {
      const date = d.dateString.toDate();
      const label = DAY_LABELS[date.getDay()];
      if (!map[label]) map[label] = { period: label, present: 0, absent: 0, _order: date.getDay() };
      if (isP(d.status)) map[label].present++; else map[label].absent++;
    });
    const rows = Object.values(map).sort((a, b) => a._order - b._order);
    rows.forEach(r => { r.rate = Math.round((r.present / (r.present + r.absent || 1)) * 100); delete r._order; });
    return rows;
  }

  // month: group by ISO week number within the last 4 weeks
  const map = {};
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 28);
  docs.filter(d => d.dateString?.toDate?.() >= cutoff).forEach(d => {
    const date = d.dateString.toDate();
    const weeksAgo = Math.floor((Date.now() - date.getTime()) / (7 * 86400000));
    const label = `Wk ${4 - weeksAgo}`;
    if (!map[label]) map[label] = { period: label, present: 0, absent: 0, _order: -weeksAgo };
    if (isP(d.status)) map[label].present++; else map[label].absent++;
  });
  const rows = Object.values(map).sort((a, b) => a._order - b._order);
  rows.forEach(r => { r.rate = Math.round((r.present / (r.present + r.absent || 1)) * 100); delete r._order; });
  return rows;
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color, trend, delay = 0 }) {
  const up = trend >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay, ease: "easeOut" }} style={{ height: "100%" }}>
      <Card elevation={0} sx={{
        height: "100%", border: `1px solid ${BRAND.border}`, borderRadius: "16px", bgcolor: BRAND.surface,
        transition: "box-shadow 0.2s, transform 0.2s",
        "&:hover": { boxShadow: "0 8px 32px rgba(15,23,42,0.09)", transform: "translateY(-2px)" },
      }}>
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
            <Avatar sx={{ bgcolor: `${color}18`, width: 42, height: 42 }}>
              {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
            </Avatar>
            <Chip size="small"
              icon={up ? <TrendingUpRounded sx={{ fontSize: "13px !important" }} /> : <TrendingDownRounded sx={{ fontSize: "13px !important" }} />}
              label={`${up ? "+" : ""}${trend}%`}
              sx={{ fontSize: 11, fontWeight: 600, height: 22, bgcolor: up ? "#d1fae5" : "#fee2e2", color: up ? BRAND.green : BRAND.red, "& .MuiChip-icon": { color: "inherit" } }}
            />
          </Box>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: BRAND.navy, lineHeight: 1, mb: 0.4 }}>{value}</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: BRAND.navy, mb: 0.2 }}>{label}</Typography>
          <Typography sx={{ fontSize: 11, color: BRAND.muted }}>{sub}</Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: BRAND.navy, borderRadius: "10px", p: 1.5, minWidth: 130 }}>
      <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)", mb: 0.75 }}>{label}</Typography>
      {payload.map((p) => (
        <Box key={p.dataKey} sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: p.color }} />
          <Typography sx={{ fontSize: 12, color: "#fff", textTransform: "capitalize" }}>{p.dataKey}: <b>{p.value}</b></Typography>
        </Box>
      ))}
    </Box>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AttendanceReports() {
  const [view, setView] = useState("week");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live attendance listener
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "attendance")), (snap) => {
      setDocs(snap.docs.map(d => d.data()));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const data = useMemo(() => buildChartData(docs, view), [docs, view]);

  // Role split (students vs staff) for the donut — replaces mock class breakdown
  const roleSplit = useMemo(() => {
    const students = docs.filter(d => d.role === "Student");
    const staff    = docs.filter(d => d.role === "Staff");
    const rate = (arr) => arr.length ? Math.round((arr.filter(d => isP(d.status)).length / arr.length) * 100) : 0;
    return [
      { name: "Students", value: rate(students), fill: BRAND.blue },
      { name: "Staff",    value: rate(staff),    fill: BRAND.navy },
    ];
  }, [docs]);

  const totalPresent = data.reduce((s, d) => s + d.present, 0);
  const totalAbsent  = data.reduce((s, d) => s + d.absent, 0);
  const total        = totalPresent + totalAbsent;
  const rate         = total ? Math.round((totalPresent / total) * 100) : 0;

  const STATS = [
    { label: "Attendance Rate", value: `${rate}%`,     sub: "Overall this period",   icon: <PeopleRounded />,      color: BRAND.blue,  trend: 0 },
    { label: "Present",         value: totalPresent,    sub: "Marked present",        icon: <CheckCircleRounded />, color: BRAND.green, trend: 0 },
    { label: "Absent",          value: totalAbsent,      sub: "Marked absent",         icon: <CancelRounded />,      color: BRAND.red,   trend: 0 },
    { label: "Records",         value: total,             sub: "Total entries logged",  icon: <BadgeRounded />,       color: BRAND.amber, trend: 0 },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <CircularProgress sx={{ color: BRAND.blue }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, bgcolor: BRAND.bg, minHeight: "100vh" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
          <Box>
            <Typography sx={{ fontSize: { xs: 20, md: 24 }, fontWeight: 800, color: BRAND.navy, letterSpacing: "-0.5px" }}>Attendance Reports</Typography>
            <Typography sx={{ fontSize: 13, color: BRAND.muted, mt: 0.25 }}>Live data from Firestore — updates in real time</Typography>
          </Box>
          <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small" sx={{
            bgcolor: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: "10px", p: 0.4,
            "& .MuiToggleButton-root": {
              border: "none", borderRadius: "8px !important", px: 2, py: 0.6, fontSize: 13, fontWeight: 500,
              color: BRAND.muted, textTransform: "none", transition: "all 0.18s",
              "&.Mui-selected": { bgcolor: BRAND.navy, color: "#fff", "&:hover": { bgcolor: BRAND.mid } },
              "&:hover": { bgcolor: "#f1f5f9", color: BRAND.navy },
            },
          }}>
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </motion.div>

      {/* Stat cards */}
      <Grid container sx={{ mb: 3, justifyContent:'space-between' }}>
        {STATS.map((s, i) => (
          <Grid item xs={6} md={3} key={s.label} sx={{width:'23%'}}>
            <StatCard {...s} delay={i * 0.07} />
          </Grid>
        ))}
      </Grid>

      {/* Charts row */}
      <Grid container spacing={2} sx={{ mb: 2, justifyContent:"space-between" }}>
        <Grid item sx={{width:'50%'}} xs={12} md={8}>
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.3 }}>
              <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: "16px", bgcolor: BRAND.surface }}>
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: BRAND.navy }}>
                        {view === "day" ? "Today's Attendance by Hour" : view === "week" ? "This Week's Daily Breakdown" : "Last 4 Weeks"}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: BRAND.muted }}>Present · Absent</Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      {[{ color: BRAND.blue, label: "Present" }, { color: BRAND.red, label: "Absent" }].map((l) => (
                        <Box key={l.label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: l.color }} />
                          <Typography sx={{ fontSize: 11, color: BRAND.muted }}>{l.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {data.length === 0 ? (
                    <Box sx={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Typography sx={{ fontSize: 13, color: BRAND.muted }}>No attendance records for this period</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={data} barGap={3} barCategoryGap="28%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="period" tick={{ fontSize: 11, fill: BRAND.muted }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: BRAND.muted }} axisLine={false} tickLine={false} width={32} />
                        <ReTooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                        <Bar dataKey="present" fill={BRAND.blue} radius={[5, 5, 0, 0]} maxBarSize={32} />
                        <Bar dataKey="absent"  fill={BRAND.red}  radius={[5, 5, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </Grid>

        {/* Role split donut — replaces mock "by class" chart */}
        <Grid item sx={{width:'45%'}} xs={12} md={4}>
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.38, delay: 0.1 }} style={{ height: "100%" }}>
            <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: "16px", bgcolor: BRAND.surface, height: "100%" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 }, height: "100%", display: "flex", flexDirection: "column" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: BRAND.navy, mb: 0.25 }}>By Role</Typography>
                <Typography sx={{ fontSize: 12, color: BRAND.muted, mb: 2 }}>Attendance rate %</Typography>

                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={roleSplit} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {roleSplit.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                    </Pie>
                    <ReTooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ background: BRAND.navy, border: "none", borderRadius: 10, color: "#fff", fontSize: 12 }} itemStyle={{ color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: "auto" }}>
                  {roleSplit.map((c) => (
                    <Box key={c.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: c.fill, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 12, color: BRAND.muted }}>{c.name}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: BRAND.navy }}>{c.value}%</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Trend line — week/month only */}
      {(view === "week" || view === "month") && data.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.18 }}>
          <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: "16px", bgcolor: BRAND.surface }}>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: BRAND.navy }}>Attendance Rate Trend</Typography>
                <Typography sx={{ fontSize: 12, color: BRAND.muted }}>% of students present over time</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND.blue} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={BRAND.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: BRAND.muted }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: BRAND.muted }} axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${v}%`} />
                  <ReTooltip content={<CustomTooltip />} cursor={{ stroke: BRAND.border }} />
                  <Area type="monotone" dataKey="rate" stroke={BRAND.blue} strokeWidth={2.5} fill="url(#rateGrad)" dot={{ fill: BRAND.blue, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: BRAND.blue, stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </Box>
  );
}