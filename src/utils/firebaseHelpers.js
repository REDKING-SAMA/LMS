import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

/**
 * Dynamically updates a student's registration status for a course
 * @param {string} courseId - The ID of the course doc in Firestore
 * @param {string} studentId - The logged-in student's UID
 * @param {boolean} isRegistering - True if checking the box, false if unchecking
 */
export const toggleCourseRegistration = async (courseId, studentId, isRegistering) => {
  // Courses are read from `availableCourses` (see RegistrationDashboard), and the
  // student's selection is read back from `users/{studentId}.selectedCourses` —
  // so that's the field this needs to update for the checkbox state to persist.
  const userRef = doc(db, 'users', studentId);

  try {
    await updateDoc(userRef, {
      // arrayUnion adds the ID if it doesn't exist; arrayRemove deletes it
      selectedCourses: isRegistering ? arrayUnion(courseId) : arrayRemove(courseId)
    });
  } catch (error) {
    console.error("Error updating registration:", error);
  }
};