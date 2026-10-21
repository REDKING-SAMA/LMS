import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  TextField, Button, Alert, CircularProgress,
  InputAdornment, IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
 
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$&*?%])[A-Za-z\d!@#$&*?%]{8,}$/;
const PASSWORD_HINT =
  "Min 8 chars including uppercase (A-Z), lowercase (a-z), number (0-9) and special character (!@#$&*?%).";
 
const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#f5f7fa",
    borderRadius: "8px",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "#0E2C75" },
    "&.Mui-focused fieldset": { borderColor: "#0E2C75", borderWidth: "1.5px" },
  },
};
 
const labelSx = { mb: 1, fontSize: "16px", fontWeight: 500, color: "#0E2C75" };
 
function ResetPwd() {
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
 
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
 
  // The verified oobCode forwarded from VeriCode via the URL
  const oobCode = searchParams.get("oobCode");
 
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    if (serverError) setServerError("");
  };
 
  const toggleShow = (field) =>
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
 
  const validate = () => {
    const e = {};
    if (!form.password)
      e.password = "Password is required.";
    else if (!PASSWORD_REGEX.test(form.password))
      e.password = PASSWORD_HINT;
    if (!form.confirm)
      e.confirm = "Please confirm your new password.";
    else if (form.password !== form.confirm)
      e.confirm = "Passwords do not match.";
    return e;
  };
 
  const handleSubmit = async (evt) => {
    evt.preventDefault();
 
    if (!oobCode) {
      setServerError("Invalid or missing reset link. Please start the process again.");
      return;
    }
 
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
 
    setErrors({});
    setServerError("");
    setLoading(true);
 
    try {
      // Commits the new password to Firebase Auth using the verified oobCode
      await confirmPasswordReset(auth, oobCode, form.password);
      setSuccess(true);
      // Brief pause so the user reads the success message, then go to Login
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      console.error("[ResetPwd] confirmPasswordReset failed:", err.code, err.message);
      switch (err.code) {
        case "auth/expired-action-code":
          setServerError("This reset link has expired. Please request a new one.");
          break;
        case "auth/invalid-action-code":
          setServerError("Invalid reset link. Please start the process again.");
          break;
        case "auth/weak-password":
          setServerError("Password is too weak. Please choose a stronger one.");
          break;
        default:
          setServerError(`Reset failed (${err.code}). Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };
 
  // ── Guard: no oobCode in URL ──────────────────────────────────────────────
  if (!oobCode) {
    return (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, fontFamily: "Poppins", color: "#000", fontSize: { xs: "28px", md: "36px" } }}>
          Create New Password
        </Typography>
        <Alert severity="error" sx={{ mb: 3, borderRadius: "8px" }}>
          No reset code found. Please start from the Forgot Password page.
        </Alert>
        <Link to="/forgot-password" style={{ color: "#3f5bd8", fontWeight: 500, textDecoration: "none" }}>
          ← Back to Forgot Password
        </Link>
      </Box>
    );
  }
 
  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, fontFamily: "Poppins", color: "#000", fontSize: { xs: "28px", md: "36px" } }}>
          Password Updated!
        </Typography>
        <Alert severity="success" sx={{ borderRadius: "8px" }}>
          Your password has been reset. Redirecting you to login…
        </Alert>
      </Box>
    );
  }
 
  // ── Main form ─────────────────────────────────────────────────────────────
  const eyeAdornment = (field) => ({
    input: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            onClick={() => toggleShow(field)}
            edge="end"
            size="small"
            aria-label={show[field] ? "Hide password" : "Show password"}
          >
            {show[field]
              ? <VisibilityOff fontSize="small" />
              : <Visibility fontSize="small" />}
          </IconButton>
        </InputAdornment>
      ),
    },
  });
 
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{ width: "100%", display: "flex", flexDirection: "column" }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          mb: 2,
          fontFamily: "Poppins",
          color: "#000",
          fontSize: { xs: "28px", md: "36px" },
        }}
      >
        Create New Password
      </Typography>
 
      <Typography sx={{ mb: 3, color: "#666", fontSize: "15px" }}>
        Your new password must be different from your previous password.
      </Typography>
 
      {serverError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
          {serverError}
        </Alert>
      )}
 
      {/* New Password */}
      <Typography sx={labelSx}>New Password</Typography>
      <TextField
        fullWidth size="small"
        type={show.password ? "text" : "password"}
        placeholder="At least 8 characters"
        value={form.password}
        onChange={handleChange("password")}
        error={!!errors.password}
        helperText={errors.password}
        slotProps={eyeAdornment("password")}
        sx={{ mb: errors.password ? 1 : 2, ...inputSx }}
      />
 
      {/* Confirm Password */}
      <Typography sx={labelSx}>Confirm New Password</Typography>
      <TextField
        fullWidth size="small"
        type={show.confirm ? "text" : "password"}
        placeholder="Re-enter your new password"
        value={form.confirm}
        onChange={handleChange("confirm")}
        error={!!errors.confirm}
        helperText={errors.confirm}
        slotProps={eyeAdornment("confirm")}
        sx={{ mb: errors.confirm ? 1 : 3, ...inputSx }}
      />
 
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        sx={{
          py: 1.3,
          borderRadius: "8px",
          textTransform: "none",
          fontFamily: "Poppins",
          fontSize: "18px",
          backgroundColor: "#0B235E",
          boxShadow: "none",
          "&:hover": { backgroundColor: "#2F4B8F", boxShadow: "none" },
          "&.Mui-disabled": { backgroundColor: "#9BA8C5", color: "#fff" },
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
      </Button>
 
      <Typography sx={{ mt: 3, textAlign: "center", fontSize: "15px", color: "#777" }}>
        <Link
          to="/forgot-password"
          style={{ color: "#3f5bd8", textDecoration: "none", fontWeight: 500 }}
        >
          ← Back to Forgot Password
        </Link>
      </Typography>
    </Box>
  );
}
 
export default ResetPwd;
 
















