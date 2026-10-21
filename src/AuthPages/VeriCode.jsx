import React from 'react'
import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { verifyPasswordResetCode, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#f5f7fa",
    borderRadius: "8px",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "#0E2C75" },
    "&.Mui-focused fieldset": { borderColor: "#0E2C75", borderWidth: "1.5px" },
  },
};

const FIREBASE_ERRORS = {
  "auth/expired-action-code":
    "This code has expired. Please request a new one.",
  "auth/invalid-action-code":
    "Invalid code. Double-check you copied it correctly.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
  "auth/user-not-found": "No account is associated with this code.",
};

function VeriCode() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resentMsg, setResentMsg] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [autoVerifying, setAutoVerifying] = useState(false);

  
  
  const email = searchParams.get("email") ?? "";


  
  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    if (!oobCode) return;
 
    setAutoVerifying(true);
    verifyPasswordResetCode(auth, oobCode.trim())
      .then(() => {
        navigate(`/reset-password?oobCode=${encodeURIComponent(oobCode.trim())}`, {
          replace: true,
        });
      })
      .catch((err) => {
        setError(
          FIREBASE_ERRORS[err.code] ??
            "The reset link is invalid or has expired. Please request a new one."
        );
        setAutoVerifying(false);
      });
  }, [searchParams, navigate]);
 
  // Manual submit — fallback if the user somehow has the raw oobCode
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Confirms the code is valid; throws if expired or already used
      await verifyPasswordResetCode(auth, code.trim());
      // Pass the verified code to the next step so it can call
      // confirmPasswordReset(auth, code, newPassword)
      navigate(`/reset-password?oobCode=${encodeURIComponent(code.trim())}`);
    } catch (err) {
      console.error("[VeriCode] verifyPasswordResetCode failed:", err.code, err.message);
      setError(
        FIREBASE_ERRORS[err.code] ?? "Verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Email not found — please go back and enter your email again.");
      return;
    }
    setError("");
    setResentMsg("");
    setResending(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/verification-code`,
        handleCodeInApp: true,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setResentMsg("A new code has been sent. Check your inbox and spam folder.");
    } catch (err) {
      // Same anti-enumeration behavior as ForgotPwd.jsx — don't reveal
      // whether the email exists, just report success either way.
      if (err.code === "auth/user-not-found") {
        setResentMsg("A new code has been sent. Check your inbox and spam folder.");
      } else {
        setError("Failed to resend. Please try again.");
      }
    } finally {
      setResending(false);
    }
  };


   if (autoVerifying) {
    return (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", pt: 6 }}>
        <CircularProgress sx={{ color: "#0B235E", mb: 3 }} />
        <Typography sx={{ color: "#666", fontSize: "15px" }}>
          Verifying your reset link…
        </Typography>
      </Box>
    );
  }



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
        Verification Code
      </Typography>

      <Typography sx={{ mb: 3, color: "#666", fontSize: "15px" }}>
        We have sent a password reset link to your email. Open it on this device to
        continue automatically, or paste the reset code from the link below.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
          {error}
        </Alert>
      )}

      {resentMsg && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: "8px" }}>
          {resentMsg}
        </Alert>
      )}

      <Typography
        sx={{ mb: 1, fontSize: "18px", fontWeight: 500, color: "#0E2C75" }}
      >
        Reset Code
      </Typography>

      <TextField
        fullWidth
        placeholder="Paste the code from your reset link"
        variant="outlined"
        size="small"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          if (error) setError("");
        }}
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
          fontFamily: "Poppins",
          fontSize: "18px",
          backgroundColor: "#0B235E",
          boxShadow: "none",
          "&:hover": { backgroundColor: "#2F4B8F", boxShadow: "none" },
          "&.Mui-disabled": { backgroundColor: "#9BA8C5", color: "#fff" },
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Verify"}
      </Button>

      <Typography
        sx={{ mt: 3, textAlign: "center", fontSize: "15px", color: "#777" }}
      >
        Didn't receive a code?{" "}
        <Box
          component="span"
          onClick={!resending ? handleResend : undefined}
          sx={{
            color: "#3f5bd8",
            fontWeight: 500,
            cursor: resending ? "default" : "pointer",
            opacity: resending ? 0.6 : 1,
            "&:hover": { textDecoration: !resending ? "underline" : "none" },
          }}
        >
          {resending ? "Sending…" : "Resend"}
        </Box>
      </Typography>

      <Typography
        sx={{ mt: 2, textAlign: "center", fontSize: "15px", color: "#777" }}
      >
        <Link
          to="/forgot-password"
          style={{ color: "#3f5bd8", textDecoration: "none", fontWeight: 500 }}
        >
          ← Back
        </Link>
      </Typography>
    </Box>
  );
}

export default VeriCode