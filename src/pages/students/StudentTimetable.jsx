import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, IconButton, Paper,
  Dialog, DialogContent, DialogActions,
  TextField, Button, Chip, LinearProgress, Zoom
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, CalendarToday,
  ReportProblemOutlined, CheckCircleOutlined,
  LocationOnOutlined, SchoolOutlined, CloseOutlined,
  SendOutlined, WarningAmberOutlined
} from '@mui/icons-material';

// 🌟 Firebase Config Engine Hooks Imports
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';

// ── Helpers & Static Configuration Map Settings ──────────────────────────────────
const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1; // Shifts week alignment to start on Monday
}

function buildWeekDays(anchor) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() + i - anchor.getDay() + (anchor.getDay() === 0 ? -6 : 1)); // Sync weekly strip to start on Mon
    return { num: d.getDate(), label: names[d.getDay()], date: new Date(d) };
  });
}

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function fmtEventDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// 🎨 Perfectly Styled Design Palettes from Mockup
const CLASS_COLORS = [
  { bg: '#f3e8ff', border: 'transparent', dot: '#c084fc', text: '#6b21a8' }, // Purple
  { bg: '#dbeafe', border: 'transparent', dot: '#60a5fa', text: '#1e40af' }, // Blue
  { bg: '#e2fcd5', border: 'transparent', dot: '#4ade80', text: '#166534' }, // Light Green
  { bg: '#fef08a', border: 'transparent', dot: '#facc15', text: '#854d0e' }, // Yellow
];

const COMPLAINT_CATEGORIES = [
  'Lecturer Issue', 'Timetable Conflict', 'Room / Facility',
  'Course Material', 'Grading Issue', 'Other',
];

