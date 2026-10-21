import React, { useState, useEffect } from 'react';
import { Box, Stack, Typography, IconButton, Badge, Avatar, Menu, MenuItem, Divider, Grow } from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu'; 

// 👤 Menu Icon Set
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

// 🌟 Firebase & Routing Engine Connections
import { db, auth } from "../../firebase";
import { doc, onSnapshot, collection, query, where, writeBatch } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Link } from "react-router-dom"; 

// 🗺️ Role-Driven Navigation Matrix Configuration
const ROLE_ROUTES = {
  Student: {
    profile: "/profile",               
    password: "/change-password"       
  },
  Staff: {
    profile: "/staff/profile",         
    password: "/staff/change-password" 
  }
};

const getInitials = (name) => {
  if (!name) return 'ST';
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function Navbar({ onMenuToggle }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]); 
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hideBadgeTemporarily, setHideBadgeTemporarily] = useState(false);

  // 🕹️ Dropdown Anchor States
  const [anchorElProfile, setAnchorElProfile] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  
  const isProfileMenuOpen = Boolean(anchorElProfile);
  const isNotifyMenuOpen = Boolean(anchorElNotifications);

  useEffect(() => {
    
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Real-time Profile Stream
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeNavbarData = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setCurrentUser({
              fullName: data.fullName || "Student",
              role: data.role || "Student", 
              avatarUrl: data.avatarUrl || "" 
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("❌ [NAVBAR ENGINE] Profile snapshot failed:", error);
          setLoading(false);
        });

        // Real-time Notification Stream
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef, 
          where("recipientId", "==", user.uid), 
          where("status", "==", "unread")
        );

        const unsubscribeNotifications = onSnapshot(q, (querySnapshot) => {
          setUnreadCount(querySnapshot.size);
          const fetchedNotifications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setNotifications(fetchedNotifications);
        }, (error) => {
          console.error("❌ [NAVBAR ENGINE] Notification snapshot failed:", error);
        });

        return () => {
          unsubscribeNavbarData();
          unsubscribeNotifications();
        };
      } else {
        setCurrentUser(null);
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleOpenProfileMenu = (event) => setAnchorElProfile(event.currentTarget);
  const handleCloseProfileMenu = () => setAnchorElProfile(null);

  const handleOpenNotifyMenu = (event) => {
    setAnchorElNotifications(event.currentTarget);
    setHideBadgeTemporarily(true); 
  };

  const handleCloseNotifyMenu = async () => {
    setAnchorElNotifications(null);
    setHideBadgeTemporarily(false); 

    if (notifications.length > 0) {
      try {
        const batch = writeBatch(db);
        notifications.forEach((notify) => {
          const docRef = doc(db, "notifications", notify.id);
          batch.update(docRef, { status: "read" });
        });
        await batch.commit();
      } catch (error) {
        console.error("❌ [NAVBAR ENGINE]: Failed to update notification statuses:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      handleCloseProfileMenu();
      await signOut(auth);
      console.log("👋 [NAVBAR ENGINE]: User logged out successfully.");
    } catch (error) {
      console.error("❌ [NAVBAR ENGINE]: Logout action failed:", error.message);
    }
  };

  // 🛠️ CASE INSENSITIVITY FIX ENGINE
  // Safe validation fallback to match 'staff' or 'student' seamlessly to matrix rules
  const matchedRoleKey = currentUser?.role
    ? Object.keys(ROLE_ROUTES).find(key => key.toLowerCase() === currentUser.role.toLowerCase()) || "Student"
    : "Student";

  return (
    <>
      {/* ================================================================== */}
      {/* 💻 DESKTOP & TABLET VIEW                                          */}
      {/* ================================================================== */}
      <Box 
        component="header"
        sx={{
          display: { xs: 'none', sm: 'flex' }, 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          p: 2, px: 6, bgcolor: 'white', 
          borderBottom: '1px solid #e2e8f0', 
          position: 'sticky', top: 0, zIndex: 100, 
        }}
      >
        <Stack direction="row" spacing={4} sx={{ alignItems: 'center' }}>
          <IconButton size="small" onClick={handleOpenNotifyMenu}>
            <Badge 
              badgeContent={unreadCount} 
              color="error" 
              invisible={unreadCount === 0 || hideBadgeTemporarily}
            >
              <NotificationsNoneOutlinedIcon sx={{ color: '#64748b', fontSize: 26 }} />
            </Badge>
          </IconButton>

          {!loading && currentUser && (
            <Stack 
              direction="row" 
              spacing={1.5} 
              onClick={handleOpenProfileMenu} 
              sx={{ alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            >
              <Avatar
                src={currentUser.avatarUrl || undefined} 
                sx={{ width: 40, height: 40, bgcolor: '#0f172a', color: '#ffffff', fontWeight: 600, fontSize: '0.9rem', border: "1px solid #e2e8f0" }}
              >
                {getInitials(currentUser.fullName)} 
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  {currentUser.fullName} 
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', textAlign: 'left', fontWeight: 500 }}>
                  {currentUser.role}
                </Typography>
              </Box>
              <KeyboardArrowDownIcon 
                sx={{ 
                  color: '#64748b', 
                  fontSize: 20,
                  transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease'
                }} 
              />
            </Stack>
          )}
        </Stack>
      </Box>

      {/* ================================================================== */}
      {/* 📱 MOBILE HEADER APP BAR                                          */}
      {/* ================================================================== */}
      <Box
        component="header"
        sx={{
          display: { xs: 'flex', sm: 'none' }, 
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1.5, px: 2, bgcolor: 'white',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky', top: 0, zIndex: 100
        }}
      >
        <IconButton size="medium" onClick={onMenuToggle} sx={{ color: '#0f172a' }}>
          <MenuIcon sx={{ fontSize: 26 }} />
        </IconButton>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <IconButton size="small" onClick={handleOpenNotifyMenu}>
            <Badge badgeContent={unreadCount} color="error" invisible={unreadCount === 0 || hideBadgeTemporarily}>
              <NotificationsNoneOutlinedIcon sx={{ color: '#64748b', fontSize: 24 }} />
            </Badge>
          </IconButton>
          
          {!loading && currentUser && (
            <Avatar
              src={currentUser.avatarUrl || undefined} 
              onClick={handleOpenProfileMenu}
              sx={{ width: 34, height: 34, bgcolor: '#0f172a', color: '#ffffff', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              {getInitials(currentUser.fullName)} 
            </Avatar>
          )}
        </Stack>
      </Box>

      {/* ================================================================== */}
      {/* 🛸 OVERLAY MENUS                                                   */}
      {/* ================================================================== */}

      {/* Notification Menu */}
      <Menu
        anchorEl={anchorElNotifications}
        open={isNotifyMenuOpen}
        onClose={handleCloseNotifyMenu}
        TransitionComponent={Grow}
        transitionDuration={200}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1.5, width: 320, maxHeight: 400, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Notifications
          </Typography>
        </Box>
        <Divider sx={{ borderColor: '#e2e8f0' }} />

        {notifications.length === 0 ? (
          <MenuItem disabled sx={{ py: 3, justifyContent: 'center', color: '#94a3b8 !important', fontSize: '0.85rem', fontStyle: 'italic' }}>
            No unread announcements.
          </MenuItem>
        ) : (
          notifications.map((notify) => (
            <MenuItem 
              key={notify.id} 
              onClick={handleCloseNotifyMenu}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', whiteSpace: 'normal', '&:last-child': { borderBottom: 'none' } }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e3a8a', mb: 0.5 }}>
                {notify.title || notify.heading || "System Announcement"}
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.4 }}>
                {notify.message || notify.text || notify.content || "No details provided."}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Profile Menu */}
      {currentUser && (
        <Menu
          anchorEl={anchorElProfile}
          open={isProfileMenuOpen}
          onClose={handleCloseProfileMenu}
          TransitionComponent={Grow} 
          transitionDuration={250}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1.5, p: 1, minWidth: 190, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              '& .MuiMenuItem-root': {
                px: 2, py: 1.2, borderRadius: 1, color: '#1e293b', fontWeight: 500, fontSize: '0.9rem', gap: 2,
                transition: 'all 0.2s ease', '&:hover': { bgcolor: '#f1f5f9' }
              }
            }
          }}
        >
          {/* Using normalized matchedRoleKey to guarantee target links load successfully */}
          <MenuItem component={Link} to={ROLE_ROUTES[matchedRoleKey].profile} onClick={handleCloseProfileMenu}>
            <AccountCircleOutlinedIcon sx={{ color: '#0f172a', fontSize: 22 }} />
            Profile
          </MenuItem>
          
          <MenuItem component={Link} to={ROLE_ROUTES[matchedRoleKey].password} onClick={handleCloseProfileMenu}>
            <LockOutlinedIcon sx={{ color: '#0f172a', fontSize: 22 }} />
            Change Password
          </MenuItem>
          
          <Divider sx={{ my: 1, borderColor: '#e2e8f0' }} />
          
          <MenuItem onClick={handleLogout} sx={{ '&:hover': { bgcolor: '#fef2f2 !important', color: '#ef4444' } }}>
            <LogoutOutlinedIcon sx={{ fontSize: 22 }} />
            Logout
          </MenuItem>
        </Menu>
      )}
    </>
  );
}