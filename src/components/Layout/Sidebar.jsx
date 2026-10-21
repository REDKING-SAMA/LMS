import React from 'react';
import { Avatar, Box, Divider, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography } from '@mui/material';
import {
  DashboardOutlined,
  AccountCircleOutlined,
  PersonAddOutlined,
  CalendarMonthOutlined,
  HowToRegOutlined,
  LogoutRounded,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import secureCourselogo from '../../assets/secureCourselogo.png';

// Paths now resolve relative to role, matching the real router structure:
// /dashboard/student/... and /dashboard/staff/...
const menuItems = [
  { text: 'Dashboard', icon: <DashboardOutlined />, getPath: (role) => `/dashboard/${role}` },
  { text: 'Profile', icon: <AccountCircleOutlined />, getPath: (role) => `/dashboard/${role}/profile` },
  {
    text: 'Registration',
    icon: <PersonAddOutlined />,
    getPath: (role) => `/dashboard/${role}/registration`,
    roles: ['student'],
  },
  {
    text: 'Timetable',
    icon: <CalendarMonthOutlined />,
    getPath: (role) => `/dashboard/${role}/timetable`,
  },
  // { text: 'Attendance', icon: <HowToRegOutlined />, getPath: (role) => `/dashboard/${role}/attendance` },
];

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function Sidebar({ userRole = "student" }) {
  const location = useLocation();
  const navigate = useNavigate();

  // role is already lowercased by AuthContext, but normalize defensively
  const role = sessionStorage.getItem("role") || userRole;
  const fullName = sessionStorage.getItem("fullName") || "Student";

  const allowedItems = menuItems.filter(item => !item.roles || item.roles.includes(role));

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // fall through — still clear local session so the UI doesn't get stuck
    }
    sessionStorage.removeItem("uid");
    sessionStorage.removeItem("fullName");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  return (
    <Box sx={{
      width: 260, height: '100vh', position: 'sticky', top: 0, left: 0,
      borderRight: '1px solid #e2e8f0', bgcolor: '#f4f6f9', p: 3, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column'
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 4 }}>
        <Box sx={{ width: 80, height: 80, mb: 1.5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={secureCourselogo} alt="SecureCourse Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', fontFamily: 'Lora, Georgia, serif', letterSpacing: '-0.5px' }}>
          SecureCourse
        </Typography>
      </Box>
      <List sx={{ px: 1, flex: 1 }}>
        {allowedItems.map((item) => {
          const targetPath = item.getPath(role);
          const isCurrentlyActive = location.pathname === targetPath;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton
                selected={isCurrentlyActive}
                onClick={() => navigate(targetPath)}
                sx={{
                  borderRadius: '12px', py: 1.2, transition: 'all 0.2s ease-in-out',
                  '&.Mui-selected': {
                    bgcolor: '#0f172a', color: '#ffffff',
                    '& .MuiListItemIcon-root': { color: '#ffffff' },
                    '& .MuiTypography-root': { fontWeight: 700 },
                    '&:hover': { bgcolor: '#1e293b' }
                  },
                  '&:hover': {
                    bgcolor: '#e2e8f0', borderRadius: '12px',
                    '& .MuiListItemIcon-root': { color: '#0f172a' },
                    '& .MuiListItemText-root': { color: '#0f172a' }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: isCurrentlyActive ? '#ffffff' : '#94a3b8', transition: 'color 0.2s' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ style: { fontSize: '0.95rem', fontWeight: 500 } }}
                  sx={{ color: isCurrentlyActive ? '#ffffff' : '#94a3b8', transition: 'color 0.2s' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* ── Bottom: profile + logout ── */}
      <Divider sx={{ borderColor: '#e2e8f0', mb: 1.5 }} />
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          borderRadius: '10px', px: 1.5, py: 1,
          cursor: 'pointer', transition: 'background 0.18s',
          '&:hover': { bgcolor: '#e2e8f0' },
        }}
        onClick={() => navigate(`/dashboard/${role}/profile`)}
      >
        <Avatar sx={{ width: 34, height: 34, bgcolor: '#0f172a', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {getInitials(fullName)}
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fullName}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>
            {role}
          </Typography>
        </Box>
        <Tooltip title="Log out" placement="top" arrow>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.1)' } }}
          >
            <LogoutRounded sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}