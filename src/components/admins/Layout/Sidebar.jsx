import React, { useState } from "react";
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Tooltip, Divider, IconButton, Collapse,
} from "@mui/material";
import {
  DashboardRounded, MenuBookRounded, CalendarMonthRounded,
  EventRounded, GroupRounded, PersonRounded, PersonAddRounded,
  BarChartRounded, LogoutRounded, ExpandLess, ExpandMore, CloseRounded,
  Image,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import Logo from '../../../assets/logo.png'

const NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <DashboardRounded />,
    getPath: (role) => `/dashboard/${role}`,
  },
  {
    id: "academic",
    label: "Academic",
    icon: <MenuBookRounded />,
    children: [
      { id: "timetable", label: "Timetable", icon: <CalendarMonthRounded />, getPath: (role) => `/dashboard/${role}/timetable` },
      { id: "events",    label: "Events",    icon: <EventRounded />,         getPath: (role) => `/dashboard/${role}/events` },
    ],
  },
  {
    id: "UserManagement",
    label: "UserManagement",
    icon: <GroupRounded />,
    children: [
      { id: "students",  label: "Students", icon: <PersonRounded />,    getPath: (role) => `/dashboard/${role}/students` },
      { id: "staff",     label: "Staff",    icon: <GroupRounded />,     getPath: (role) => `/dashboard/${role}/staff` },
    ],
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: <BarChartRounded />,
    getPath: (role) => `/dashboard/${role}/attendance`,
  },
];

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function Sidebar({
  userRole   = "admin",
  currentUser = null,
  collapsed  = false,   // true = 72px icon rail (tablet)
  onClose    = null,    // passed from mobile drawer so X button can close it
}) {
  const location = useLocation();
  const navigate  = useNavigate();
  const role      = (userRole || "admin").toLowerCase();
  const userName  = currentUser?.displayName || "Admin User";

  const [openGroups, setOpenGroups] = useState({ academic: true, people: false });
  const toggleGroup = (id) => setOpenGroups((p) => ({ ...p, [id]: !p[id] }));

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.removeItem("uid");
    navigate("/adminLogin", { replace: true });
  };

  const go = (path) => {
    navigate(path);
    onClose?.(); // close mobile drawer after navigation
  };

  /* ── Shared sx helpers ── */
  const navBtnSx = (active) => ({
    borderRadius: "10px",
    px: collapsed ? 0 : 1.5,
    py: 1.1,
    mb: 0.5,
    gap: collapsed ? 0 : 1.5,
    justifyContent: collapsed ? "center" : "flex-start",
    minHeight: 44,
    transition: "all 0.18s ease",
    color: active ? "#fff" : "rgba(255,255,255,0.5)",
    bgcolor: active ? "rgba(255,255,255,0.12)" : "transparent",
    "&:hover": {
      bgcolor: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)",
      color: "#fff",
      transform: collapsed ? "none" : "translateX(2px)",
    },
    "& .MuiListItemIcon-root": {
      minWidth: 0,
      color: active ? "#fff" : "rgba(255,255,255,0.45)",
      transition: "color 0.18s",
      justifyContent: "center",
    },
    "&:hover .MuiListItemIcon-root": { color: "#fff" },
  });

  const subBtnSx = (active) => ({
    borderRadius: "8px",
    pl: 2.5, pr: 1.5, py: 0.85, mb: 0.25,
    gap: 1.5, minHeight: 38,
    transition: "all 0.15s ease",
    color: active ? "#fff" : "rgba(255,255,255,0.4)",
    bgcolor: active ? "rgba(255,255,255,0.1)" : "transparent",
    "&:hover": { bgcolor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", transform: "translateX(2px)" },
    "& .MuiListItemIcon-root": {
      minWidth: 0,
      color: active ? "#fff" : "rgba(255,255,255,0.35)",
      transition: "color 0.15s",
      "& svg": { fontSize: 17 },
    },
    "&:hover .MuiListItemIcon-root": { color: "rgba(255,255,255,0.8)" },
  });

  const ActiveDot = () => (
    <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#60a5fa", ml: "auto", flexShrink: 0 }} />
  );

  return (
    <Box
      sx={{
        width: "100%",          // fills whatever the Drawer paper gives it
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(160deg, #0f172a 0%, #1a2744 60%, #0f2847 100%)",
        boxSizing: "border-box",
        overflowX: "hidden",
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: 3 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 4 },
      }}
    >
      {/* ── Logo row ── */}
      <Box
        sx={{
          px: collapsed ? 1 : 2.5, pt: 3, pb: 2.5,
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 1.5, flexShrink: 0,
        }}
      >
        <Box sx={{ textAlign:'center', width: '200px'}}>
          <img src={Logo} alt="Logo"/>
        </Box>

        {/* Close button — only shown inside mobile overlay drawer */}
        {!collapsed && onClose && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.08)" } }}
          >
            <CloseRounded sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: collapsed ? 1 : 2 }} />

      {/* ── Nav ── */}
      <Box sx={{ flex: 1, px: collapsed ? 1 : 1.5, pt: 1.5, pb: 1 }}>
        <List disablePadding>
          {NAV.map((item) => {
            /* Parent with children */
            if (item.children) {
              const anyActive = item.children.some((c) => c.getPath && isActive(c.getPath(role)));

              if (collapsed) {
                return (
                  <Tooltip key={item.id} title={item.label} placement="right" arrow>
                    <ListItemButton sx={navBtnSx(anyActive)}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                    </ListItemButton>
                  </Tooltip>
                );
              }

              return (
                <Box key={item.id}>
                  <ListItemButton onClick={() => toggleGroup(item.id)} sx={navBtnSx(anyActive)}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: anyActive ? 600 : 400 }}
                    />
                    <Box sx={{ ml: "auto", color: "rgba(255,255,255,0.3)", display: "flex" }}>
                      {openGroups[item.id] ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                    </Box>
                  </ListItemButton>

                  <Collapse in={openGroups[item.id]} timeout={200}>
                    <List disablePadding sx={{ pl: 1 }}>
                      {item.children.map((child) => {
                        const path   = child.getPath(role);
                        const active = isActive(path);
                        return (
                          <ListItemButton key={child.id} onClick={() => go(path)} sx={subBtnSx(active)}>
                            <ListItemIcon>{child.icon}</ListItemIcon>
                            <ListItemText
                              primary={child.label}
                              primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: active ? 600 : 400 }}
                            />
                            {active && <ActiveDot />}
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            }

            /* Leaf item */
            const path   = item.getPath(role);
            const active = isActive(path);
            return (
              <Tooltip key={item.id} title={collapsed ? item.label : ""} placement="right" arrow>
                <ListItemButton onClick={() => go(path)} sx={navBtnSx(active)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  {!collapsed && (
                    <>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: active ? 600 : 400 }}
                      />
                      {active && <ActiveDot />}
                    </>
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* ── Bottom: profile + logout ── */}
      <Box sx={{ px: collapsed ? 1 : 1.5, pb: 2.5, flexShrink: 0 }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 1.5 }} />

        {collapsed ? (
          /* Icon-only stacked layout */
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Tooltip title={userName} placement="right" arrow>
              <Avatar
                onClick={() => go(`/dashboard/${role}/profile`)}
                sx={{
                  width: 34, height: 34, bgcolor: "#3b82f6",
                  fontSize: 13, fontWeight: 700,
                  border: "2px solid rgba(255,255,255,0.15)",
                  cursor: "pointer", "&:hover": { opacity: 0.85 },
                }}
              >
                {getInitials(userName)}
              </Avatar>
            </Tooltip>
            <Tooltip title="Log out" placement="right" arrow>
              <IconButton
                onClick={handleLogout} size="small"
                sx={{ color: "rgba(255,255,255,0.35)", "&:hover": { color: "#f87171", bgcolor: "rgba(239,68,68,0.12)" } }}
              >
                <LogoutRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          /* Full row layout */
          <Box
            sx={{
              display: "flex", alignItems: "center", gap: 1,
              borderRadius: "10px", px: 1.5, py: 1,
              cursor: "pointer", transition: "background 0.18s",
              "&:hover": { bgcolor: "rgba(255,255,255,0.07)" },
            }}
            onClick={() => go(`/dashboard/${role}/profile`)}
          >
            <Avatar
              sx={{
                width: 34, height: 34, bgcolor: "#3b82f6",
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.15)",
              }}
            >
              {getInitials(userName)}
            </Avatar>
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userName}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>
                {role}
              </Typography>
            </Box>
            <Tooltip title="Log out" placement="top" arrow>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                sx={{
                  color: "rgba(255,255,255,0.35)", transition: "color 0.15s, background 0.15s",
                  "&:hover": { color: "#f87171", bgcolor: "rgba(239,68,68,0.12)" },
                }}
              >
                <LogoutRounded sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );
}