import { jsPDF } from 'jspdf';

/**
 * Generates and downloads an official course registration slip PDF
 * @param {Object} user - The current logged-in student profile data
 * @param {Array} enrolledCourses - Array of course objects the student has checked
 */
export const generateRegistrationSlip = (user, enrolledCourses) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Document Branding Header
  doc.setFillColor(15, 23, 42); // Deep slate matching your UI dashboard (#0f172a)
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SECURECOURSE UNIVERSITY', 20, 18);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Official Semester Course Registration Slip', 20, 28);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 28);

  // 2. Student Metadata Profile Section
  doc.setTextColor(15, 23, 42);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('STUDENT INFORMATION', 20, 55);
  
  // Horizontal rule line separator
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 58, 190, 58);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Student Name:  ${user.name}`, 20, 66);
  doc.text(`Student ID:        ${user.id}`, 20, 73);
  doc.text(`Status:               Enrolled`, 20, 80);

  // 3. Registered Courses Table Header Layout
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('REGISTERED CURRICULUM COURSES', 20, 95);
  doc.line(20, 98, 190, 98);

  // Table Columns config parameters mapping positioning metrics
  doc.setFontSize(10);
  doc.text('Code', 22, 105);
  doc.text('Course Title', 50, 105);
  doc.text('Lecturer Assigned', 140, 105);
  doc.line(20, 108, 190, 108);

  // 4. Populate Dynamic Selected State Row Lines
  doc.setFont('Helvetica', 'normal');
  let currentYPosition = 116;

  if (enrolledCourses.length === 0) {
    doc.setFont('Helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('No courses selected or registered for this academic term block window.', 22, currentYPosition);
  } else {
    enrolledCourses.forEach((course) => {
      // If table overflows page bounds, push to a new page safely
      if (currentYPosition > 270) {
        doc.addPage();
        currentYPosition = 20;
      }
      
      doc.setFont('Helvetica', 'bold');
      doc.text(course.code || 'N/A', 22, currentYPosition);
      
      doc.setFont('Helvetica', 'normal');
      doc.text(course.title || 'Untitled Course', 50, currentYPosition);
      doc.text(course.lecturer || 'Staff Unassigned', 140, currentYPosition);
      
      currentYPosition += 10; // offset line spacer height
    });
  }

  // 5. Official Verification Bottom Footer Block Section 
  const footerYPosition = 260;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, footerYPosition, 190, footerYPosition);
  
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This document is electronically verified. No manual signature required.', 20, footerYPosition + 6);
  doc.text('SecureCourse Attendance Management System Protocol Verification Node.', 20, footerYPosition + 11);

  // Trigger the browser asset download save command sequence pipeline
  doc.save(`Registration_Slip_${user.id}.pdf`);
};