import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Stack, IconButton, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Button, useMediaQuery,
  Snackbar, Alert, Select, MenuItem, FormControl, InputLabel, Chip
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

// Firebase
import { auth, db } from "../../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";

/* --- NEW: Sub-component for real-time registration count --- */
function RegistrationCounter({ courseId }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "studentRegistrations"), where("courseId", "==", courseId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [courseId]);

  return (
    <Chip
      label={`${count} Registered`}
      color="primary"
      variant="outlined"
      size="small"
      sx={{ fontWeight: 700, ml: 2 }}
    />
  );
}

export default function StaffTimetable() {
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [classes, setClasses] = useState([]);
  const [openClassDlg, setOpenClassDlg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    let q = selectedSemester === "all"
      ? query(collection(db, "availableCourses"))
      : query(collection(db, "availableCourses"), where("semester", "==", selectedSemester));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [selectedSemester]);

  const handlePublishClass = async (classData) => {
    setLoading(true);
    try {
      const semesterToSave = selectedSemester === "all" ? "2025/2026-Fall" : selectedSemester;
      await addDoc(collection(db, "availableCourses"), {
        ...classData,
        semester: semesterToSave,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || null,
        staffId: auth.currentUser?.uid || null,
      });
      setFeedback({ open: true, message: "Course published successfully!", severity: 'success' });
      setOpenClassDlg(false);
    } catch (error) {
      setFeedback({ open: true, message: "Failed: " + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id) => {
    try {
      await deleteDoc(doc(db, "availableCourses", id));
    } catch (error) {
      setFeedback({ open: true, message: "Error deleting.", severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', fontFamily: 'Poppins', mb: 4 }}>
        Staff Course Publisher</Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>View Semester</InputLabel>
          <Select value={selectedSemester} label="View Semester" onChange={(e) => setSelectedSemester(e.target.value)}>
            <MenuItem value="all">Show All Courses</MenuItem>
            <MenuItem value="2025/2026-Fall">2025/2026 Fall</MenuItem>
            <MenuItem value="2025/2026-Spring">2025/2026 Spring</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenClassDlg(true)} sx={{ height: 55, bgcolor: '#0f172a', borderRadius: 2 }}>
          Publish New Course
        </Button>
      </Box>

      <Stack spacing={2}>
        {classes.map((cls) => (
          <Paper key={cls.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{cls.code} - {cls.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                Room: {cls.room} | Time: {cls.time} | Lecturer: {cls.lecturer} | Semester: {cls.semester || "N/A"}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RegistrationCounter courseId={cls.id} />
              <IconButton color="error" onClick={() => handleDeleteClass(cls.id)}><Delete /></IconButton>
            </Box>
          </Paper>
        ))}
      </Stack>

      <ClassDialog open={openClassDlg} onClose={() => setOpenClassDlg(false)} onSave={handlePublishClass} loading={loading} />
      <Snackbar open={feedback.open} autoHideDuration={4000} onClose={() => setFeedback({ ...feedback, open: false })}>
        <Alert severity={feedback.severity}>{feedback.message}</Alert>
      </Snackbar>
    </Box>
  );
}

function ClassDialog({ open, onClose, onSave, loading }) {
  const [data, setData] = useState({ code: '', title: '', room: '', time: '', lecturer: auth.currentUser?.displayName || '' });
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add New Course</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Course Code" fullWidth onChange={e => setData({ ...data, code: e.target.value })} />
          <TextField label="Course Title" fullWidth onChange={e => setData({ ...data, title: e.target.value })} />
          <TextField label="Lecturer" fullWidth value={data.lecturer} onChange={e => setData({ ...data, lecturer: e.target.value })} />
          <TextField label="Room" fullWidth onChange={e => setData({ ...data, room: e.target.value })} />
          <TextField type="time" fullWidth InputLabelProps={{ shrink: true }} onChange={e => setData({ ...data, time: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(data)} variant="contained" disabled={loading}>Publish</Button>
      </DialogActions>
    </Dialog>
  );
}