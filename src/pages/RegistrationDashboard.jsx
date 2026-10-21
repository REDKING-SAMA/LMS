import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, Checkbox, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, Paper, Stack, IconButton, Divider
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FaceIcon from '@mui/icons-material/Face';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

// Firebase SDK & Configurations
import { auth, db } from '../firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { query, orderBy } from 'firebase/firestore'; // Import these
import { onAuthStateChanged } from 'firebase/auth';

// Global Utilities & Database Helpers
import { toggleCourseRegistration } from '../utils/firebaseHelpers';
import { generateRegistrationSlip } from '../utils/pdfGenerator';

export default function RegistrationDashboard() {
    // The router never passes a `user` prop — get the logged-in student from
    // Firebase Auth directly, same as every other student page.
    const [currentUser, setCurrentUser] = useState({ id: "", name: "", role: "" });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setCurrentUser({
                id: firebaseUser?.uid || "",
                name: firebaseUser?.displayName || "",
                role: "student",
            });
        });
        return unsubscribe;
    }, []);

    // Live Dynamic Collections State
    const [courses, setCourses] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);

    // UI Modal Control Hooks
    const [guidelinesOpen, setGuidelinesOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [pastRegistrations, setPastRegistrations] = useState([]);

    // 2. Real-time listener for current user's registration status
    useEffect(() => {
        if (!currentUser?.id) return;
        const userRef = doc(db, 'users', currentUser.id);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                setSelectedCourses(userData.selectedCourses || []);
            }
        });
        return () => unsubscribe();
    }, [currentUser?.id]);

    // 3. Dynamic Real-Time Firestore Listener for Available Courses
    useEffect(() => {
        const coursesCollection = collection(db, 'availableCourses');
    const q = query(coursesCollection, orderBy('sequenceOrder', 'asc')); // Change 'displayOrder' to your specific field
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveCoursesArray = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setCourses(liveCoursesArray);
    });
    return () => unsubscribe();
}, []);

    // 4. Real-Time Firestore Listener for Student's Archival Sub-Collection
    useEffect(() => {
        if (!currentUser?.id) return;
        const historyCollectionRef = collection(db, 'users', currentUser.id, 'history');
        const unsubscribe = onSnapshot(historyCollectionRef, (snapshot) => {
            const archivesArray = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPastRegistrations(archivesArray);
        });
        return () => unsubscribe();
    }, [currentUser?.id]);

    // Asynchronous Firestore database toggle handler
    const handleToggle = async (courseId) => {
        if (!currentUser.id) return;
        const isCurrentlyChecked = selectedCourses.includes(courseId);
        const nextRegisterState = !isCurrentlyChecked;

        // Local state optimistic UI update
        if (nextRegisterState) {
            setSelectedCourses([...selectedCourses, courseId]);
        } else {
            setSelectedCourses(selectedCourses.filter(id => id !== courseId));
        }

        await toggleCourseRegistration(courseId, currentUser.id, nextRegisterState);
    };

    return (
        <Box sx={{ width: '100%', minHeight: '100vh' }}>
            {/* DASHBOARD CONTENT PANEL */}
            <Box sx={{ p: { xs: 3, sm: 6 }, flexGrow: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#0f172a', fontFamily: 'Poppins, sans-serif' }}>
                    Registration
                </Typography>

                <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'stretch' }}>
                    
                    {/* CONTAINER 1: DYNAMIC COURSE REGISTRATION PANEL */}
                    <Paper variant="outlined" sx={{ flex: 1.6, p: { xs: 2.5, sm: 4 }, borderRadius: '16px', bgcolor: 'white', borderColor: '#e2e8f0' }}>
                        {/* ... Rest of your JSX remains identical ... */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 700, fontSize: '1.15rem' }}>
                                Course Registration
                            </Typography>
                            <IconButton size="small" disableRipple sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', p: 0.4 }}>
                                <InfoOutlinedIcon sx={{ fontSize: 18, color: '#64748b' }} />
                            </IconButton>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 4, fontStyle: 'italic', color: '#64748b' }}>
                            Select your courses
                        </Typography>

                        <Stack spacing={2.5}>
                            {courses.map((course) => {
                                const isChecked = selectedCourses.includes(course.id);
                                return (
                                    <Card key={course.id} variant="outlined" sx={{ borderRadius: '12px', borderColor: '#e2e8f0', overflow: 'hidden', boxShadow: 'none' }}>
                                        <Box sx={{ bgcolor: '#0f172a', p: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem', fontWeight: 600, mb: 0.3 }}>{course.code}</Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>{course.title}</Typography>
                                            </Box>
                                            <Checkbox
                                                checked={isChecked}
                                                onChange={() => handleToggle(course.id)}
                                                icon={<CheckBoxOutlineBlankIcon sx={{ color: 'white' }} />}
                                                checkedIcon={<CheckBoxIcon sx={{ color: 'white' }} />}
                                                sx={{ p: 0 }}
                                            />
                                        </Box>
                                        <CardContent sx={{ p: 2, px: 3, '&:last-child': { pb: 2 }, bgcolor: 'white' }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>Lecturer</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{course.lecturer}</Typography>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Stack>
                    </Paper>

                    {/* CONTAINER 2: BIOMETRIC REGISTRATION PANEL */}
                    <Paper
                        variant="outlined"
                        sx={{
                            flex: 1, p: { xs: 2.5, sm: 4 }, borderRadius: '16px', bgcolor: 'white', borderColor: '#e2e8f0',
                            display: 'flex', flexDirection: 'column'
                        }}
                    >
                        <Typography variant="h6" sx={{ mb: 3, color: '#0f172a', fontWeight: 700, fontSize: '1.15rem' }}>
                            Biometric Registration
                        </Typography>

                        <Paper
                            elevation={0} variant="outlined"
                            sx={{
                                p: 2, display: 'flex', alignItems: 'center', borderRadius: '12px', cursor: 'pointer',
                                borderColor: '#e2e8f0', '&:hover': { bgcolor: '#f8fafc' }
                            }}
                        >
                            <Box sx={{ bgcolor: '#0f172a', color: 'white', p: 1.8, borderRadius: '10px', mr: 2, display: 'flex' }}>
                                <FaceIcon sx={{ fontSize: 28 }} />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>Register Face ID</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', display: 'block', mt: 0.3 }}>
                                    Face recognition will be used for attendance
                                </Typography>
                            </Box>
                            <ChevronRightIcon sx={{ color: '#0f172a' }} />
                        </Paper>

                        <Box sx={{ flexGrow: 1, minHeight: 40 }} />
                        <Divider sx={{ mb: 4, borderColor: '#f1f5f9' }} />

                        <Stack spacing={2.5}>
                            {[
                                {
                                    title: 'Registration Guidelines',
                                    desc: 'Read instructions on how to register your courses.',
                                    icon: <InfoOutlinedIcon sx={{ fontSize: 24, color: '#0f172a' }} />,
                                    action: () => setGuidelinesOpen(true)
                                },
                                {
                                    title: 'Get Registration Slip',
                                    desc: 'Download course registration slip.',
                                    icon: <DownloadIcon sx={{ fontSize: 24, color: '#0f172a' }} />,
                                    action: () => {
                                        const enrolledList = courses.filter(c => selectedCourses.includes(c.id));
                                        generateRegistrationSlip(currentUser, enrolledList);
                                    }
                                },
                                {
                                    title: 'Previous Registrations',
                                    desc: 'View and download previous course registrations.',
                                    icon: <HistoryIcon sx={{ fontSize: 24, color: '#0f172a' }} />,
                                    action: () => setHistoryOpen(true)
                                }
                            ].map((action, idx) => (
                                <Paper
                                    key={idx}
                                    variant="outlined"
                                    onClick={action.action}
                                    sx={{
                                        p: 2, display: 'flex', alignItems: 'center', borderRadius: '12px', cursor: 'pointer',
                                        borderColor: '#e2e8f0', '&:hover': { bgcolor: '#f8fafc' }
                                    }}
                                >
                                    <Box sx={{ mr: 2.5, display: 'flex', alignItems: 'center' }}>
                                        {action.icon}
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{action.title}</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', display: 'block', mt: 0.3 }}>
                                            {action.desc}
                                        </Typography>
                                    </Box>
                                    <ChevronRightIcon sx={{ color: '#0f172a' }} />
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>
                </Box>
            </Box>

            {/* ==================== GUIDELINES MODAL DIALOG DISPLAY ==================== */}
            <Dialog
                open={guidelinesOpen}
                onClose={() => setGuidelinesOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <InfoOutlinedIcon sx={{ color: '#0f172a' }} />
                    Course Registration Guidelines
                </DialogTitle>

                <Divider sx={{ mx: 3 }} />

                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Box display="flex" gap={2}>
                            <CheckCircleOutlineIcon sx={{ color: '#10b981', mt: 0.3 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    Step 1: Select Your Core Courses
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    Check the corresponding card boxes next to the course catalog options assigned to your current level path.
                                </Typography>
                            </Box>
                        </Box>

                        <Box display="flex" gap={2}>
                            <CheckCircleOutlineIcon sx={{ color: '#10b981', mt: 0.3 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    Step 2: Complete Face ID Biometrics
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    Ensure your Face ID biometric verification profile is scanned completely to unlock automated lecture attendance checks.
                                </Typography>
                            </Box>
                        </Box>

                        <Box display="flex" gap={2}>
                            <PriorityHighIcon sx={{ color: '#f59e0b', mt: 0.3 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    Important Credit Limits & Cap rules
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    The maximum capacity baseline limit is **24 credit units** per active semester curriculum.
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => setGuidelinesOpen(false)}
                        variant="contained"
                        disableElevation
                        sx={{
                            bgcolor: '#0f172a', color: 'white', borderRadius: '8px',
                            textTransform: 'none', fontWeight: 600,
                            '&:hover': { bgcolor: '#1e293b' }
                        }}
                    >
                        Got it, thanks!
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ==================== PREVIOUS REGISTRATIONS ARCHIVE MODAL ==================== */}
            <Dialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <HistoryIcon sx={{ color: '#0f172a' }} />
                    Registration Archives
                </DialogTitle>

                <Divider sx={{ mx: 3 }} />

                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {pastRegistrations.map((record) => (
                            <Paper
                                key={record.id}
                                variant="outlined"
                                sx={{
                                    p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    borderRadius: '12px', borderColor: '#e2e8f0'
                                }}
                            >
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                        {record.semester}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                                        Filed on: {record.dateRegistered} • {(record.courses || []).length} Courses
                                    </Typography>
                                </Box>

                                <IconButton
                                    onClick={() => generateRegistrationSlip(currentUser, record.courses || [])}
                                    sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, borderRadius: '8px' }}
                                >
                                    <DownloadIcon sx={{ fontSize: 18, color: '#0f172a' }} />
                                </IconButton>
                            </Paper>
                        ))}

                        {pastRegistrations.length === 0 && (
                            <Typography variant="body2" sx={{ textAlign: 'center', color: '#94a3b8', py: 4, fontStyle: 'italic' }}>
                                No historical registration records found.
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={() => setHistoryOpen(false)}
                        variant="outlined"
                        sx={{
                            borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px',
                            textTransform: 'none', fontWeight: 600,
                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                        }}
                    >
                        Close Archives
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}