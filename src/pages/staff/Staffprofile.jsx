import React, { useEffect, useState } from "react";
import {
  Box, Card, Avatar, Typography, Divider, Grid,
  Skeleton, Alert, Chip, Stack,
} from "@mui/material";
import ClassIcon from "@mui/icons-material/Class";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { getStaffCourseSummary } from "../../components/staff/timeTableServices";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

/* ── Initials helper ───────────────────────────────────────
   Strips common titles (Dr./Mr./Mrs.) then takes first+last initials */
function getInitials(fullName = "") {
  const titles = ["dr.", "dr", "mr.", "mr", "mrs.", "mrs", "ms.", "ms", "prof.", "prof"];
  const parts = fullName
    .trim()
    .split(" ")
    .filter(Boolean)
    .filter((p) => !titles.includes(p.toLowerCase()));
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
      <Box sx={{ bgcolor: "#e6f9f3", px: { xs: 2, sm: 3 }, py: 1.2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#0f2942" }}>
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
        <Skeleton width={180} height={28} sx={{ mt: 1.5 }} />
        <Skeleton width={120} height={20} />
        <Skeleton width={200} height={20} />
      </Box>
    </Card>
  );
}

/* ── Main component ─────────────────────────────────────── */
export default function StaffProfile() {
  const auth = getAuth();
  const [staffUid] = useState(() => sessionStorage.getItem("uid"));
  const [courseSummary, setCourseSummary] = useState({ count: 0, codes: [] });
  const [courseLoading, setCourseLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!staffUid) { setLoading(false); return; }

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", staffUid));
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : {};
        setProfile(data);
      } catch (error) {
        if (!cancelled) setError(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    getStaffCourseSummary(staffUid)
      .then(setCourseSummary)
      .catch(() => {}) // course chips are non-critical, fail silently
      .finally(() => setCourseLoading(false));

    return () => { cancelled = true; };
  }, [staffUid]);

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", width: "100%" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f2942", mb: 2.5 }}>
        Profile
      </Typography>

      {loading && <LoadingSkeleton />}
      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error.message}</Alert>}

      {profile && (() => {
        const personal = profile.personal || {};
        const contact = profile.contact || {};

        return (
          <Card elevation={0} sx={{ border: "1px solid #c9ede3", borderRadius: 3, overflow: "hidden" }}>

            {/* ── Banner ── */}
            <Box sx={{
              height: { xs: 100, sm: 140 },
              background: "linear-gradient(135deg, #0f2942 0%, #1a6b5a 40%, #2ecc8f 78%, #a8edcc 100%)",
            }} />

            {/* ── Avatar (initials, no photo upload) ── */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: { xs: "-40px", sm: "-46px" }, position: "relative", zIndex: 2 }}>
              <Avatar
                alt={profile.name}
                sx={{
                  width: { xs: 76, sm: 92 },
                  height: { xs: 76, sm: 92 },
                  border: "4px solid #fff",
                  boxShadow: "0 2px 12px rgba(26,107,90,0.2)",
                  bgcolor: "#1a6b5a",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: { xs: 24, sm: 30 },
                }}
              >
                {getInitials(profile.name)}
              </Avatar>
            </Box>

            {/* ── Identity ── */}
            <Box sx={{ textAlign: "center", px: 2, pt: 1.5, pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f2942" }}>
                {profile.name}
              </Typography>
              {profile.username && (
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                  {profile.username}
                </Typography>
              )}
              {/* Course codes as chips, derived from timetable */}
              {courseSummary.codes.length > 0 && (
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                  {courseSummary.codes.map((code) => (
                    <Chip
                      key={code}
                      icon={<ClassIcon sx={{ fontSize: 14 }} />}
                      label={code}
                      size="small"
                      sx={{
                        bgcolor: "#e6f9f3",
                        color: "#1a6b5a",
                        fontWeight: 600,
                        fontSize: 12,
                        border: "1px solid #b2dfd4",
                        "& .MuiChip-icon": { color: "#1a6b5a" },
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            {/* ── Stats: Courses Taught + Matric Number ── */}
            <Box sx={{
              display: "flex",
              justifyContent: "center",
              gap: { xs: 4, sm: 7 },
              py: { xs: 2, sm: 2.5 },
              px: 2,
              borderTop: "1px solid #e8ecf4",
            }}>
              <Box sx={{ textAlign: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.3 }}>
                  <MenuBookIcon sx={{ fontSize: 18, color: "#1a6b5a" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f2942" }}>
                    {courseSummary.count}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Courses Taught
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f2942" }}>
                    {profile.staffId || "—"}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Staff ID
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* ── Personal ── */}
            <Section title="Personal">
              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                {[
                  ["Gender", profile.gender],
                  ["Surname", personal.surname],
                  ["Other Names", personal.otherNames],
                  ["Country", personal.country],
                  ["Religion", personal.religion],
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
                <Grid item xs={12} sm={6}>
                  <InfoField label="Phone Number" value={profile.phoneNumber || "—"} />
                </Grid>
                {contact.postalAddress && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Postal Address
                      </Typography>
                      {contact.postalAddress.split("\n").map((line, i) => (
                        <Typography key={i} variant="body2" sx={{ fontWeight: 600, color: "#0f2942", lineHeight: 1.7 }}>
                          {line}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
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