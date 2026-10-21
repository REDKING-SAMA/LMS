import React, { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Stack, Chip, IconButton, Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";

import { db } from "../../firebase";
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import CreateEditEventModal from "../../components/CreateEditEventModal";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const CATEGORY_COLOR = { Academic: "primary", Administrative: "info", Social: "success", General: "warning" };

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
function EventCard({ event, onEdit, onDelete }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 1, "&:hover": { boxShadow: 2 }, transition: "box-shadow 0.2s" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1} mr={1}>
          <Stack direction="row" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
            <Typography variant="subtitle2" fontWeight={700}>{event.title}</Typography>
            <Chip label={event.category} size="small" color={CATEGORY_COLOR[event.category] || "default"} variant="outlined" />
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block">{event.date.toLocaleDateString()}</Typography>
          <Typography variant="body2" color="text.secondary">{event.description}</Typography>
          <Typography variant="caption" fontWeight={600} color="primary">📍 {event.location}</Typography>
        </Box>
        <Stack direction="row">
          <IconButton size="small" onClick={() => onEdit(event)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(event.id)}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
}



// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function EventCalendar() {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "events"));
    return onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date?.toDate() || new Date() })));
    });
  }, []);

  const handleSave = async (data) => {
    // Convert the string from the modal (datetime-local) into a JS Date object
    const eventPayload = {
      ...data,
      date: new Date(data.date)
    };

    if (data.id) {
      await updateDoc(doc(db, "events", data.id), eventPayload);
    } else {
      await addDoc(collection(db, "events"), eventPayload);
    }
    setModalOpen(false);
  };

  return (
    <Box sx={{ p: 3, minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "white" }}>

      {/* Header Section with forced layout */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        display="flex"
        sx={{ width: '100%', mb: 3 }}
      >
        {/* LEFT: Title and Toggle Group */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start', // This keeps both at the top
          width: '100%',
          mb: 3
        }}>

          {/* Left Side: Text stays at the top-left */}
          <Stack spacing={0.5}>
            <Typography variant="h5" fontWeight={700} sx={{ color: "black", fontFamily: "Poppins" }}>
              Event Calendar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Managing school events
            </Typography>
          </Stack>

          {/* Right Side: Button stays at the top-right */}
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            sx={{fontFamily: "Poppins"}}
          >
            Add Event
          </Button>
        </Box>
      </Stack>

      {/* Content Section */}
      <Box sx={{ flexGrow: 1 }}>
        <Stack gap={1} sx={{ bgcolor: "grey.100" }}>
          {[...events]
            .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
            .map(ev => (
              <EventCard
                key={ev.id}
                event={ev}
                onEdit={(e) => { setEditTarget(e); setModalOpen(true); }}
                onDelete={(id) => deleteDoc(doc(db, "events", id))}
              />
            ))
          }
        </Stack>
      </Box>

      <CreateEditEventModal open={modalOpen} event={editTarget} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </Box>
  );
}