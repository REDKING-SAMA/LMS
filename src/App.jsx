import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

// Auth layout pages
import Layout1        from './AuthPages/Layout1'
import Login         from './AuthPages/Login'
import Signup        from './AuthPages/Signup'
import ForgotPwd     from './AuthPages/ForgotPwd'
import VeriCode      from './AuthPages/VeriCode'
import LandingPage   from './AuthPages/LandingPage'
import ResetPwd      from './AuthPages/ResetPwd'

// Dashboard layout + pages — update paths to match your project
import Layout          from './components/Layout'

// Student page
import StudentDashboard from './pages/students/StudentDashboard'
import StudentProfile   from './pages/students/StudentProfile'
import StudentTimetable from './pages/students/StudentTimetable'
import StudentAttendance from './pages/students/StudentAttendance'

// Staff pages
import StaffDashboard   from './pages/staff/StaffDashboard'
import StaffTimetable   from './pages/staff/StaffTimetable'
import StaffProfile     from './pages/staff/Staffprofile'
import Registration     from './pages/RegistrationDashboard'
import AdminDashboard from './pages/admins/AdminDashboard'
import AdminLayout from './components/admins/Layout/Layout'
import AdminTimeTable from './pages/admins/AdminTimeTable'
import AdminEvent from './pages/admins/AdminEvent'
import AdminStudent from './pages/admins/AdminStudent'
import AdminStaff from './pages/admins/AdminStaff'
import AdminAttendance from './pages/admins/AdminAttendance'
import AdminProfile from './pages/admins/AdminProfile'
import AdminLogin from './AuthPages/AdminLogin'
import StaffLogin from './AuthPages/StaffLogin'

// ── Role → route map ──────────────────────────────────────────────────────────
const ROLE_ROUTES = {
  student: '/dashboard/student',
  staff:   '/dashboard/staff',
};

// ── DashboardRedirect ─────────────────────────────────────────────────────────
// Sits at /dashboard. Reads the logged-in user's role from Firestore and
// immediately redirects to the correct dashboard. No role → defaults to student.
function DashboardRedirect() {
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;

    // Not logged in — send back to login
    if (!user) { setDestination('/'); return; }

    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        const { role = 'student' } = snap.exists() ? snap.data() : {};
        const normalisedRole = role.trim().toLowerCase();
        setDestination(ROLE_ROUTES[normalisedRole] ?? ROLE_ROUTES.student);
      })
      .catch(() => setDestination('/'));
  }, []);

  // Show nothing while the Firestore read is in flight
  if (!destination) return null;

  return <Navigate to={destination} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes: Uses Layout1 */}
        <Route path="/" element={<Layout1 />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="forgot-password" element={<ForgotPwd />} />
          <Route path="verification-code" element={<VeriCode />} />
          <Route path="reset-password" element={<ResetPwd />} />
          <Route path="adminLogin" element={<AdminLogin />} />
          <Route path="staffLogin" element={<StaffLogin />} />
        </Route>

        {/* Dispatcher */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Dashboard Routes: Clearly separated */}
        <Route path="/dashboard/student" element={<Layout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="registration" element={<Registration />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="attendance" element={<StudentAttendance />} />
        </Route>

        <Route path="/dashboard/staff" element={<Layout />}>
          <Route index element={<StaffDashboard />} />
          <Route path="timetable" element={<StaffTimetable />} />
          <Route path="profile" element={<StaffProfile />} />
        </Route>

        <Route path="/dashboard/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="timetable" element={<AdminTimeTable />} />
          <Route path="events" element={<AdminEvent />} />
          <Route path="students" element={<AdminStudent />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="profile" element={<AdminProfile />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;