export default function StudentTimetable() {
  // ⚡️ REAL-TIME SYSTEM VALUES
  const systemToday = new Date();

  // Live Database Collection Parameter States
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState([]);

  // UI Control Handles State Hooks
  const [selectedDay, setSelectedDay] = useState(systemToday);
  const [calYear, setCalYear] = useState(systemToday.getFullYear());
  const [calMonth, setCalMonth] = useState(systemToday.getMonth());
  const [expandedClass, setExpandedClass] = useState(null);
  const [openComplaint, setOpenComplaint] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaint, setComplaint] = useState({ category: '', subject: '', description: '', relatedClass: '' });

  const weekDays = buildWeekDays(selectedDay);
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDayOff = getFirstDayOfMonth(calYear, calMonth);
  const calCells = Array(firstDayOff).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  // ========================================================
  // 🌟 REAL-TIME SYNC ENGINE (FIREBASE SNAPSHOT LISTENERS)
  // ========================================================
  useEffect(() => {
    const classesQuery = query(collection(db, 'classes'), orderBy('time', 'asc'));
    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(classesData);
    });

    const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(eventsData);
    });

    return () => {
      unsubscribeClasses();
      unsubscribeEvents();
    };
  }, []);

  // ========================================================
  // 📥 PUSH LOGGED INCIDENT REPORT DIRECT TO STORAGE
  // ========================================================
  async function handleSubmitComplaint() {
    if (!complaint.subject.trim() || !complaint.category) return;

    try {
      setSubmitted(true);
      await addDoc(collection(db, 'complaints'), {
        ...complaint,
        createdAt: new Date().toISOString(),
        status: 'Pending'
      });

      setTimeout(() => {
        setSubmitted(false);
        setOpenComplaint(false);
        setComplaint({ category: '', subject: '', description: '', relatedClass: '' });
      }, 2000);
    } catch (error) {
      console.error("Error writing complaint transaction payload document: ", error);
      setSubmitted(false);
    }
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1);
  }

  return (
    <Box sx={{ p: '32px 40px', flex: 1, minWidth: 0, bgcolor: '#f8fafc', minHeight: '100vh' }}>

      {/* Page Title Row Header */}
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#0f172a', fontFamily: 'Poppins, sans-serif' }}>
          Timetable
        </Typography>
      </Box>

      {/* MAIN DASHBOARD LAYOUT GRID — Re-balanced column widths for a premium layout */}
      <Box sx={{ display: 'flex', gap: '40px', alignItems: 'flex-start', width: '100%' }}>

        {/* 📦 LEFT MAIN DISPLAY ZONE (Controlled growth relative to wider screens) */}
        <Paper
          elevation={0}
          sx={{
            flex: 1.4,
            minWidth: 0,
            bgcolor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            p: '32px'
          }}
        >

          {/* Week View Horizontal Day Tracker Strip Component */}
          <Stack direction="row" spacing={1.5} justifyContent="space-between" mb={4}>
            {weekDays.map(d => {
              const isSel = d.date.toDateString() === selectedDay.toDateString();
              const isActualToday = d.date.toDateString() === systemToday.toDateString();
              return (
                <Paper
                  key={d.date.toISOString()}
                  elevation={0}
                  onClick={() => setSelectedDay(d.date)}
                  sx={{
                    flex: 1, textAlign: 'center', py: 2, borderRadius: '14px', cursor: 'pointer',
                    bgcolor: isSel ? '#0b2559' : '#f8fafc',
                    border: isActualToday && !isSel ? '1.5px solid #0b2559' : '1.5px solid transparent',
                    boxShadow: 'none',
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: isSel ? '#0b2559' : '#f1f5f9' }
                  }}
                >
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: isSel ? '#ffffff' : '#0f172a', lineHeight: 1.2 }}>
                    {d.num}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: isSel ? '#93c5fd' : '#64748b', fontWeight: 600, mt: 0.5, textTransform: 'capitalize' }}>
                    {d.label}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>

          {/* Classes Sub-Header Tracker Label */}
          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', mb: 2.5, fontFamily: '"Inter", sans-serif', mt: 5 }}>
            Classes
          </Typography>

          {/* Dynamic Interactive Stack Cards Row Render */}
          <Stack spacing={2} sx={{ width: '100%' }}>
            {classes.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderRadius: '12px', borderColor: '#cbd5e1', bgcolor: '#ffffff' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>No active courses mapped to today's session.</Typography>
              </Paper>
            ) : (
              classes.map((cls, idx) => {
                const c = CLASS_COLORS[cls.colorIdx] || CLASS_COLORS[idx % 4];
                const exp = expandedClass === cls.id;
                return (
                  <Paper
                    key={cls.id}
                    elevation={0}
                    onClick={() => setExpandedClass(exp ? null : cls.id)}
                    sx={{
                      bgcolor: c.bg,
                      borderRadius: '12px',
                      p: '20px 24px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      boxShadow: '0 2px 4px rgba(15, 23, 42, 0.01)',
                      '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.68rem', color: c.text, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', mb: 0.5 }}>
                          {cls.code || "CS 162"}
                        </Typography>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.98rem', fontFamily: '"Inter", sans-serif' }}>
                          {cls.name}
                        </Typography>
                        <Stack direction="row" spacing={2.5} alignItems="center" mt={1}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <LocationOnOutlined sx={{ fontSize: 14, color: '#64748b' }} />
                            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{cls.room}</Typography>
                          </Stack>
                          {exp && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <SchoolOutlined sx={{ fontSize: 14, color: '#64748b' }} />
                              <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{cls.lecturer}</Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Box>

                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.98rem', fontFamily: '"Inter", sans-serif' }}>
                          {fmt12(cls.time)}
                        </Typography>
                        {cls.postponed && (
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', mt: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            Postponed
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Expand Workspace Drawer for System Incidents Reporting */}
                    {exp && (
                      <Zoom in={exp}>
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mb: 0.5, fontWeight: 600 }}>Attendance Index</Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <LinearProgress variant="determinate" value={cls.attendance || 75}
                                  sx={{
                                    width: 100, height: 5, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)',
                                    '& .MuiLinearProgress-bar': { bgcolor: '#10b981' }
                                  }} />
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>
                                  {cls.attendance || 75}%
                                </Typography>
                              </Stack>
                            </Box>
                            <Button
                              size="small"
                              onClick={e => { e.stopPropagation(); setComplaint(n => ({ ...n, relatedClass: cls.name, category: 'Timetable Conflict' })); setOpenComplaint(true); }}
                              startIcon={<ReportProblemOutlined sx={{ fontSize: 12 }} />}
                              sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#dc2626', fontWeight: 600, bgcolor: '#fef2f2', borderRadius: '6px', px: 1, py: 0.3, '&:hover': { bgcolor: '#fee2e2' } }}
                            >
                              Report Issue
                            </Button>
                          </Stack>
                        </Box>
                      </Zoom>
                    )}
                  </Paper>
                );
              })
            )}
          </Stack>
        </Paper>

        {/* 📋 RIGHT COLUMN SIDEBAR ZONE (Bigger, matches the presence of your screenshot mockup) */}
        <Box sx={{ flex: 0.8, maxWidth: '440px', minWidth: '320px', width: '100%', flexShrink: 0 }}>

          {/* Calendar Display Card Box Frame Block */}
          <Paper elevation={0} sx={{ bgcolor: '#0b2559', borderRadius: '16px', p: '28px', mb: 3.5, color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(11, 37, 89, 0.2)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3.5}>
              <IconButton size="small" onClick={prevMonth} sx={{ color: '#93c5fd', p: 0.5 }}><ChevronLeft sx={{ fontSize: 22 }} /></IconButton>
              <Typography sx={{ fontWeight: 700, color: '#ffffff', fontSize: '1.05rem', fontFamily: '"Inter", sans-serif', letterSpacing: '0.2px' }}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Typography>
              <IconButton size="small" onClick={nextMonth} sx={{ color: '#93c5fd', p: 0.5 }}><ChevronRight sx={{ fontSize: 22 }} /></IconButton>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', mb: 2.5, textAlign: 'center' }}>
              {DAYS_OF_WEEK.map((d, i) => (
                <Typography key={i} sx={{ fontSize: '0.82rem', fontWeight: 700, color: i === 5 || i === 6 ? '#f87171' : '#60a5fa' }}>{d}</Typography>
              ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', rowGap: '14px', textAlign: 'center' }}>
              {calCells.map((day, i) => {
                if (!day) return <Box key={i} />;

                const isToday =
                  day === systemToday.getDate() &&
                  calMonth === systemToday.getMonth() &&
                  calYear === systemToday.getFullYear();

                return (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px',
                        bgcolor: isToday ? '#ffffff' : 'transparent',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: isToday ? '#ffffff' : 'rgba(255,255,255,0.08)' }
                      }}
                      onClick={() => {
                        const newSelected = new Date(calYear, calMonth, day);
                        setSelectedDay(newSelected);
                      }}
                    >
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: isToday ? 800 : 500, color: isToday ? '#0b2559' : '#ffffff' }}>
                        {day}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>

          {/* Institutional Events Bulletins Frame */}
          <Paper elevation={0} sx={{ borderRadius: '16px', p: 3, bgcolor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.01)' }}>
            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', mb: 2.5, fontFamily: '"Inter", sans-serif' }}>
              Upcoming Events
            </Typography>

            <Stack spacing={1.5} mb={2.5}>
              {events.length === 0 ? (
                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', py: 1 }}>No campus notices listed.</Typography>
              ) : (
                events.map(ev => {
                  return (
                    <Paper
                      key={ev.id}
                      variant="outlined"
                      sx={{
                        borderColor: '#e2e8f0', borderRadius: '10px', p: '16px', bgcolor: '#f8fafc',
                        display: 'flex', gap: 1.5, alignItems: 'flex-start',
                        boxShadow: 'none',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: '#cbd5e1' }
                      }}
                    >
                      <CalendarToday sx={{ color: '#0f172a', fontSize: 14, mt: 0.3, flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', lineHeight: 1.2 }}>
                          {ev.title}
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mt: 0.4, fontWeight: 500 }}>
                          {fmtEventDate(ev.date)}{ev.startTime ? ` @ ${fmt12(ev.startTime)}` : ''}
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })
              )}
            </Stack>

            <Button
              fullWidth
              onClick={() => setOpenComplaint(true)}
              variant="text"
              startIcon={<WarningAmberOutlined sx={{ fontSize: 14 }} />}
              sx={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'none', justifyContent: 'center', fontWeight: 600, py: 0.5, '&:hover': { color: '#ef4444', bgcolor: 'transparent' } }}
            >
              Have an issue? File a complaint
            </Button>
          </Paper>

        </Box>
      </Box>

      {/* SYSTEM CONFIDENTIAL DIALOG COMPLAINT POPUP */}
      <Dialog open={openComplaint} onClose={() => !submitted && setOpenComplaint(false)}
        PaperProps={{ sx: { borderRadius: '16px', width: 360, overflow: 'hidden' } }}>
        {/* ... component handles stay untouched ... */}
        {!submitted ? (
          <>
            <Box sx={{ bgcolor: '#0f172a', px: 3, pt: 3, pb: 2.5, position: 'relative' }}>
              <IconButton size="small" onClick={() => setOpenComplaint(false)}
                sx={{ position: 'absolute', top: 12, right: 12, color: '#64748b', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                <CloseOutlined sx={{ fontSize: 16 }} />
              </IconButton>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ReportProblemOutlined sx={{ color: '#f87171', fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Submit a Complaint</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.72rem' }}>Incident logger processing</Typography>
                </Box>
              </Stack>
            </Box>
            <DialogContent sx={{ px: 3, py: 2.5 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', mb: 1 }}>Category *</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                    {COMPLAINT_CATEGORIES.map(cat => (
                      <Chip key={cat} label={cat} size="small"
                        onClick={() => setComplaint(n => ({ ...n, category: cat }))}
                        sx={{
                          cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, borderRadius: '6px', height: 26,
                          bgcolor: complaint.category === cat ? '#0f172a' : '#f1f5f9',
                          color: complaint.category === cat ? '#fff' : '#64748b',
                          border: '1px solid transparent', transition: 'all 0.15s'
                        }} />
                    ))}
                  </Box>
                </Box>
                <TextField label="Subject *" fullWidth size="small" value={complaint.subject}
                  onChange={e => setComplaint(n => ({ ...n, subject: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                <TextField label="Description" fullWidth size="small" multiline rows={3} value={complaint.description}
                  onChange={e => setComplaint(n => ({ ...n, description: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
              <Button onClick={() => setOpenComplaint(false)} sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}>Cancel</Button>
              <Button onClick={handleSubmitComplaint} variant="contained" disabled={!complaint.subject.trim() || !complaint.category}
                startIcon={<SendOutlined sx={{ fontSize: 14 }} />}
                sx={{ bgcolor: '#0f172a', borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 2, fontSize: '0.8rem', '&:hover': { bgcolor: '#1e293b' } }}>
                Submit
              </Button>
            </DialogActions>
          </>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <CheckCircleOutlined sx={{ color: '#16a34a', fontSize: 28 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', mb: 0.5 }}>Complaint Logged!</Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.78rem' }}>Written directly to database backend ledger node.</Typography>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}