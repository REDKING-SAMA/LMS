import React, { useEffect } from "react";
import Login from "./Login";
import Signup from "./Signup";
import sideImage from "../assets/sideImage.png";
import logo from "../assets/Logo.png";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";

function Layout1() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const location = useLocation();
  const isSIgnUp = location.pathname === "/signup";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        flexDirection: { md: "row", xs: "column" },
        backgroundColor: "#ffffff",
        height: "100vh",
        width: "100%",
        pb: "16px",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* //left side */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          flex: { md: 1, xs: 1 },
          height: "100%",
          gap: "24px",
          minHeight: 0,
          overflow: "hidden",
          px: { xs: 3, sm: 4, md: 6 },
          pb: { xs: 2, md: "16px" },
          boxSizing: "border-box",
          order: { xs: 2, md: 1 },
        }}
      >
        <Box
          sx={{
            display: { md: "flex", xs: "none" },
            flexDirection: "row",
            justifyContent: isSIgnUp ? "flex-start" : "center",
            alignItems: "center",
            pl: isSIgnUp ? 30 : 0,
            paddingTop: "24px",
            width: "100%",
            mb: 2,
          }}
        >
          <img
            src={logo}
            sx={{
            }}
            style={{
              paddingTop: "32px",
              maxHeight: "100px",
              maxWidth: "150px",
              objectFit: "contain",
            }}
            alt="SecureCourse Logo"
          />
        </Box>

        {/* form */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            flexDirection: "column",
            pt: { md: 0, xs: 2 },
            alignItems: { md: "center", xs: "flex-start" },
            width: "100%",
            maxWidth: { md: "480px", xs: "100%" },
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {/* <Login sx={{ width: "65%", }}/>
    <Signup sx={{ }} /> */}
          <Outlet />
        </Box>
      </Box>

      {/* //right side */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flex: { md: 1 },
          height: { md: "100%", sm: "350px", xs: "300px" },
          order: { md: 2, xs: 1 },
        }}
      >
        <Box
          sx={{
            display: { md: "block", xs: "flex" },
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            width: "100%",
            height: { xs: "36vh", sm: "42vh", md: "100%" },
            overflow: "hidden",
            flexShrink: 0,
            borderRadius: { xs: " 12px", sm: "18px", md: "24px" },
          }}
        >
          <img
            src={sideImage}
            alt="Side"
            sx={{
              width: { md: "100%", xs: "800px" },
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              maxHeight: "960px",
              maxWidth: "672px",
              borderRadius: "inherit",
            }}
          />
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              position: "absolute",
              inset: 0,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={logo}
              alt="SecureCourse"
              style={{ maxHeight: 90, maxWidth: 140, objectFit: "contain" }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Layout1;
