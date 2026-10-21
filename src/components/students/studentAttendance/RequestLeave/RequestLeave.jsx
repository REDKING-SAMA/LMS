import './requestleave.css'
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../../../firebase';

const RequestLeave = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                setRequests([]);
                setLoading(false);
                return;
            }

            const q = query(collection(db, "leaveRequests"), where("studentId", "==", user.uid));
            const unsubscribeQuery = onSnapshot(q, (snap) => {
                const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
                setRequests(list);
                setLoading(false);
            }, () => setLoading(false));

            return unsubscribeQuery;
        });

        return unsubscribeAuth;
    }, []);

    return (
        <div style={{border: '1px solid #A8B9CA', padding:'16px', borderRadius:'16px', marginBottom:' 30px'}}>
            <h2 className="heading">Requested Leave</h2>
            {loading ? (
                <p>Loading requests…</p>
            ) : requests.length === 0 ? (
                <p>No leave requests submitted yet.</p>
            ) : (
                requests.map((r) => (
                    <div key={r.id} className='main-requestleave-container'>
                        <div className='requestleave-container'>
                            <div>
                                <p>{r.start} – {r.end}</p>
                                <h3>{r.reason}</h3>
                            </div>
                            <span className={r.status === "approved" ? "present" : "absent"}>{r.status}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}

export default RequestLeave;
