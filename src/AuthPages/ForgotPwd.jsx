import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPwd() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#f5f7fa",
      borderRadius: "8px",
      "& fieldset": { borderColor: "transparent" },
      "&:hover fieldset": { borderColor: "#0E2C75" },
      "&.Mui-focused fieldset": {
        borderColor: "#0E2C75",
        borderWidth: "1.5px",
      },
    },
  };


  const actionCodeSettings = {
  url: `${window.location.origin}/verification-code`,
  handleCodeInApp: true,
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
      // Pass email so VeriCode can resend if needed
      navigate(`/verification-code?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          // Don't reveal whether the email exists — send to verify anyway
          navigate(`/verification-code?email=${encodeURIComponent(email.trim())}`);
          break;
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/too-many-requests":
          setError("Too many requests. Please wait a moment and try again.");
          break;
        default:
          setError("Unable to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",

      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: 600,
          mb: 2,
        }}
      >
        Forgot Password
      </Typography>

      <Typography
        sx={{
          mb: 3,
          color: "#666",
          fontSize: "15px",
        }}
      >
        Enter the email associated with your account.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography
        sx={{
          mb: 1,
          fontSize: "16px",
          fontWeight: 500,
          color: "#0E2C75",
        }}
      >
        Email
      </Typography>

      <TextField
        fullWidth
        placeholder="example@email.com"
        variant="outlined"
        size="small"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 3, ...inputSx }}
      />

      <Button
        fullWidth
        variant="contained"
        type="submit"
        disabled={loading}
        sx={{
          py: 1.3,
          borderRadius: "8px",
          textTransform: "none",
          fontSize: "18px",
          backgroundColor: "#0B235E",
          "&:hover": {
            backgroundColor: "#2F4B8F",
          },
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Continue"
        )}
      </Button>

      <Typography
        sx={{
          mt: 3,
          textAlign: "center",
        }}
      >
        Remember your password?{" "}
        <Link
          to="/login"
          style={{
            color: "#3f5bd8",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Back to Login
        </Link>
      </Typography>
    </Box>
  );
}

export default ForgotPwd;