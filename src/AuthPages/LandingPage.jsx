import React from "react";
import { Box, Typography } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const ROLES = [
  {
    key: "student",
    title: "Student",
    subtitle: "Access the students' portal here.",
    filled: true,
  },
  {
    key: "staff",
    title: "Staff",
    subtitle: "Exclusive to staff members only.",
    filled: false,
  },
  {
    key: "admin",
    title: "Admin",
    subtitle: "Restricted access for administrators.",
    filled: false,
  }
];
function LandingPage() {
  const navigate = useNavigate();
  const handleRoleClick = (role) => {
    if (role === "student") navigate("/login");
    else if (role === "staff") navigate("/staffLogin");
    else if (role === "admin") navigate("/adminLogin");
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        width: "100%",
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontFamily: "Poppins",
          fontSize: { xs: "40px", md: "52px" },
          lineHeight: 1.1,
          color: "#0B235E",
          mb: 0.5,
          mt: 1,
        }}
      >
        Hello!
      </Typography>

      <Typography
        sx={{
          fontSize: "24px",
          color: "#0B235E",
          mb: 4,
        }}
      >
        Choose your login option
      </Typography>

      <Box
         sx={{
         display: "flex", 
         flexDirection: "column", 
         justifyContent: "space-around", 
         gap: 3, 
         width: "100%" 
         }}>

        {ROLES.map(({ key, title, subtitle }) => (
          <Box
          
            key={key}
            onClick={() => handleRoleClick(key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleRoleClick(key)}

            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2.5,
              py: 3,
              borderRadius: "10px",
              cursor: "pointer",
              userSelect: "none",


              backgroundColor:  "#ffffff",
              border:"1.5px solid #D9DCE3",
              transition:
                "background-color 0.18s ease, border-color 0.18s ease",
              "&:hover": {
                backgroundColor: "#0B235E",
                color: "#ffffff",
                borderColor: "transparent" ,

              "& .title": {
                color:"#ffffff"
              },

              "& .subtitle": {
                color:"#ffffff"
              },

              "& .arrow": {
                color:"#ffffff"
              },
            },

              "&:focus-visible": {
                outline: "2px solid #0B235E",
                outlineOffset: "2px",
              },

            }}
          >


            <Box>

              <Typography
              className="title"
                sx={{
                  fontWeight: 600,
                  fontFamily: "Poppins",
                  fontSize: "28px",
                  color: "#0B235E",
                  lineHeight: 1.3,
                  transition: "color 0.18s ease",
                }}
              >
                {title}
              </Typography>

              <Typography
              className="subtitle"
                sx={{
                  fontSize: "14px",
                  color: "#0B235E",
                  mt: 0.25,
                  lineHeight: 1.4,
                  transition: "color 0.18s ease",
                }}
              >
                {subtitle}
              </Typography>
            </Box>

            <ChevronRight
            className="arrow"
              sx={{
                color: "#0B235E",
                fontSize: "22px",
                flexShrink: 0,
                transition: "color 0.18s ease",
                ml: 1,
              }}
            />
            
          </Box>

        ))}
      </Box>
    </Box>
  );
}

export default LandingPage;
