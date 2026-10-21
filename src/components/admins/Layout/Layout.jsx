import React, { useEffect, useState } from "react";
import { Box, Drawer, CircularProgress } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const SIDEBAR_ICON = 72;
const SIDEBAR_FULL = 256;

export default function AdminLayout() {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [user,       setUser]       = useState(null);
  const [role,       setRole]       = useState(null);
  const [loading,    setLoading]    = useState(true);

  // ── Custom session check (not Firebase Auth — login writes uid to sessionStorage) ──
  useEffect(() => {
    const checkSession = async () => {
      const savedUid = sessionStorage.getItem("uid");

      if (!savedUid) {
        navigate("/adminLogin", { replace: true });
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", savedUid));

        if (!snap.exists()) {
          sessionStorage.removeItem("uid");
          navigate("/adminLogin", { replace: true });
          return;
        }

        const data = snap.data();
        const normalizedRole = (data.role || "student").trim().toLowerCase();

        if (normalizedRole !== "admin") {
          navigate("/", { replace: true });
          return;
        }

        setUser({ uid: savedUid, ...data });
        setRole(normalizedRole);
      } catch(error) {
        console.log(error);
        
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", bgcolor: "#f8fafc" }}>
        <CircularProgress size={32} thickness={4} sx={{ color: "#3b82f6" }} />
      </Box>
    );
  }

  if (role !== "admin") return null;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc", overflow: "hidden" }}>

      {/* ── NAVIGATION ── */}
      <Box
        component="nav"
        sx={{
          flexShrink: 0,
          width: { xs: 0, sm: `${SIDEBAR_ICON}px`, md: `${SIDEBAR_FULL}px` },
        }}
      >
        {/* Mobile: full-width overlay drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-backdrop": { bgcolor: "rgba(15,23,42,0.45)" },
            "& .MuiDrawer-paper": {
              width: SIDEBAR_FULL,
              boxSizing: "border-box",
              border: "none",
              boxShadow: "8px 0 32px rgba(15,23,42,0.2)",
            },
          }}
        >
          <Sidebar userRole={role} currentUser={user} collapsed={false} onClose={() => setMobileOpen(false)} />
        </Drawer>

        {/* Tablet: permanent icon-rail */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", sm: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: SIDEBAR_ICON,
              boxSizing: "border-box",
              overflowX: "hidden",
              border: "none",
            },
          }}
        >
          <Sidebar userRole={role} currentUser={user} collapsed={true} />
        </Drawer>

        {/* Desktop: permanent full sidebar */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", sm: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: SIDEBAR_FULL,
              boxSizing: "border-box",
              border: "none",
            },
          }}
        >
          <Sidebar userRole={role} currentUser={user} collapsed={false} />
        </Drawer>
      </Box>

      {/* ── MAIN CONTENT ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Navbar onMenuToggle={() => setMobileOpen((v) => !v)} />
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}