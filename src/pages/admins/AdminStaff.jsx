import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, IconButton, Menu, MenuItem, Modal, Select, FormControl, InputLabel } from '@mui/material';
import { Add, MoreVert, Search } from '@mui/icons-material';
import { db } from '../../firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const AdminStaff = () => {
    const auth = getAuth();
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', status: '' });
    const [openAddModal, setOpenAddModal] = useState(false);
    const [newStaff, setNewStaff] = useState({
        name: '',
        email: '',
        password: '',
        courses: [],
        permissions: [] // Ensure this is always defined as an array
    });
    useEffect(() => {
        // Query for Staff role
        const usersQ = query(collection(db, 'users'), where('role', '==', 'staff'), orderBy('name', 'asc'));
        const coursesCol = collection(db, 'courses');
        // Separate collection from real day-to-day attendance tracking (see
        // AdminAttendance.jsx) — this only holds account-approval status.
        const approvalsCol = collection(db, 'staffApprovals');

        // Create state variables to hold data from each listener
        let users = [];
        let courses = [];
        let approvals = [];

        const updateStaffList = () => {

            // This function merges the data whenever any listener updates
            const mergedData = users.map(user => {
                const courseMatches = courses.filter(c => c.staffId === user.id);
                const approvalMatch = approvals.find(a => a.staffId === user.id);

                return {
                    ...user,
                    courseCount: courseMatches.length,
                    status: approvalMatch ? approvalMatch.status : "Pending",
                    approvalId: approvalMatch ? approvalMatch.id : null
                };
            });
            setStaffList(mergedData);
            setLoading(false);
        };

        const unsubU = onSnapshot(usersQ, (snap) => {
            users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            updateStaffList();
        });

        const unsubC = onSnapshot(coursesCol, (snap) => {
            courses = snap.docs.map(d => ({ ...d.data() }));
            updateStaffList();
        });

        const unsubA = onSnapshot(approvalsCol, (snap) => {
            approvals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            updateStaffList();
        });

        return () => {
            unsubU();
            unsubC();
            unsubA();
        };
    }, []);

    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleMenuOpen = (event, staff) => {
        setAnchorEl(event.currentTarget);
        setSelectedStaff(staff);
    };

    const handleEditClick = () => {
        setEditForm({ name: selectedStaff.name, status: selectedStaff.status });
        setOpenModal(true);
        setAnchorEl(null);
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this staff member?")) {
            await deleteDoc(doc(db, 'users', selectedStaff.id));
            setAnchorEl(null);
        }
    };

   const handleSaveEdit = async () => {
    try {
        // 1. Update the 'users' document (Always works)
        await updateDoc(doc(db, 'users', selectedStaff.id), { name: editForm.name });

        // 2. Update or Create the staff approval-status document
        if (selectedStaff.approvalId) {
            // Update existing
            await updateDoc(doc(db, 'staffApprovals', selectedStaff.approvalId), {
                status: editForm.status
            });
        } else {
            // Create new record if one didn't exist
            await addDoc(collection(db, 'staffApprovals'), {
                staffId: selectedStaff.id,
                status: editForm.status
            });
        }

        // 3. Update local state to force UI refresh
        setStaffList(prev => prev.map(s => 
            s.id === selectedStaff.id ? { ...s, name: editForm.name, status: editForm.status } : s
        ));

        setOpenModal(false);
    } catch (error) {
        console.error("Error updating document: ", error);
        alert("Failed to save changes.");
    }
};


    const handleAddStaff = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, newStaff.email, newStaff.password);
            const uid = userCredential.user.uid;

            // Create the user
            await setDoc(doc(db, 'users', uid), {
                name: newStaff.name,
                email: newStaff.email,
                role: 'staff',
                bannerUrl: `https://ui-avatars.com/api/?name=${newStaff.name}`,
                createdAt: new Date()
            });

            // Add each selected course to the collection
            const coursePromises = newStaff.courses.map(courseName =>
                addDoc(collection(db, 'courses'), {
                    staffId: uid,
                    courseName: courseName
                })
            );

            // Add approval-status record
            const approvalPromise = addDoc(collection(db, 'staffApprovals'), {
                staffId: uid,
                status: 'Pending'
            });

            await Promise.all([...coursePromises, approvalPromise]);

            setOpenAddModal(false);
            setNewStaff({ name: '', email: '', password: '', courses: [], permissions: [] });
        } catch (error) {
            alert("Error: " + error.message);
        }
    };

    return (
        <Box sx={{ p: 3, backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'black' }}>Staff Management</Typography>
                <Button variant="contained" sx={{ backgroundColor: '#050e89' }} startIcon={<Add />} onClick={() => setOpenAddModal(true)}>
                    Add Staff
                </Button>
            </Box>

            <Paper sx={{ p: 2, borderRadius: 2 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                {/* CHANGED HEADER */}
                                <TableCell sx={{ fontWeight: 'bold' }}>No. of Courses</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredStaff.map((s) => (
                                <TableRow key={s.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar src={s.bannerUrl} />
                                            <Box>
                                                <Typography sx={{ fontWeight: 500 }}>{s.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    {/* CHANGED TO DISPLAY COUNT */}
                                    <TableCell>{s.courseCount}</TableCell>
                                    <TableCell>{s.status}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={(e) => { setSelectedStaff(s); setAnchorEl(e.currentTarget); }}>
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
                <Box sx={{ p: 4, backgroundColor: 'white', m: 'auto', mt: 5, maxWidth: 400, borderRadius: 2, maxHeight: '80vh', overflowY: 'auto' }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'black' }}>Add New Staff</Typography>

                    <TextField fullWidth label="Full Name" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} sx={{ mb: 2 }} />

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Assign Courses</InputLabel>
                        <Select
                            multiple
                            value={newStaff.courses}
                            onChange={(e) => setNewStaff({ ...newStaff, courses: e.target.value })}
                            renderValue={(selected) => selected.join(', ')} // Shows selected items as a comma-separated list
                        >
                            {["Math", "Science", "History", "English"].map((course) => (
                                <MenuItem key={course} value={course}>
                                    <input type="checkbox" checked={newStaff.courses.includes(course)} readOnly />
                                    <span style={{ marginLeft: 8 }}>{course}</span>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Typography variant="subtitle2" sx={{ mt: 1 }}>Permissions</Typography>
                    {["Can Edit Grades", "Can Add Staff"].map((perm) => (
                        <label key={perm} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                            <input
                                type="checkbox"
                                // Add (newStaff.permissions || []) to handle the undefined case
                                checked={(newStaff.permissions || []).includes(perm)}
                                onChange={(e) => {
                                    const currentPerms = newStaff.permissions || []; // Safeguard here too
                                    const nextPerms = e.target.checked
                                        ? [...currentPerms, perm]
                                        : currentPerms.filter(p => p !== perm);
                                    setNewStaff({ ...newStaff, permissions: nextPerms });
                                }}
                            />
                            <span style={{ marginLeft: 8 }}>{perm}</span>
                        </label>
                    ))}

                    <TextField fullWidth type="password" label="Password" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} sx={{ mt: 2, mb: 2 }} />

                    <Button variant="contained" fullWidth sx={{ backgroundColor: '#050e89' }} onClick={handleAddStaff}>Save Staff</Button>
                </Box>
            </Modal>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={handleEditClick}>Edit</MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'red' }}>Delete</MenuItem>
            </Menu>

            <Modal open={openModal} onClose={() => setOpenModal(false)}>
                <Box sx={{ p: 4, backgroundColor: 'white', m: 'auto', mt: 10, maxWidth: 400, borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'black' }}>Edit Staff</Typography>
                    <TextField fullWidth label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} sx={{ mb: 2 }} />
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

export default AdminStaff;