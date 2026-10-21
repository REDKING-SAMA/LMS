import React, { useEffect, useState } from 'react';
import { Box, Drawer } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Sidebar from '../components/Layout/Sidebar';
import Navbar from '../components/Layout/Navbar';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged (not auth.currentUser) avoids the race where Firebase
    // hasn't finished restoring the session yet on a hard refresh.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        const { role: rawRole = 'student' } = snap.exists() ? snap.data() : {};
        setRole(rawRole.trim().toLowerCase());
      } catch {
        setRole('student');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  // Avoid flashing the wrong sidebar before the Firestore role lookup resolves
  if (loading) return null;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* 1. NAVIGATION SIDEBAR CONTROLLER */}
      <Box
        component="nav"
        sx={{
          width: { xs: 0, sm: 80, md: 260 },
          flexShrink: 0
        }}
      >
        {/* MOBILE SLIDE-OUT DRAWER (xs sizing only) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-backdrop': {
              bgcolor: 'rgba(15, 23, 42, 0.3)',
            },
            '& .MuiDrawer-paper': {
              width: 260,
              boxSizing: 'border-box',
              bgcolor: 'white',
              borderRight: '1px solid #e2e8f0',
              boxShadow: '4px 0px 24px rgba(15, 23, 42, 0.08)'
            },
          }}
        >
          <Box onClick={handleDrawerClose} sx={{ height: '100%' }}>
            <Sidebar userRole={role} currentUser={user} />
          </Box>
        </Drawer>
        {/* TABLET MINI-ICON STRIP (sm sizing only) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: 80,
              boxSizing: 'border-box',
              overflowX: 'hidden',
              bgcolor: 'white',
              borderRight: '1px solid #e2e8f0',
            },
          }}
          open
        >
          <Sidebar userRole={role} currentUser={user} />
        </Drawer>
        {/* DESKTOP FULL SIDEBAR (md sizes and up) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: 260,
              boxSizing: 'border-box',
              bgcolor: 'white',
              borderRight: '1px solid #e2e8f0',
            },
          }}
          open
        >
          <Sidebar userRole={role} currentUser={user} />
        </Drawer>
      </Box>
      {/* 2. MAIN WINDOW CONTENT PORT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            xs: '100%',
            sm: `calc(100% - 80px)`,
            md: `calc(100% - 260px)`
          },
          p: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Navbar onMenuToggle={handleDrawerToggle} />
        {/* Dynamic page contents block */}
        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}