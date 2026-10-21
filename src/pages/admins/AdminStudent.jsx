import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, IconButton, Menu, MenuItem, Modal, Select, FormControl, InputLabel } from '@mui/material';
import { Add, MoreVert, Search } from '@mui/icons-material';
import { db } from '../../firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const AdminStudent = () => {
    const auth = getAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [editForm, setEditForm] = useState({ fullName: '', status: '' });

    // States consolidated: only declared once
    const [openAddModal, setOpenAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState({
        fullName: '',
        email: '',
        password: '',
        course: '',
        status: 'Pending'
    });

    useEffect(() => {
        const usersQ = query(collection(db, 'users'), where('role', '==', 'Student'), orderBy('fullName', 'asc'));
        const coursesCol = collection(db, 'courses');
        // Separate collection from real day-to-day attendance tracking (see
        // AdminAttendance.jsx) — this only holds account-approval status.
        const approvalsCol = collection(db, 'studentApprovals');

        const unsubUsers = onSnapshot(usersQ, (userSnap) => {
            const userData = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const unsubCourses = onSnapshot(coursesCol, (courseSnap) => {
                const courseData = courseSnap.docs.map(doc => ({ ...doc.data() }));

                const unsubApprovals = onSnapshot(approvalsCol, (approvalSnap) => {
                    const approvalData = approvalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    const mergedData = userData.map(user => {
                        const courseMatches = courseData.filter(c => c.studentId === user.id);
                        const approvalMatch = approvalData.find(a => a.studentId === user.id);

                        return {
                            ...user,
                            course: courseMatches.length > 0
                                ? courseMatches.map(c => c.courseName).join(', ')
                                : "N/A",
                            status: approvalMatch ? approvalMatch.status : "Pending",
                            approvalId: approvalMatch ? approvalMatch.id : null
                        };
                    });

                    setStudents(mergedData);
                    setLoading(false);
                });
                return unsubApprovals;
            });
            return unsubCourses;
        });

        return () => unsubUsers();
    }, []);

    const filteredStudents = students.filter(s =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMenuOpen = (event, student) => {
        setAnchorEl(event.currentTarget);
        setSelectedStudent(student);
    };

    const handleEditClick = () => {
        setEditForm({ fullName: selectedStudent.fullName, status: selectedStudent.status });
        setOpenModal(true);
        setAnchorEl(null);
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            await deleteDoc(doc(db, 'users', selectedStudent.id));
            setAnchorEl(null);
        }
    };

    const handleSaveEdit = async () => {
        try {
            // 1. Update the 'users' document (Always works)
            await updateDoc(doc(db, 'users', selectedStudent.id), { fullName: editForm.fullName });

            // 2. Update or Create the student approval-status document
            if (selectedStudent.approvalId) {
                // Update existing
                await updateDoc(doc(db, 'studentApprovals', selectedStudent.approvalId), {
                    status: editForm.status
                });
            } else {
                // Create new record if one didn't exist
                await addDoc(collection(db, 'studentApprovals'), {
                    studentId: selectedStudent.id,
                    status: editForm.status
                });
            }

            // 3. Update local state to force UI refresh
            setStudents(prev => prev.map(s =>
                s.id === selectedStudent.id ? { ...s, fullName: editForm.fullName, status: editForm.status } : s
            ));

            setOpenModal(false);
        } catch (error) {
            console.error("Error updating document: ", error);
            alert("Failed to save changes.");
        }
    };

    const handleAddStudent = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, newStudent.email, newStudent.password);
            const uid = userCredential.user.uid;

            await setDoc(doc(db, 'users', uid), {
                fullName: newStudent.fullName,
                email: newStudent.email,
                role: 'Student',
                bannerUrl: 'https://ui-avatars.com/api/?name=' + newStudent.fullName,
                createdAt: new Date()
            });

            await addDoc(collection(db, 'courses'), {
                studentId: uid,
                courseName: newStudent.course
            });

            await addDoc(collection(db, 'studentApprovals'), {
                studentId: uid,
                status: newStudent.status
            });

            setOpenAddModal(false);
            setNewStudent({ fullName: '', email: '', password: '', course: '', status: 'Pending' });
        } catch (error) {
            console.error("Error creating student account: ", error);
            alert("Error: " + error.message);
        }
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'black' }}>Students</Typography>
                <Button variant="contained" sx={{ backgroundColor: '#050e89', '&:hover': { backgroundColor: '#000' } }} startIcon={<Add />} onClick={() => setOpenAddModal(true)}>
                    Add Student
                </Button>
            </Box>

            <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Student List</Typography>
                    <TextField
                        size="small"
                        placeholder="Search"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'gray' }} /> }}
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Course</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredStudents.map((s) => (
                                <TableRow key={s.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar src={s.bannerUrl} />
                                            <Box>
                                                <Typography sx={{ fontWeight: 500 }}>{s.fullName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{s.course}</TableCell>
                                    <TableCell>{s.status}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={(e) => handleMenuOpen(e, s)}>
                                            <MoreVert />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Modal open={openAddModal} onClose={() => setOpenAddModal(false)}>
                <Box sx={{ p: 4, backgroundColor: 'white', m: 'auto', mt: 10, maxWidth: 400, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Add New Student</Typography>
                    <TextField fullWidth label="Full Name" value={newStudent.fullName} onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth type="password" label="Password" value={newStudent.password} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Course Name" value={newStudent.course} onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })} sx={{ mb: 2 }} />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={newStudent.status} label="Status" onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })}>
                            <MenuItem value="Approved">Approved</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" fullWidth sx={{ backgroundColor: '#050e89' }} onClick={handleAddStudent}>Save Student</Button>
                </Box>
            </Modal>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={handleEditClick}>Edit</MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'red' }}>Delete</MenuItem>
            </Menu>

            <Modal open={openModal} onClose={() => setOpenModal(false)}>
                <Box sx={{ p: 4, backgroundColor: 'white', m: 'auto', mt: 10, maxWidth: 400, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'black' }}>Edit Student</Typography>
                    <TextField fullWidth label="Name" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} sx={{ mb: 2 }} />
                    <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select value={editForm.status} label="Status" onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                            <MenuItem value="Approved">Approved</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                        </Select>
                    </FormControl>
                    <Button variant="contained" fullWidth sx={{ mt: 3, backgroundColor: '#050e89' }} onClick={handleSaveEdit}>Save Changes</Button>
                </Box>
            </Modal>
        </Box>
    );
};

export default AdminStudent;