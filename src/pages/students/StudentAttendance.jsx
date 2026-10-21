import { useState } from "react";
import { Box, Typography } from "@mui/material";
import Date from "../../components/students/studentAttendance/date/Date";
import Attendance from "../../components/students/studentAttendance/Attendance/Attendance";
import RequestLeave from "../../components/students/studentAttendance/RequestLeave/RequestLeave";
import Leave from "../../components/students/studentAttendance/Leave/Leave";
import "../../components/students/studentAttendance/style.css";

const StudentAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Box sx={{ p: 3, flex: 1 }}>
      <Typography className="attendance-title">Attendance</Typography>
      <Box className="split">
        <Box className="left-content">
          <Date selected={selectedDate} onSelect={setSelectedDate} />
          <Attendance date={selectedDate} />
        </Box>

        <Box className="right-content">
          <RequestLeave />
          <Leave />
        </Box>
        
      </Box>
    </Box>
  );
};

export default StudentAttendance;
