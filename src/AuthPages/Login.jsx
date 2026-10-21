import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Map Firebase error codes → user-friendly messages */
const FIREBASE_ERRORS = {
  "auth/user-not-found":
    "No account found with this email. Please sign up first.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests":
    "Too many failed attempts. Try again later or reset your password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#f5f7fa",
    borderRadius: "8px",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "#0E2C75" },
    "&.Mui-focused fieldset": { borderColor: "#0E2C75", borderWidth: "1.5px" },
  },
};

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  // Clear a single field error as the user corrects it
  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    return e;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setServerError("");
    setLoading(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);

      // Pull the crucial profile fields once so the rest of the student
      // dashboard (sidebar, navbar, etc.) has them without an extra round trip.
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};
      const role = (data.role || "student").trim().toLowerCase();

      // This form is student-only — staff/admin accounts belong on their own
      // login pages, otherwise they'd land on /dashboard/student with a
      // mismatched role and broken sidebar links.
      if (role !== "student") {
        await signOut(auth);
        setServerError("This account isn't a student account. Please use the staff or admin login.");
        return;
      }

      sessionStorage.setItem("uid", user.uid);
      sessionStorage.setItem("fullName", data.fullName || user.displayName || "");
      sessionStorage.setItem("email", user.email || "");
      sessionStorage.setItem("role", role);

      navigate("/dashboard/student", { replace: true });
    } catch (err) {
      setServerError(
        FIREBASE_ERRORS[err.code] ?? "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          display: "flex",
          fontWeight: 600,
          mb: 4,
          fontSize: "48px",
          fontFamily: "Poppins",
          color: "#000000",
        }}
        gutterBottom
      >
        Welcome Back
      </Typography>

      {/* Firebase / server error banner */}
      {serverError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
          {serverError}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: "100%", height: "100%" }}
      >
        <Typography
          sx={{
            mb: 1,
            fontSize: "16px",
            fontWeight: 500,
            color: "#0E2C75",
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          Email
        </Typography>

        <TextField
          fullWidth
          placeholder="Example@email.com"
          variant="outlined"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
            if (serverError) setServerError("");
          }}
          size="small"
          error={!!errors.email}
          helperText={errors.email}
          sx={{ mb: errors.email ? 1 : 3, ...inputSx }}
        />

        <Typography
          sx={{
            mb: 1,
            fontSize: "16px",
            color: "#0E2C75",
            fontWeight: 500,
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          Password
        </Typography>

        <TextField
          fullWidth
          type={showPassword ? "text" : "password"}
          placeholder="at least 8 characters"
          variant="outlined"
          size="small"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError("password");
            if (serverError) setServerError("");
          }}
          error={!!errors.password}
          helperText={errors.password}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            mb: 1,
            ...inputSx,
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 1,
            mb: 3,
          }}
        >
          <Link
            to="/forgot-password"
            style={{
              fontSize: "16px",
              color: "#3f5bd8",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Forgot Password?
          </Link>
        </Box>

        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            py: 1.3,
            borderRadius: "8px",
            textTransform: "none",
            fontFamily: "Poppins",
            fontSize: "20px",
            backgroundColor: "#0B235E",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#2F4B8F",
              boxShadow: "none",
            },
            "&.Mui-disabled": {
              backgroundColor: "#9Ba8C5",
              color: "#fff",
            },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Sign in"}
        </Button>
      </Box>

      <Typography
        sx={{
          mt: 3,
          textAlign: "center",
          fontSize: "18px",
          color: "#777",
        }}
      >
        Don't have an account?{" "}
        <Link
          to="/signup"
          style={{
            fontSize: "18px",
            color: "#3f5bd8",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Sign up
        </Link>
      </Typography>
    </Box>
  );
}

export default Login;
