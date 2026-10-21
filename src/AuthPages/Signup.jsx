import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Country, State } from "country-state-city";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$&*?%])[A-Za-z\d!@#$&*?%]{8,}$/;

//  * Password must be ≥ 8 characters and contain:
//  *   • at least one uppercase letter   (A-Z)
//  *   • at least one lowercase letter   (a-z)
//  *   • at least one digit              (0-9)
//  *    • at least one special character  (!@#$&*?%)
const PASSWORD_HINT =
  "Min 8 chars including uppercase (A-Z), lowercase (a-z), number (0–9) and special character (!@#$&*?%).";

/** Map Firebase error codes → user-friendly messages */
const FIREBASE_ERRORS = {
  "auth/email-already-in-use":
    "An account with this email already exists. Please log in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password does not meet security requirements.",
  "auth/operation-not-allowed":
    "Email/password sign-up is disabled. Contact support.",
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

function Signup() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dob: "",
    religion: "",
    number: "",
    nationality: "",
    region: "",
  });

  const [show, setShow] = useState({ password: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    if (serverError) setServerError("");
  };

   // ── Phone number now only ever holds DIGITS (no dial code, no symbols) ──
  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setForm((prev) => ({ ...prev, number: digitsOnly }));
    setErrors((prev) => ({ ...prev, number: "" }));
    if (serverError) setServerError("");
  };
 
  // When the country changes, the dial code changes too — clear any
  // previously typed digits so the user doesn't end up with a mismatched number.
  const handleNationalityChange = (e) => {
    setForm((prev) => ({ ...prev, nationality: e.target.value, region: "", number: "" }));
    setErrors((prev) => ({ ...prev, nationality: "", region: "", number: "" }));
    if (serverError) setServerError("");
  };

  const toggleShow = (field) =>
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const selectedCountry = Country.getAllCountries().find(
    (country) => country.name === form.nationality,
  );

  const states = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.isoCode)
    : [];

     // ── Dial code derived from the selected country ──────────────────────────
  const dialCode = selectedCountry?.phonecode
    ? `+${selectedCountry.phonecode}`
    : null;

  const validate = () => {
    const e = {};

    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    else if (form.fullName.trim().length < 2)
      e.fullName = "Please enter your full name.";

    if (!form.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_REGEX.test(form.email))
      e.email = "Enter a valid email address.";

    if (!form.password) e.password = "Password is required.";
    else if (!PASSWORD_REGEX.test(form.password)) e.password = PASSWORD_HINT;

    if (!form.confirmPassword)
      e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";

    if (!form.gender) e.gender = "Gender is required.";
    if (!form.dob) e.dob = "Date of birth is required.";
    if (!form.religion) e.religion = "Religion is required.";
    if (!form.nationality) e.nationality = "Nationality is required.";
    if (!form.region) e.region = "Region is required.";

    // ── Phone validation depends on nationality being chosen first ─────────
    if (!form.nationality) {
      e.number = "Select your nationality first.";
    } else if (!form.number) {
      e.number = "Phone number is required.";
    } else if (form.number.length < 6 || form.number.length > 12) {
      e.number = "Enter a valid phone number.";
    }

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
      // 1. Create the Firebase Auth users
      const { user } = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password,
      );

      // 2. Attach display name to the Auth profile
      await updateProfile(user, { displayName: form.fullName.trim() });
       // ── Full E.164-style number saved to Firestore: dial code + digits ──
      const fullPhoneNumber = `${dialCode}${form.number.trim()}`;

      // 3. Store the full profile in Firestore so it can be read later
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        gender: form.gender,
        dob: form.dob,
        religion: form.religion,
        phone: fullPhoneNumber,
        nationality: form.nationality,
        region: form.region,
        createdAt: serverTimestamp(),
      });

      navigate("/login");
    } catch (err) {
      setServerError(
        FIREBASE_ERRORS[err.code] ?? "Sign up failed. Please try again.",
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
        width: "100%",
        height: "100%",
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          display: "flex",
          fontWeight: 600,
          mb: 3,
          fontSize: "32px",
          fontFamily: "Poppins",
          color: "#000000",
        }}
        gutterBottom
      >
        Welcome to SecureCourse!
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
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
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
          Full Name
        </Typography>

        <TextField
          fullWidth
          placeholder="Kelvin Yeboah"
          variant="outlined"
          size="small"
          value={form.fullName}
          onChange={handleChange("fullName")}
          error={!!errors.fullName}
          helperText={errors.fullName}
          sx={{ mb: errors.fullName ? 1 : 2, ...inputSx }}
        />

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
          Gender
        </Typography>

        <TextField
          select
          fullWidth
          label="Select Gender"
          variant="outlined"
          size="small"
          value={form.gender}
          onChange={handleChange("gender")}
          error={!!errors.gender}
          helperText={errors.gender}
          sx={{ mb: errors.gender ? 1 : 2, ...inputSx }}
        >
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
        </TextField>

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
          Date of Birth
        </Typography>

        <TextField
          type="date"
          fullWidth
          // label="Date of Birth"
          variant="outlined"
          size="small"
          value={form.dob}
          onChange={handleChange("dob")}
          error={!!errors.dob}
          helperText={errors.dob}
          sx={{ mb: errors.dob ? 1 : 2, ...inputSx }}
        />

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
          Religion
        </Typography>

        <TextField
          fullWidth
          placeholder="Islam"
          variant="outlined"
          size="small"
          value={form.religion}
          onChange={handleChange("religion")}
          error={!!errors.religion}
          helperText={errors.religion}
          sx={{ mb: errors.religion ? 1 : 2, ...inputSx }}
        />

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
          size="small"
          value={form.email}
          onChange={handleChange("email")}
          error={!!errors.email}
          helperText={errors.email}
          sx={{ mb: errors.email ? 1 : 2, ...inputSx }}
        />

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
          Nationality
        </Typography>

        <TextField
          select
          fullWidth
          label="select Nationality"
          variant="outlined"
          size="small"
          value={form.nationality}
          onChange={handleNationalityChange}
          error={!!errors.nationality}
          helperText={errors.nationality}
          sx={{ mb: errors.nationality ? 1 : 2, ...inputSx }}
        >
          <MenuItem value="">Select Nationality</MenuItem>

          {Country.getAllCountries().map((country) => (
            <MenuItem key={country.isoCode} value={country.name}>
              {country.name} ({country.phonecode ? `+${country.phonecode}` : "—"})
            </MenuItem>
          ))}
        </TextField>

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
          Region
        </Typography>

        <TextField
          select
          fullWidth
          label="select Region"
          variant="outlined"
          size="small"
          value={form.region}
          onChange={handleChange("region")}
          error={!!errors.region}
          helperText={errors.region}
          sx={{ mb: errors.region ? 1 : 2, ...inputSx }}
        >
          <MenuItem value="">Select Region</MenuItem>

          {states.map((state) => (
            <MenuItem key={state.isoCode} value={state.name}>
              {state.name}
            </MenuItem>
          ))}
        </TextField>

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
          Phone Number
        </Typography>

        <TextField
          fullWidth
          type="tel"
          inputMode="numeric"
          placeholder={form.nationality ? "812 345 6789" : "Select nationality first"}
          variant="outlined"
          size="small"
          value={form.number}
          onChange={handlePhoneChange}
          error={!!errors.number}
          helperText={
            errors.number ??
            (form.nationality
              ? "Enter your phone number."
              : "")
          }
          disabled={!form.nationality}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ fontSize: "14px", color: form.nationality ? "#0E2C75" : "#aaa", fontWeight: 500 }}>
                    {dialCode ?? "+__"}
                  </Typography>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: errors.number ? 1 : 2, ...inputSx }}
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
          variant="outlined"
          size="small"
          type={show.password ? "text" : "password"}
          placeholder="At least 8 characters"
          value={form.password}
          onChange={handleChange("password")}
          error={!!errors.password}
          helperText={errors.password}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => toggleShow("password")}
                    edge="end"
                    size="small"
                  >
                    {show.password ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: errors.password ? 1 : 2, ...inputSx }}
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
          Confirm Password
        </Typography>

        <TextField
          fullWidth
          size="small"
          type={show.confirm ? "text" : "password"}
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => toggleShow("confirm")}
                    edge="end"
                    size="small"
                  >
                    {show.confirm ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: errors.confirmPassword ? 1 : 2, ...inputSx }}
        />

        <Button
          fullWidth
          variant="contained"
          type="submit"
          disabled={loading}
          sx={{
            mt: 2,
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
            "&.Mui-disabled": { backgroundColor: "#9BA8C5", color: "#fff" },
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Create an Account"}
        </Button>

        <Typography
          sx={{
            mt: 1,
            display: "flex",
            textAlign: "flex-start",
            fontSize: "18px",
            color: "#777",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/"
            style={{
              fontSize: "18px",
              color: "#3f5bd8",
              fontWeight: 500,
              textDecoration: "None",
            }}
          >
            Login
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}

export default Signup;
