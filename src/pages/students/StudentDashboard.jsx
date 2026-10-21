import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Typography,
    Avatar,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    CircularProgress,
    Skeleton,
    Stack,
    Divider,
    Badge
} from '@mui/material';
import {
    NotificationsNoneOutlined as NotificationsNoneIcon,
    KeyboardArrowDownOutlined as KeyboardArrowDownIcon,
    LoginOutlined as LoginIcon,
    FingerprintOutlined as FingerprintIcon,
    PersonRemoveOutlined as PersonRemoveIcon,
    ErrorOutlineOutlined as ErrorOutlineIcon,
    WarningAmberOutlined as WarningAmberIcon,
    ChevronRightOutlined as ChevronRightIcon
} from '@mui/icons-material';

// 🌟 Firebase Engine Hooks & Auth Instances
import { db, auth } from '../../firebase'; 
import { doc, collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';

// Helper to safely display 12-hour formatting strings from stored 24h document fields
function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${suffix}`;
}

export default function StudentDashboard() {
    // ⚡️ REAL-TIME SYSTEM STATE MANAGERS
    const [userProfile, setUserProfile] = useState(null); 
    const [stats, setStats] = useState({ totalCourses: 0, electives: 0, attendance: 0, absent: 0, leaves: 0, approvedLeaves: 0 });
    const [classes, setClasses] = useState({ past: [], upcoming: [] });
    const [activities, setActivities] = useState([]);
    const [tasks, setTasks] = useState({ priority: [], other: [] });
    
    // ⏳ Targeted UI Loading Flags (No more global full-screen blocking!)
    const [profileLoading, setProfileLoading] = useState(true);
    const [classesLoading, setClassesLoading] = useState(true);

    // ========================================================
    // 🌟 REAL-TIME SYNC ENGINE (FIREBASE SNAPSHOT LISTENERS)
    // ========================================================
    useEffect(() => {
        // 1. DYNAMIC AUTH ENGINE: Monitor the logged-in user state cleanly
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                let unsubscribeClasses = () => {};

                // 2. PROFILE SYNC
                const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        
                        setUserProfile({
                            id: user.uid,
                            displayName: data.fullName || "Student",
                            displayRole: data.role || "Student",
                            displayDept: data.department || "General",
                            enrolledCourses: data.enrolledCourses || []
                        });

                        setStats({
                            totalCourses: data.totalCourses || 0,
                            electives: data.electives || 0,
                            attendance: data.attendance || 0,
                            absent: data.absent || 0,
                            leaves: data.leaves || 0,
                            approvedLeaves: data.approvedLeaves || 0
                        });

                        setProfileLoading(false); // Stats & profile content ready!

                        unsubscribeClasses();

                        // 3. CLASSES SYNC
                        if (data.enrolledCourses && data.enrolledCourses.length > 0) {
                            const classesQuery = query(
                                collection(db, 'classes'),
                                where('code', 'in', data.enrolledCourses)
                            );

                            unsubscribeClasses = onSnapshot(classesQuery, (classSnapshot) => {
                                const list = classSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                const now = new Date();
                                const current24hTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                                const past = list.filter(cls => cls.time < current24hTime);
                                const upcoming = list.filter(cls => cls.time >= current24hTime);

                                setClasses({ past, upcoming });
                                setClassesLoading(false); // Classes ready!
                            }, (error) => {
                                console.error("Classes stream failure:", error);
                                setClassesLoading(false);
                            });
                        } else {
                            setClasses({ past: [], upcoming: [] });
                            setClassesLoading(false);
                        }

                    } else {
                        console.error(`❌ [DIAGNOSTIC ENGINE]: Missing document ID "${user.uid}"`);
                        setProfileLoading(false);
                        setClassesLoading(false);
                    }
                }, (error) => {
                    console.error("❌ [DIAGNOSTIC ENGINE]: Connection crash:", error);
                    setProfileLoading(false);
                    setClassesLoading(false);
                });

                // 4. SYNC RECENT ACTIVITIES TIMELINE
                const activityQuery = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(3));
                const unsubscribeActivities = onSnapshot(activityQuery, (snapshot) => {
                    setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                }, (error) => console.error("Activity stream failure:", error));

                // 5. SYNC SYSTEM TASKS ALERTS
                const tasksQuery = query(collection(db, 'tasks'), orderBy('date', 'asc'));
                const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setTasks({
                        priority: list.filter(t => t.priority === 'high' || t.priority === 'urgent'),
                        other: list.filter(t => t.priority !== 'high' && t.priority !== 'urgent')
                    });
                }, (error) => console.error("Tasks stream failure:", error));

                return () => {
                    unsubscribeProfile();
                    unsubscribeClasses();
                    unsubscribeActivities();
                    unsubscribeTasks();
                };

            } else {
                setUserProfile(null);
                setProfileLoading(false);
                setClassesLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const renderActivityIcon = (type) => {
        switch(type) {
            case 'biometric': return <FingerprintIcon fontSize="small" />;
            case 'leave':     return <PersonRemoveIcon fontSize="small" />;
            default:          return <LoginIcon fontSize="small" />;
        }
    };

    // 🚀 NO GLOBAL INTERCEPTOR RUNNING HERE anymore. The page structure renders immediately.
    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', width: '100%', p: 0, m: 0, fontFamily: 'sans-serif', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <Box sx={{ p: { xs: 2, md: 4 }, width: '100%', boxSizing: 'border-box' }}>

                {/* --- HEADER --- */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#0f172a', fontFamily: 'Poppins, sans-serif' }}>
                        Dashboard
                    </Typography>
                </Box>

                {/* --- MAIN CONTENT GRID --- */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' }, gap: 3, width: '100%' }}>

                    {/* LEFT COLUMN */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                            
                            {/* Total Courses */}
                            <Card sx={{ bgcolor: '#FDE047', p: 2.5, borderRadius: 3, boxShadow: 'none', textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#451A03' }}>Total Courses</Typography>
                                {profileLoading ? (
                                    <Skeleton variant="text" width="60%" height={50} sx={{ mx: 'auto', my: 0.5 }} />
                                ) : (
                                    <Typography sx={{ fontSize: '2.2rem', fontWeight: 700, my: 0.5, color: '#451A03' }}>
                                        {String(stats.totalCourses || 0).padStart(2, '0')}
                                    </Typography>
                                )}
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#B45309' }}>{stats.electives || 0} Electives</Typography>
                            </Card>

                            {/* Attendance */}
                            <Card sx={{ bgcolor: '#FCE7F3', p: 2.5, borderRadius: 3, boxShadow: 'none', textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#4C0519' }}>Attendance</Typography>
                                {profileLoading ? (
                                    <Skeleton variant="text" width="60%" height={50} sx={{ mx: 'auto', my: 0.5 }} />
                                ) : (
                                    <Typography sx={{ fontSize: '2.2rem', fontWeight: 700, my: 0.5, color: '#9D174D' }}>{stats.attendance || 0}%</Typography>
                                )}
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#BE123C' }}>{stats.absent || 0}% Absent</Typography>
                            </Card>

                            {/* Requested Leaves */}
                            <Card sx={{ bgcolor: '#E2E8F0', p: 2.5, borderRadius: 3, boxShadow: 'none', textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>Requested Leaves</Typography>
                                {profileLoading ? (
                                    <Skeleton variant="text" width="60%" height={50} sx={{ mx: 'auto', my: 0.5 }} />
                                ) : (
                                    <Typography sx={{ fontSize: '2.2rem', fontWeight: 700, my: 0.5, color: '#334155' }}>{stats.leaves || 0}</Typography>
                                )}
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>{stats.approvedLeaves || 0} Approved</Typography>
                            </Card>
                        </Box>

                        {/* Today's Classes */}
                        <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E3A8A', mb: 2 }}>Today's Classes</Typography>
                            
                            {classesLoading ? (
                                <Stack gap={2} sx={{ mt: 2 }}>
                                    <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 2 }} />
                                    <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: 2 }} />
                                </Stack>
                            ) : (
                                <>
                                    <Typography sx={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 500, mb: 1.5 }}>Past</Typography>
                                    {classes.past.length === 0 ? (
                                        <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', mb: 2, fontStyle: 'italic' }}>No past classes tracked today.</Typography>
                                    ) : (
                                        classes.past.map((cls) => (
                                            <Box key={cls.id} sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: cls.status === 'Absent' ? '#F3E8FF' : '#D9F99D', p: 2, borderRadius: 2, mb: 2 }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.75rem', color: cls.status === 'Absent' ? '#7E22CE' : '#4D7C0F', fontWeight: 600 }}>{cls.code}</Typography>
                                                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: cls.status === 'Absent' ? '#4A044E' : '#14532D' }}>{cls.name}</Typography>
                                                    <Typography sx={{ fontSize: '0.8rem', color: cls.status === 'Absent' ? '#7E22CE' : '#4D7C0F', mt: 0.5 }}>{cls.room}</Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: cls.status === 'Absent' ? '#4A044E' : '#14532D' }}>{fmt12(cls.time)}</Typography>
                                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: cls.status === 'Absent' ? '#EC4899' : '#15803D' }}>{cls.status || 'Attended'}</Typography>
                                                </Box>
                                            </Box>
                                        ))
                                    )}

                                    <Typography sx={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 500, mb: 1.5, mt: 1 }}>Upcoming</Typography>
                                    {classes.upcoming.length === 0 ? (
                                        <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>Finished with all classes for the day!</Typography>
                                    ) : (
                                        classes.upcoming.map((cls) => (
                                            <Box key={cls.id} sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#FAF5FF', border: '1px solid #E9D5FF', p: 2, borderRadius: 2, mb: 2, '&:last-child': { mb: 0 } }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#A21CAF', fontWeight: 600 }}>{cls.code}</Typography>
                                                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E3A8A' }}>{cls.name}</Typography>
                                                    <Typography sx={{ fontSize: '0.8rem', color: '#A21CAF', mt: 0.5 }}>{cls.room}</Typography>
                                                </Box>
                                                <Box sx={{ alignSelf: 'center' }}>
                                                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1E3A8A' }}>{fmt12(cls.time)}</Typography>
                                                </Box>
                                            </Box>
                                        ))
                                    )}
                                </>
                            )}
                        </Card>
                    </Box>

                    {/* RIGHT COLUMN */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        
                        {/* Recent Activity */}
                        <Paper sx={{ bgcolor: '#0B2559', color: '#FFFFFF', borderRadius: 3, overflow: 'hidden', boxShadow: 'none' }}>
                            <Box sx={{ p: 2.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Recent Activity</Typography>
                            </Box>
                            <List sx={{ pt: 0, pb: 1 }}>
                                {activities.length === 0 ? (
                                    <Box sx={{ px: 2.5, pb: 2 }}>
                                        <Skeleton variant="text" width="80%" height={24} sx={{ bgcolor: '#0F2E6B' }} />
                                        <Skeleton variant="text" width="50%" height={20} sx={{ bgcolor: '#0F2E6B', mt: 1 }} />
                                    </Box>
                                ) : (
                                    activities.map((act, index) => (
                                        <ListItem key={act.id || index} alignItems="flex-start" sx={{ px: 2.5, py: 1.5, bgcolor: '#0F2E6B', mb: '2px', '&:last-child': { mb: 0 } }}>
                                            <ListItemIcon sx={{ minWidth: 40, color: '#93C5FD', mt: 0.5 }}>
                                                {renderActivityIcon(act.type)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={act.title}
                                                secondary={act.timeLabel || "Just Now"}
                                                primaryTypographyProps={{ sx: { fontSize: '0.85rem', fontWeight: 500, color: '#FFFFFF' } }}
                                                secondaryTypographyProps={{ sx: { fontSize: '0.75rem', color: '#93C5FD', mt: 0.5 } }}
                                            />
                                        </ListItem>
                                    ))
                                )}
                            </List>
                        </Paper>

                        {/* Tasks */}
                        <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E3A8A', mb: 2 }}>Tasks</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500, mb: 1 }}>Priority</Typography>

                            {tasks.priority.length === 0 && tasks.other.length === 0 ? (
                                <Stack gap={1.5}>
                                    <Skeleton variant="rectangular" width="100%" height={50} sx={{ borderRadius: 2 }} />
                                    <Skeleton variant="rectangular" width="100%" height={50} sx={{ borderRadius: 2 }} />
                                </Stack>
                            ) : (
                                <>
                                    {tasks.priority.length === 0 ? (
                                        <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', mb: 2, fontStyle: 'italic' }}>Zero critical tasks pending.</Typography>
                                    ) : (
                                        tasks.priority.map((task) => (
                                            <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: task.colorVariant === 'orange' ? '#FFFDF5' : '#FFF5F5', border: task.colorVariant === 'orange' ? '1px solid #FEEBC8' : '1px solid #FEB2B2', borderRadius: 2, p: 1.5, mb: 1.5, cursor: 'pointer' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    {task.colorVariant === 'orange' ? <WarningAmberIcon sx={{ color: '#DD6B20' }} /> : <ErrorOutlineIcon sx={{ color: '#E53E3E' }} />}
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: task.colorVariant === 'orange' ? '#9C4221' : '#C53030' }}>{task.title}</Typography>
                                                        <Typography sx={{ fontSize: '0.75rem', color: task.colorVariant === 'orange' ? '#DD6B20' : '#E53E3E' }}>{task.dateLabel}</Typography>
                                                    </Box>
                                                </Box>
                                                <ChevronRightIcon sx={{ color: task.colorVariant === 'orange' ? '#DD6B20' : '#E53E3E' }} />
                                            </Box>
                                        ))
                                    )}

                                    <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500, mb: 1, mt: 1.5 }}>Other</Typography>

                                    {tasks.other.length === 0 ? (
                                        <Typography sx={{ fontSize: '0.85rem', color: '#94A3B8', fontStyle: 'italic' }}>No standard notices available.</Typography>
                                    ) : (
                                        tasks.other.map((task) => (
                                            <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, p: 1.5, cursor: 'pointer', mb: 1.5, '&:last-child': { mb: 0 } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <LoginIcon sx={{ color: '#1E3A8A' }} />
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E3A8A' }}>{task.title}</Typography>
                                                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{task.dateLabel}</Typography>
                                                    </Box>
                                                </Box>
                                                <ChevronRightIcon sx={{ color: '#1E3A8A' }} />
                                            </Box>
                                        ))
                                    )}
                                </>
                            )}
                        </Card>
                    </Box>

                </Box>
            </Box>
        </Box>
    );
}