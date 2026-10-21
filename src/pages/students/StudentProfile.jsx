import React, { useEffect, useState } from "react";
import {
  Box, Card, Avatar, Typography, Divider, Grid,
  Skeleton, Alert,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BadgeIcon from "@mui/icons-material/Badge";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebase";

/* ── Initials helper ───────────────────────────────────────
   Takes a full name like "Kelvin Yeboah" and returns "KY"
   (first letter of first name + first letter of last name) */
function getInitials(fullName = "") {
  const parts = fullName.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Reusable field ─────────────────────────────────────── */
function InfoField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: "#1b2559", mt: 0.3, wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Box>
  );
}

/* ── Section wrapper ────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <Box>
      <Box sx={{ bgcolor: "#eef0f7", px: { xs: 2, sm: 3 }, py: 1.2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1b2559" }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 } }}>
        {children}
      </Box>
    </Box>
  );
}

/* ── Loading skeleton ───────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e8ecf4", borderRadius: 3, overflow: "hidden" }}>
      <Skeleton variant="rectangular" height={140} />
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: "-46px", pb: 2 }}>
        <Skeleton variant="circular" width={92} height={92} />
        <Skeleton width={160} height={28} sx={{ mt: 1.5 }} />
        <Skeleton width={110} height={20} />
        <Skeleton width={140} height={20} />
      </Box>
    </Card>
  );
}

/* ── Main component ─────────────────────────────────────── */
function ProfilePage({ profile, loading, error }) {

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", width: "100%" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: "#1b2559", mb: 2.5 }}>
        Profile
      </Typography>

      {loading && <LoadingSkeleton />}
      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

      {profile && (() => {
        // personal/contact are additive fields layered on top of the shared Users schema
        const personal = profile.personal || {};
        const contact = profile.contact || {};

        return (
          <Card elevation={0} sx={{ border: "1px solid #e8ecf4", borderRadius: 3, overflow: "hidden" }}>

            {/* ── Banner ── */}
            <Box sx={{
              height: { xs: 100, sm: 140 },
              background: "linear-gradient(135deg, #1b1464 0%, #6a0dad 40%, #e91e8c 75%, #ff6b6b 100%)",
            }} />

            {/* ── Avatar (initials, no photo upload) ── */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: { xs: "-40px", sm: "-46px" }, position: "relative", zIndex: 2 }}>
              <Avatar
                alt={profile.name}
                sx={{
                  width: { xs: 76, sm: 92 },
                  height: { xs: 76, sm: 92 },
                  border: "4px solid #fff",
                  boxShadow: "0 2px 12px rgba(79,125,255,0.18)",
                  bgcolor: "#4f7dff",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: { xs: 24, sm: 30 },
                }}
              >
                {getInitials(profile.name)}
              </Avatar>
            </Box>

            {/* ── Identity ── */}
            <Box sx={{ textAlign: "center", px: 2, pt: 1.5, pb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1b2559" }}>
                {profile.name}
              </Typography>
              {profile.username && (
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                  {profile.username}
                </Typography>
              )}
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1b2559" }}>
                {profile.department}
              </Typography>
            </Box>

            {/* ── Stats: Attendance Rate + Matric Number ── */}
            <Box sx={{
              display: "flex",
              justifyContent: "center",
              gap: { xs: 4, sm: 7 },
              py: { xs: 2, sm: 2.5 },
              px: 2,
            }}>
              <Box sx={{ textAlign: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.3 }}>
                  <TrendingUpIcon sx={{ fontSize: 18, color: "#4f7dff" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1b2559" }}>
                    {profile.attendanceRate != null ? `${profile.attendanceRate}%` : "—"}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Attendance Rate
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.3 }}>
                  <BadgeIcon sx={{ fontSize: 18, color: "#4f7dff" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1b2559" }}>
                    {profile.matricNumber}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Matric Number
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* ── Personal ── */}
            <Section title="Personal">
              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                {[
                  ["Surname", personal.surname],
                  ["Gender", profile.gender],
                  ["Country", personal.country],
                  ["Religion", personal.religion],
                  ["Other Names", personal.otherNames],
                  ["Date of Birth", personal.dateOfBirth],
                  ["Region", personal.region],
                ].map(([label, value]) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <InfoField label={label} value={value || "—"} />
                  </Grid>
                ))}
              </Grid>
            </Section>

            <Divider />

            {/* ── Contact ── */}
            <Section title="Contact">
              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                <Grid item xs={12} sm={6}>
                  <InfoField label="Email" value={profile.email} />
                </Grid>
                {contact.postalAddress && (
                  <Grid item xs={12} sm={6} sx={{ gridRow: { sm: "span 2" } }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Postal Address
                      </Typography>
                      {contact.postalAddress.split("\n").map((line, i) => (
                        <Typography key={i} variant="body2" sx={{ fontWeight: 600, color: "#1b2559", lineHeight: 1.7 }}>
                          {line}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <InfoField label="Mobile Number" value={profile.phoneNumber || "—"} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoField label="Alternate Mobile Number" value={contact.alternateMobile || "—"} />
                </Grid>
              </Grid>
            </Section>

          </Card>
        );
      })()}
    </Box>
  );
}

/* ── Container: loads the logged-in student's own `users/{uid}` doc ── */
export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const unsubscribeDoc = onSnapshot(
        doc(db, "users", user.uid),
        (snap) => {
          const data = snap.exists() ? snap.data() : {};
          setProfile({
            name: data.fullName || user.displayName || "",
            department: data.department || "",
            attendanceRate: data.attendance ?? null,
            matricNumber: data.matricNumber || "",
            gender: data.gender || "",
            email: data.email || user.email || "",
            phoneNumber: data.phone || "",
            personal: {
              surname: data.surname,
              country: data.nationality,
              religion: data.religion,
              otherNames: data.otherNames,
              dateOfBirth: data.dob,
              region: data.region,
            },
            contact: {
              postalAddress: data.postalAddress,
              alternateMobile: data.alternateMobile,
            },
          });
          setLoading(false);
        },
        () => {
          setError("Failed to load profile.");
          setLoading(false);
        }
      );

      return unsubscribeDoc;
    });

    return unsubscribeAuth;
  }, []);

  return <ProfilePage profile={profile} loading={loading} error={error} />;
}