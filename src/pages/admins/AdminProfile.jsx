import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import {
  Box, Typography, Avatar, TextField, Button, Card, Snackbar, Alert,
  CircularProgress, IconButton, Tooltip,
} from "@mui/material";
import {
  EditRounded, SaveRounded, CloseRounded, LockRounded, CameraAltRounded, ImageRounded,
} from "@mui/icons-material";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth, db } from "../../firebase";

const B = { navy:"#0f172a", blue:"#3b82f6", muted:"rgba(15,23,42,0.45)", border:"#e2e8f0", bg:"#f8fafc" };
const sx = { "& .MuiOutlinedInput-root":{ borderRadius:"10px", bgcolor:B.bg, fontSize:14, "& fieldset":{ borderColor:B.border }, "&.Mui-focused fieldset":{ borderColor:B.blue } }, "& .MuiInputLabel-root.Mui-focused":{ color:B.blue } };
const initials = (n="") => n.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()||"?";

// Convert a File into a base64 data-url (no Firebase Storage needed)
const toDataUrl = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(file);
});

export default function AdminProfile() {
  // ── Read uid ONCE — not recreated as a new object on every render ──────────
  const uid = sessionStorage.getItem("uid");

  const avatarInput = useRef();
  const bannerInput  = useRef();

  const [profile, setProfile] = useState(null);
  const [edit,    setEdit]    = useState(false);
  const [draft,   setDraft]   = useState({});
  const [pw,      setPw]      = useState({ current:"", next:"" });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [uploading, setUploading] = useState(null); // 'avatar' | 'banner' | null
  const [toast,   setToast]   = useState({ open:false, msg:"", sev:"success" });
  const say = (msg, sev="success") => setToast({ open:true, msg, sev });

  // ── Load from `users/{uid}` ──────────────────────────────────────────────
  // Depends on the primitive `uid` string, not an object — this is the fix
  // for the infinite reload: an inline object literal (`{ uid }`) gets a new
  // reference every render, so React treats it as "changed" every time and
  // re-fires the effect forever.
  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (cancelled) return;
        const data = snap.exists() ? snap.data() : {};
        setProfile(data);
        setDraft(data);
      } catch {
        if (!cancelled) say("Failed to load profile", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [uid]);

  // ── Save text fields ─────────────────────────────────────────────────────
  const save = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        fullname:   draft.fullname,
        phone:      draft.phone,
        department: draft.department,
        updatedAt:  serverTimestamp(),
      });
      setProfile(draft);
      setEdit(false);
      say("Profile saved");
    } catch {
      say("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Avatar / banner upload (memoized — passed to two file inputs) ───────────
  const handleImage = useCallback(async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field === "profile" ? "avatar" : "banner");
    try {
      const url = await toDataUrl(file);
      await updateDoc(doc(db, "users", uid), { [field]: url, updatedAt: serverTimestamp() });
      setProfile((p) => ({ ...p, [field]: url }));
      setDraft((d) => ({ ...d, [field]: url }));
      say(field === "profile" ? "Avatar updated" : "Banner updated");
    } catch {
      say("Image upload failed", "error");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  }, [uid]);

  // ── Password change ──────────────────────────────────────────────────────
  // AdminLogin now signs in through Firebase Auth, so a real auth.currentUser
  // is available here — reauthenticate with the current password, then use
  // Firebase Auth's own password update instead of writing plaintext to Firestore.
  const changePw = async () => {
    if (pw.next.length < 8) return say("Min 8 characters", "error");
    if (!auth.currentUser) return say("Session expired — please log in again", "error");
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, pw.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, pw.next);
      setPw({ current:"", next:"" });
      say("Password updated");
    } catch (err) {
      say(err.code === "auth/wrong-password" || err.code === "auth/invalid-credential" ? "Wrong current password" : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}><CircularProgress sx={{ color:B.blue }} /></Box>;
  }

  // `profile` field holds the avatar image URL, `bannerUrl` holds the banner image URL
  const avatarUrl = profile?.profile || "";
  const bannerUrl = profile?.bannerUrl || "";

  return (
    <Box sx={{ p:{ xs:2, md:3 }, bgcolor:B.bg, minHeight:"100vh" }}>
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}>

        {/* Hero card */}
        <Card elevation={0} sx={{ border:`1px solid ${B.border}`, borderRadius:"18px", overflow:"hidden", mb:2.5 }}>
          {/* Banner */}
          <Box sx={{
            height:90, position:"relative",
            background: bannerUrl ? `url(${bannerUrl}) center/cover` : `linear-gradient(135deg, ${B.navy} 0%, #1a2744 100%)`,
          }}>
            {!bannerUrl && <Box sx={{ position:"absolute", inset:0, opacity:0.07, backgroundImage:"radial-gradient(#fff 1px,transparent 1px)", backgroundSize:"18px 18px" }} />}
            <input ref={bannerInput} type="file" accept="image/*" hidden onChange={(e) => handleImage(e, "bannerUrl")} />
            <Tooltip title="Change banner">
              <IconButton
                onClick={() => bannerInput.current?.click()}
                disabled={uploading === "banner"}
                size="small"
                sx={{ position:"absolute", top:8, right:8, bgcolor:"rgba(15,23,42,0.55)", color:"#fff", "&:hover":{ bgcolor:"rgba(15,23,42,0.75)" } }}
              >
                {uploading === "banner" ? <CircularProgress size={14} sx={{ color:"#fff" }} /> : <ImageRounded sx={{ fontSize:16 }} />}
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ px:3, pb:2.5 }}>
            <Box sx={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", mt:"-36px", mb:1.5, flexWrap:"wrap", gap:1.5 }}>
              {/* Avatar */}
              <Box sx={{ position:"relative" }}>
                <Avatar
                  src={avatarUrl}
                  sx={{ width:72, height:72, bgcolor:B.blue, fontSize:24, fontWeight:700, border:"3px solid #fff", boxShadow:"0 4px 14px rgba(15,23,42,0.15)" }}
                >
                  {initials(profile?.fullname)}
                </Avatar>
                <input ref={avatarInput} type="file" accept="image/*" hidden onChange={(e) => handleImage(e, "profile")} />
                <Tooltip title="Change photo">
                  <IconButton
                    onClick={() => avatarInput.current?.click()}
                    disabled={uploading === "avatar"}
                    size="small"
                    sx={{ position:"absolute", bottom:-2, right:-2, bgcolor:B.blue, color:"#fff", width:26, height:26, border:"2px solid #fff", "&:hover":{ bgcolor:"#1e293b" } }}
                  >
                    {uploading === "avatar" ? <CircularProgress size={12} sx={{ color:"#fff" }} /> : <CameraAltRounded sx={{ fontSize:13 }} />}
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display:"flex", gap:1 }}>
                {edit
                  ? <><Button size="small" onClick={()=>{ setDraft(profile); setEdit(false); }} sx={{ borderRadius:"9px", border:`1px solid ${B.border}`, color:B.muted, textTransform:"none" }} startIcon={<CloseRounded/>}>Cancel</Button>
                       <Button size="small" variant="contained" onClick={save} disabled={saving} startIcon={saving?<CircularProgress size={13} sx={{color:"#fff"}}/>:<SaveRounded/>} sx={{ borderRadius:"9px", bgcolor:B.navy, textTransform:"none", boxShadow:"none","&:hover":{bgcolor:"#1e293b",boxShadow:"none"} }}>Save</Button></>
                  : <Button size="small" onClick={()=>setEdit(true)} startIcon={<EditRounded/>} sx={{ borderRadius:"9px", border:`1px solid ${B.border}`, color:B.navy, textTransform:"none","&:hover":{borderColor:B.blue,color:B.blue} }}>Edit</Button>
                }
              </Box>
            </Box>
            <Typography sx={{ fontSize:20, fontWeight:800, color:B.navy, letterSpacing:"-0.4px" }}>{profile?.fullname || "Admin User"}</Typography>
            <Typography sx={{ fontSize:13, color:B.muted, textTransform:"capitalize" }}>{profile?.department || "—"} · {profile?.email || "—"} · {profile?.role || "user"}</Typography>
          </Box>
        </Card>

        <Box sx={{ display:"grid", gridTemplateColumns:{ xs:"1fr", md:"1fr 1fr" }, gap:2.5 }}>
          {/* Profile fields */}
          <Card elevation={0} sx={{ border:`1px solid ${B.border}`, borderRadius:"16px", p:2.5 }}>
            <Typography sx={{ fontSize:14, fontWeight:700, color:B.navy, mb:2 }}>Personal Information</Typography>
            <Box sx={{ display:"flex", flexDirection:"column", gap:1.75 }}>
              <TextField label="Full Name" size="small" fullWidth sx={sx} value={draft.fullname || ""} disabled={!edit} onChange={e => setDraft(d => ({ ...d, fullname: e.target.value }))} />
              <TextField label="Email" size="small" fullWidth sx={sx} value={profile?.email || ""} disabled InputProps={{ readOnly: true }} helperText="Email cannot be changed here" />
              <TextField label="Phone" size="small" fullWidth sx={sx} value={draft.phone || ""} disabled={!edit} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
              <TextField label="Department" size="small" fullWidth sx={sx} value={draft.department || ""} disabled={!edit} onChange={e => setDraft(d => ({ ...d, department: e.target.value }))} />
            </Box>
          </Card>

          {/* Password */}
          <Card elevation={0} sx={{ border:`1px solid ${B.border}`, borderRadius:"16px", p:2.5 }}>
            <Typography sx={{ fontSize:14, fontWeight:700, color:B.navy, mb:2 }}>Change Password</Typography>
            <Box sx={{ display:"flex", flexDirection:"column", gap:1.75 }}>
              <TextField label="Current Password" type="password" size="small" fullWidth sx={sx} value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))} />
              <TextField label="New Password"     type="password" size="small" fullWidth sx={sx} value={pw.next}    onChange={e=>setPw(p=>({...p,next:e.target.value}))}    />
              <Button variant="contained" fullWidth onClick={changePw} disabled={saving||!pw.current||!pw.next} startIcon={<LockRounded/>}
                sx={{ borderRadius:"10px", bgcolor:B.navy, textTransform:"none", fontWeight:600, boxShadow:"none", mt:0.5,"&:hover":{bgcolor:"#1e293b",boxShadow:"none"} }}>
                Update Password
              </Button>
            </Box>
          </Card>
        </Box>
      </motion.div>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={()=>setToast(t=>({...t,open:false}))} anchorOrigin={{ vertical:"bottom", horizontal:"right" }}>
        <Alert severity={toast.sev} sx={{ borderRadius:"12px" }} onClose={()=>setToast(t=>({...t,open:false}))}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
}