import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import {
  AssignmentOutlined as AssignmentIcon,
  RateReviewOutlined as RateReviewIcon,
  ErrorOutlineOutlined as ErrorOutlineIcon,
  WarningAmberOutlined as WarningAmberIcon,
  ChevronRightOutlined as ChevronRightIcon,
  PeopleOutlined as PeopleIcon,
  RadioButtonCheckedOutlined as RadioActiveIcon,
  CancelOutlined as CancelIcon
} from '@mui/icons-material';

// 🔥 FIREBASE SYSTEM INTEGRATION
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function StaffDashboard({ currentUser }) {
  const [loading, setLoading] = useState(true);

  // 📊 Core Metrics States
  const [lecturesTodayCount, setLecturesTodayCount] = useState(0);
  const [avgAttendance, setAvgAttendance] = useState(0);
  const [attendanceTrend, setAttendanceTrend] = useState("");
  const [pendingLeaves, setPendingLeaves] = useState([]);

  // 📅 Class Schedules States
  const [completedLectures, setCompletedLectures] = useState([]);
  const [upcomingLectures, setUpcomingLectures] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    // StaffLogin now signs in through real Firebase Auth, and Layout.jsx only
    // mounts this page once onAuthStateChanged confirms a real user, so
    // auth.currentUser is reliably populated here — no hardcoded fallback needed.
    const instructorId = currentUser?.uid || auth.currentUser?.uid;
    if (!instructorId) return;

    // 🗓️ Localized YYYY-MM-DD dynamic date token builder
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // 🎧 LISTEN 1: Today's Lectures
    const qSchedule = query(
      collection(db, "schedules"),
      where("instructorId", "==", instructorId),
      where("dateString", "==", todayStr)
    );
    const unsubscribeSchedules = onSnapshot(qSchedule, (snapshot) => {
      const scheduleList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLecturesTodayCount(scheduleList.length);
      setCompletedLectures(scheduleList.filter(item => item.status === 'completed'));
      setUpcomingLectures(scheduleList.filter(item => item.status === 'upcoming'));
      setLoading(false);
    }, (error) => {
      console.error("Schedule pipeline error:", error);
      setLoading(false);
    });

    // 🎧 LISTEN 2: Live Attendance Trackers
    const qMetrics = query(collection(db, "attendanceMetrics"), where("instructorId", "==", instructorId));
    const unsubscribeMetrics = onSnapshot(qMetrics, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setAvgAttendance(data.avgAttendance || 0);
        setAttendanceTrend(data.weeklyChange || "0%");
      }
    });

    // 🎧 LISTEN 3: Live Pending Student Leave Applications
    const qLeaves = query(collection(db, "leaveRequests"), where("status", "==", "pending"));
    const unsubscribeLeaves = onSnapshot(qLeaves, (snapshot) => {
      setPendingLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 🎧 LISTEN 4: Look for an already active attendance token session
    const qActiveSession = query(
      collection(db, "attendanceSessions"),
      where("instructorId", "==", instructorId),
      where("status", "==", "active")
    );
    const unsubscribeSessions = onSnapshot(qActiveSession, (snapshot) => {
      if (!snapshot.empty) {
        setActiveSession({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActiveSession(null);
      }
    });

    return () => {
      unsubscribeSchedules();
      unsubscribeMetrics();
      unsubscribeLeaves();
      unsubscribeSessions();
    };
  }, [currentUser]); // Dependencies trigger reconfiguration safely if role values shift

  // 📝 WRITE ACTION 1: Trigger Biometric Check-In Portal for Students
  const handleStartRoll = async (lecture) => {
    try {
      const instructorId = currentUser?.uid || auth.currentUser?.uid;
      if (!instructorId) return;
      await addDoc(collection(db, "attendanceSessions"), {
        courseCode: lecture.courseCode,
        courseName: lecture.courseName,
        section: lecture.section,
        room: lecture.room,
        instructorId: instructorId,
        status: "active",
        createdAt: serverTimestamp(),
        verifiedStudents: []
      });
    } catch (error) {
      console.error("Error creating attendance session token: ", error);
    }
  };

  // 📝 WRITE ACTION 2: Terminate Session & Lock Student Screens
  const handleCloseRoll = async () => {
    if (!activeSession) return;
    try {
      const sessionDocRef = doc(db, "attendanceSessions", activeSession.id);
      await updateDoc(sessionDocRef, { status: "closed" });
      setActiveSession(null);
    } catch (error) {
      console.error("Error shutting down session: ", error);
    }
  };

  // 📝 WRITE ACTION 3: Instantly approve/deny leave items from the dashboard list
  const handleUpdateLeaveStatus = async (leaveId, newStatus) => {
    try {
      const leaveDocRef = doc(db, "leaveRequests", leaveId);
      await updateDoc(leaveDocRef, { status: newStatus });
    } catch (error) {
      console.error("Error processing leave state: ", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', width: '100%', boxSizing: 'border-box', p: { xs: 2, md: 4 } }}>

      {/* HEADER SECTION */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: 'Poppins', mb: 4 }}>
          Staff Management Dashboard</Typography>
        <Typography sx={{ fontSize: '1rem', color: '#627D98', fontWeight: 600 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* LIVE RUNNING ROLL CALL TRACKER BANNER */}
      {activeSession && (
        <Card sx={{ bgcolor: '#FFF1F2', border: '1px solid #FDA4AF', p: 2.5, borderRadius: 3, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <RadioActiveIcon sx={{ color: '#E11D48', animation: 'pulse 1.5s infinite' }} />
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#9F1239' }}>LIVE ATTENDANCE SESSION RUNNING</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#BE123C' }}>{activeSession.courseCode} ({activeSession.section}) • Students are checking in right now...</Typography>
            </Box>
          </Box>
          <Button variant="contained" size="small" startIcon={<CancelIcon />} onClick={handleCloseRoll} sx={{ bgcolor: '#E11D48', '&:hover': { bgcolor: '#9F1239' }, textTransform: 'none', fontWeight: 600 }}>
            End Session
          </Button>
        </Card>
      )}

      {/* MAIN CONTENT WORKSPACE SPLIT */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' }, gap: 3 }}>

        {/* LEFT COLUMN */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* TOP METRIC CARDS */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <Card sx={{ bgcolor: '#E0F2FE', p: 2.5, borderRadius: 3, boxShadow: 'none', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0369A1' }}>Lectures Today</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, my: 0.5, color: '#0369A1' }}>{String(lecturesTodayCount).padStart(2, '0')}</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284C7' }}>Roster Database Live</Typography>
            </Card>

            <Card sx={{ bgcolor: '#DCFCE7', p: 2.5, borderRadius: 3, boxShadow: 'none', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#15803D' }}>Avg. Attendance</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, my: 0.5, color: '#15803D' }}>{avgAttendance}%</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#16A34A' }}>{attendanceTrend} This Term</Typography>
            </Card>

            <Card sx={{ bgcolor: '#FEF3C7', p: 2.5, borderRadius: 3, boxShadow: 'none', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#B45309' }}>Pending Leaves</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, my: 0.5, color: '#B45309' }}>{String(pendingLeaves.length).padStart(2, '0')}</Typography>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#D97706' }}>Action Required</Typography>
            </Card>
          </Box>

          {/* TEACHING SCHEDULE SCHEDULE */}
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>Today's Teaching Schedule</Typography>

            <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, mb: 1.5 }}>COMPLETED LECTURES</Typography>
            {completedLectures.length === 0 ? (
              <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic', mb: 3 }}>No completed rosters saved for today.</Typography>
            ) : (
              completedLectures.map(lecture => (
                <Box key={lecture.id} sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#F0FDF4', p: 2, borderRadius: 2, mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>{lecture.courseCode} • {lecture.section}</Typography>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#14532D' }}>{lecture.courseName}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#16A34A', mt: 0.5 }}>{lecture.room} • {lecture.attendedStudents}/{lecture.registeredStudents} Present</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#14532D' }}>{lecture.time}</Typography>
                    <Chip label="Filed" size="small" sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 700, mt: 1 }} />
                  </Box>
                </Box>
              ))
            )}

            <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, mt: 3, mb: 1.5 }}>UPCOMING LECTURES</Typography>
            {upcomingLectures.length === 0 ? (
              <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>No pending classes remaining on your itinerary.</Typography>
            ) : (
              upcomingLectures.map(lecture => (
                <Box key={lecture.id} sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', p: 2, borderRadius: 2, mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 700 }}>{lecture.courseCode} • {lecture.section}</Typography>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E3A8A' }}>{lecture.courseName}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#2563EB', mt: 0.5 }}>{lecture.room} • {lecture.registeredStudents} Students on Roster</Typography>
                  </Box>
                  <Box sx={{ alignSelf: 'center', textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E3A8A', mb: 1 }}>{lecture.time}</Typography>
                    <Button variant="contained" size="small" disableElevation disabled={activeSession !== null} onClick={() => handleStartRoll(lecture)} sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'none' }}>
                      Start Roll
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Card>
        </Box>

        {/* RIGHT COLUMN */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* ADMIN AUDIT LOG */}
          <Paper sx={{ bgcolor: '#0F172A', color: '#FFFFFF', borderRadius: 3, overflow: 'hidden', boxShadow: 'none' }}>
            <Box sx={{ p: 2.5 }}><Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>Admin Action Log</Typography></Box>
            <List sx={{ pt: 0, pb: 1 }}>
              <ListItem sx={{ px: 2.5, py: 1.5 }}>
                <ListItemText primary="No recent activity." primaryTypographyProps={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#94A3B8' }} />
              </ListItem>
            </List>
          </Paper>

          {/* DYNAMIC LEAVE ACTION ITEMS ENGINE */}
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 2 }}>Action Desk</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, mb: 1.5 }}>STUDENT LEAVE REQUESTS</Typography>

            {pendingLeaves.length === 0 ? (
              <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>Inbox clear! No leaves require attention.</Typography>
            ) : (
              pendingLeaves.map(leave => (
                <Box key={leave.id} sx={{ bgcolor: '#FFFDF5', border: '1px solid #FEEBC8', borderRadius: 2, p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                    <WarningAmberIcon sx={{ color: '#DD6B20', mt: 0.2 }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#9C4221' }}>{leave.studentName}</Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: '#B7791F', fontWeight: 500 }}>{leave.courseCode} • {leave.reason}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button size="small" onClick={() => handleUpdateLeaveStatus(leave.id, "rejected")} sx={{ color: '#E53E3E', fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 }}>Decline</Button>
                    <Button size="small" variant="contained" disableElevation onClick={() => handleUpdateLeaveStatus(leave.id, "approved")} sx={{ bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' }, fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 }}>Approve</Button>
                  </Box>
                </Box>
              ))
            )}
          </Card>
        </Box>

      </Box>
    </Box>
  );
}