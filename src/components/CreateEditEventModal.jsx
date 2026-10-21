import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, FormControl, InputLabel, Select, MenuItem, Stack,
  Typography, Chip, Box, Divider, IconButton, Paper, Grid
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

const CATEGORY_OPTIONS = ["Academic", "Administrative", "Social", "General"];
const AUDIENCE_OPTIONS = [
  { value: "all", label: "Everyone", description: "Visible to all" },
  { value: "students", label: "Students", description: "Only visible to students" },
  { value: "parents", label: "Parents", description: "Only visible to parents" },
  { value: "staff", label: "Staff", description: "Only visible to teachers/admin" },
];

const AUDIENCE_COLOR = { all: "primary", students: "info", parents: "success", staff: "warning" };

const toDatetimeLocal = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY_FORM = { title: "", date: "", description: "", targetAudience: "all", category: "General", location: "" };

export default function CreateEditEventModal({ open, event, onClose, onSave }) {
  const isEdit = Boolean(event);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || "",
        date: toDatetimeLocal(event.date instanceof Date ? event.date : event.date?.toDate?.()),
        description: event.description || "",
        targetAudience: event.targetAudience || "all",
        category: event.category || "General",
        location: event.location || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [event, open]);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Required";
    if (!form.date) errs.date = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{color:"black"}}>{isEdit ? "Edit Event" : "Create New Event"}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <Divider />
      
      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          <TextField label="Event Title" fullWidth value={form.title} onChange={set("title")} error={!!errors.title} />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField type="datetime-local" fullWidth value={form.date} onChange={set("date")} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={set("category")}>
                  {CATEGORY_OPTIONS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField label="Location" fullWidth value={form.location} onChange={set("location")} placeholder="e.g. Main Auditorium" />
          <TextField label="Description" fullWidth multiline rows={3} value={form.description} onChange={set("description")} />

          <FormControl fullWidth>
            <InputLabel>Target Audience</InputLabel>
            <Select value={form.targetAudience} label="Target Audience" onChange={set("targetAudience")}>
              {AUDIENCE_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Chip label={opt.label} size="small" color={AUDIENCE_COLOR[opt.value]} variant="outlined" />
                    <Typography variant="body2">{opt.description}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={() => validate() && onSave(form)} variant="contained" startIcon={<SaveIcon />}>
          {isEdit ? "Save Changes" : "Create Event"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}