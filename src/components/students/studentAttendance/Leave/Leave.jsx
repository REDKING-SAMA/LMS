import { useState } from "react";
import { auth, db } from "../../../../firebase";
import "./leave.css";
import { addDoc, collection } from "firebase/firestore";
import { Alert } from "@mui/material";
const Leave = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);


  async function handleSubmit(e) {
    e.preventDefault();
    try {
        setIsLoading(true)  
        if(startDate === "" || endDate === "" || reason === "")     
            setShowAlert(true)   
        else{
            const leave = {
              studentId: auth.currentUser?.uid || null,
              start: startDate,
              end: endDate,
              reason: reason,
              status: "pending",
              createdAt: new Date(),
            };

            // Save data in a collection
            await addDoc(collection(db, "leaveRequests"), leave);

            setShowSuccessAlert(true)
            setStartDate("")
            setEndDate("")
            setReason("")
        }

    } catch (error) {
      console.error(error);
      setShowErrorAlert(true)
    }finally{
        setIsLoading(false)
        setTimeout(()=>{
            setShowAlert(false)
            setShowSuccessAlert(false)
            setShowErrorAlert(false)
        }, 3000)
    }
  }
  return (
    <div className="container">
        {showAlert && <Alert severity="warning">All Field are required</Alert>}
        {showSuccessAlert && <Alert severity="success">Submitted Successfully</Alert>}
        {showErrorAlert && <Alert severity="error">Failed to submit leave request. Please try again.</Alert>}
      <h2 className="heading">Apply Leave</h2>
      <form onSubmit={handleSubmit} action="" className="leave-form">
        <label htmlFor="">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label htmlFor="">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <label htmlFor="">Reason for Leave</label>
        <textarea
          name=""
          id=""
          rows="5"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        ></textarea>
        {isLoading ? <button>Submitting....</button>:<button>Submit</button>}
      </form>
    </div>
  );
};

export default Leave;
