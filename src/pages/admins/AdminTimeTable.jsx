
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Stack,
  Divider,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useState, useMemo, useEffect } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../firebase";


const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

const SUBJECT_COLORS = {
  Mathematics: "#1565C0",
  English: "#2E7D32",
  Biology: "#558B2F",
  Physics: "#6A1B9A",
  Chemistry: "#E65100",
  History: "#4E342E",
  Geography: "#00695C",
};

const colorFor = (subject) => SUBJECT_COLORS[subject] || "#37474F";

// Each slot is a fixed 1-hour block — add an hour to "HH:MM" to get the end time
const addOneHour = (time) => {
  const [h, m] = time.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export default function AdminTimeTable() {
  const [slots, setSlots] = useState([]);
  const [filterDay, setFilterDay] = useState("All");
  const [filterInstructor, setFilterInstructor] = useState("All");
  const [filterRoom, setFilterRoom] = useState("All");


  useEffect(() => {
    const q = query(collection(db, "timetable"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();

        // Guard: Ensure timestamp exists before calling toDate()
        const dateObj = d.classTimestamp?.toDate() || new Date();
        const day = dateObj.toLocaleDateString("en-US", { weekday: "long" });

        // Guard: Ensure timeSlot exists before splitting
        const startTime = d.timeSlot?.split(" ")[0] || "00:00";

        return {
          id: doc.id,
          day: day,
          startTime: startTime,
          endTime: addOneHour(startTime),
          subject: d.title || "No Title",
          instructor: d.staffName || "TBD",
          room: d.room || "N/A",
          classGroup: d.courseId || "N/A"
        };
      });

      setSlots(data);
    });

    return () => unsubscribe();
  }, []);

  // Derive filter options from data
  const instructors = useMemo(() => ["All", ...new Set(slots.map(s => s.instructor))], [slots]);
  const rooms = useMemo(() => ["All", ...new Set(slots.map(s => s.room))], [slots]);
  const days = ["All", ...DAYS];

  const filtered = useMemo(() =>
    slots.filter(s =>
      (filterDay === "All" || s.day === filterDay) &&
      (filterInstructor === "All" || s.instructor === filterInstructor) &&
      (filterRoom === "All" || s.room === filterRoom)
    ),
    [slots, filterDay, filterInstructor, filterRoom]); // Added 'slots' here


  // Build grid: row = time, col = day
  const grid = useMemo(() => {
    const map = {};
    filtered.forEach(slot => {
      const key = `${slot.day}__${slot.startTime}`;
      if (!map[key]) map[key] = [];
      map[key].push(slot);
    });
    return map;
  }, [filtered]);

  const visibleDays = filterDay === "All" ? DAYS : [filterDay];

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh', // Forces the container to be at least the screen height
      display: 'flex',
      flexDirection: 'column', // Stacks items vertically
      // px: 3,
      // py: 3,
      bgcolor: "white",
    }}>
      {/* Header */}
      <Typography variant="h5" fontWeight={700} sx={{
        color: "black",
        fontFamily: "Poppins",
        mb: 0,
        mt: 3, // No margin top
        textAlign: 'left' // Explicitly align left
      }}>
        Master Timetable
      </Typography>
      <Typography variant="body2" mb={3} sx={{ color: "black", fontFamily: "Poppins", textAlign: 'left', mb: 3 }}>
        Full school schedule. Filter by day, instructor, or room.
      </Typography>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
          <FilterListIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" fontWeight={600}>Filters</Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Day</InputLabel>
            <Select value={filterDay} label="Day" onChange={e => setFilterDay(e.target.value)}>
              {days.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Instructor</InputLabel>
            <Select value={filterInstructor} label="Instructor" onChange={e => setFilterInstructor(e.target.value)}>
              {instructors.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Room</InputLabel>
            <Select value={filterRoom} label="Room" onChange={e => setFilterRoom(e.target.value)}>
              {rooms.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>

          {(filterDay !== "All" || filterInstructor !== "All" || filterRoom !== "All") && (
            <Chip
              label="Clear filters"
              size="small"
              onDelete={() => { setFilterDay("All"); setFilterInstructor("All"); setFilterRoom("All"); }}
              sx={{ alignSelf: "center" }}
            />
          )}
        </Stack>
      </Paper>

      {/* Grid */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          // flexGrow: 1, // This is the magic property that forces it to fill remaining space
          overflowY: "auto" // Allows scrolling if the table is actually longer than the screen
        }}
      >
        <Table
          size="small"
          sx={{
            width: '100%',
            // tableLayout: 'fixed' // This forces columns to share the width equally
          }}
        >
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.100" }}>
              <TableCell sx={{ fontWeight: 700, width: 80 }}>Time</TableCell>
              {visibleDays.map(day => (
                <TableCell key={day} align="center" sx={{ fontWeight: 700 }}>{day}</TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {TIME_SLOTS.map((time, ti) => (
              <TableRow
                key={time}
                sx={{ bgcolor: ti % 2 === 0 ? "white" : "grey.50", verticalAlign: "top" }}
              >
                <TableCell sx={{ color: "text.secondary", fontSize: 12, whiteSpace: "nowrap", fontWeight: 600 }}>
                  {time}
                </TableCell>
                {visibleDays.map(day => {
                  const slots = grid[`${day}__${time}`] || [];
                  return (
                    <TableCell key={day} align="center" sx={{ p: 0.5, minWidth: 120 }}>
                      {slots.map(slot => (
                        <Tooltip
                          key={slot.id}
                          title={`${slot.subject} · ${slot.instructor} · ${slot.room} · ${slot.classGroup}`}
                          arrow
                        >
                          <Box
                            sx={{
                              bgcolor: colorFor(slot.subject),
                              color: "white",
                              borderRadius: 1,
                              px: 1,
                              py: 0.5,
                              mb: 0.5,
                              cursor: "default",
                              "&:hover": { opacity: 0.9 },
                            }}
                          >
                            <Typography variant="caption" fontWeight={700} display="block" noWrap>
                              {slot.subject}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ opacity: 0.85 }} noWrap>
                              {slot.instructor}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ opacity: 0.75 }} noWrap>
                              {slot.room}
                            </Typography>
                          </Box>
                        </Tooltip>
                      ))}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Legend */}
      <Box mt={2} bgcolor="white">
        <Typography variant="caption" sx={{ color: "black", fontFamily: "Poppins" }} display="block" mb={1}>Subject legend</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {Object.entries(SUBJECT_COLORS).map(([subj, color]) => (
            <Chip
              key={subj}
              label={subj}
              size="small"
              sx={{ bgcolor: color, color: "white", fontWeight: 600 }}
            />
          ))}
        </Stack>
      </Box>
    </Box >
  );
} 