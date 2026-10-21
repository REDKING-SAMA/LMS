import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../../../firebase';
import './attendance.css';

const fmtTime = (ts) =>
    ts?.toDate ? ts.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

const isSameDay = (a, b) => a && b && a.toDateString() === b.toDateString();

const Attendance = ({ date }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const selectedDate = useMemo(() => date || new Date(), [date]);
    const formattedDate = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setRecords([]);
                setLoading(false);
                return;
            }

            const q = query(collection(db, "attendance"), where("studentId", "==", user.uid));
            const unsubscribeQuery = onSnapshot(q, (snap) => {
                const list = snap.docs
                    .map((d) => ({ id: d.id, ...d.data() }))
                    .filter((r) => isSameDay(r.dateString?.toDate?.(), selectedDate));
                list.sort((a, b) => (b.dateString?.toMillis?.() || 0) - (a.dateString?.toMillis?.() || 0));
                setRecords(list);
                setLoading(false);
            }, () => setLoading(false));

            return unsubscribeQuery;
        });

        return unsubscribeAuth;
    }, [selectedDate]);

    return (
        <div style={{marginBottom:"30px"}}>
            <h2 className="heading-date">{formattedDate}</h2>
            {loading ? (
                <p>Loading attendance…</p>
            ) : records.length === 0 ? (
                <p>No attendance records yet.</p>
            ) : (
                records.map((r) => (
                    <div key={r.id} className='main-attendance-container'>
                        <div className='attendance-container'>
                            <div>
                                <p>{r.courseCode || ""}</p>
                                <h3>{r.courseName || "Class"}</h3>
                            </div>
                            <span className={r.status?.toLowerCase() === "present" ? "present" : "absent"}>{r.status}</span>
                        </div>
                        <div className='attendance-container-space'>
                            <p>check in Time</p>
                            <h3>{fmtTime(r.dateString)}</h3>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}

export default Attendance;
