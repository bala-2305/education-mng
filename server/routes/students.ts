import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { Student } from '../models/Student';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Upload Excel (Staff Only)
router.post('/upload', authenticate, authorize(['Staff', 'HOD']), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    // Process and validate data
    const studentsToSave = [];
    for (const row of data) {
      // Find standard keys case-insensitively
      const rollNoKey = Object.keys(row).find(k => k.toLowerCase().replace(/\s/g, '') === 'rollno' || k.toLowerCase() === 'id');
      const rollNo = rollNoKey ? row[rollNoKey] : `TEMP-${Math.random().toString(36).substr(2, 9)}`;
      
      const nameKey = Object.keys(row).find(k => k.toLowerCase() === 'name' || k.toLowerCase() === 'studentname');
      const name = nameKey ? row[nameKey] : 'Unknown';

      const departmentKey = Object.keys(row).find(k => k.toLowerCase() === 'department');
      const department = departmentKey ? row[departmentKey] : (req.user?.department || 'CSE');

      const yearKey = Object.keys(row).find(k => k.toLowerCase() === 'year' || k.toLowerCase() === 'batch');
      const year = yearKey ? row[yearKey] : '2025';

      const sectionKey = Object.keys(row).find(k => k.toLowerCase() === 'section');
      const section = sectionKey ? row[sectionKey] : 'A';

      studentsToSave.push({
        ...row, // Spread all the excel columns directly to create dynamic schema
        rollNo: String(rollNo),
        name: String(name),
        department: String(department),
        year: String(year),
        section: String(section)
      });
    }

    // Staff class validation
    if (req.user?.role === 'Staff') {
      const assignedClasses = req.user.assignedClasses || [];
      const isAuthorized = studentsToSave.every(student => 
        assignedClasses.some((cls: any) => cls.year === student.year && cls.section === student.section)
      );

      if (!isAuthorized) {
        res.status(403).json({ message: 'You can only upload records for your assigned classes.' });
        return;
      }
    }

    // Bulk upsert (update if exists, insert if new)
    const bulkOps = studentsToSave.map(studentData => ({
      updateOne: {
        filter: { rollNo: studentData.rollNo },
        update: { $set: studentData },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Student.bulkWrite(bulkOps);
    }

    res.json({ message: `Successfully processed ${studentsToSave.length} records` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing file', error });
  }
});

// Get All Students (HOD, Staff)
router.get('/', authenticate, authorize(['HOD', 'Staff']), async (req: AuthRequest, res) => {
  try {
    const filter: any = {};
    if (req.user?.role === 'Staff') {
      // Staff can only see their assigned classes
      if (req.user.assignedClasses && req.user.assignedClasses.length > 0) {
        filter.$or = req.user.assignedClasses.map((cls: any) => ({
          year: cls.year,
          section: cls.section
        }));
      } else {
        // If no classes assigned, they see nothing
        filter.rollNo = 'NONE';
      }
    }
    
    if (req.query.search) {
      const searchStr = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(searchStr, 'i');
      const searchFilter = [
        { name: searchRegex },
        { rollNo: searchRegex },
        { department: searchRegex }
      ];
      
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: searchFilter }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchFilter;
      }
    }

    const students = await Student.find(filter);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Global Search (All Roles)
router.get('/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      res.json([]);
      return;
    }

    const searchStr = String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(searchStr, 'i');
    const filter: any = {
      $or: [
        { name: searchRegex },
        { rollNo: searchRegex },
        { registerNo: searchRegex },
        { department: searchRegex }
      ]
    };

    // Apply role-based restrictions
    if (req.user?.role === 'Staff') {
      if (req.user.assignedClasses && req.user.assignedClasses.length > 0) {
        filter.$and = [
          {
            $or: req.user.assignedClasses.map((cls: any) => ({
              year: cls.year,
              section: cls.section
            }))
          }
        ];
      } else {
        filter.rollNo = 'NONE';
      }
    }

    const students = await Student.find(filter)
      .select('name rollNo department year section registerNo')
      .limit(10);
      
    res.json(students);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Student (HOD, Staff)
router.put('/:id', authenticate, authorize(['HOD', 'Staff']), async (req: AuthRequest, res) => {
  try {
    const studentId = req.params.id;
    const updateData = req.body;

    // Staff can only update students in their assigned classes
    if (req.user?.role === 'Staff') {
      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({ message: 'Student not found' });
        return;
      }
      
      const isAssigned = req.user.assignedClasses?.some((cls: any) => 
        cls.year === student.year && cls.section === student.section
      );
      
      if (!isAssigned) {
        res.status(403).json({ message: 'Forbidden: Cannot edit student from another class' });
        return;
      }
    }

    // We need to fetch the document, update it, and save it to trigger the pre-save hook
    // findOneAndUpdate doesn't trigger pre-save hooks by default unless configured, 
    // but saving the document directly is safer for complex hooks.
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    student.set(updateData);
    await student.save();

    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Error updating student', error });
  }
});

// Update Student Attendance (HOD, Staff)
router.post('/:id/attendance', authenticate, authorize(['HOD', 'Staff']), async (req: AuthRequest, res) => {
  try {
    const studentId = req.params.id;
    const { date, status, remarks } = req.body;

    if (!date || !status) {
      res.status(400).json({ message: 'Date and status are required' });
      return;
    }

    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    // Staff can only update students in their assigned classes
    if (req.user?.role === 'Staff') {
      const isAssigned = req.user.assignedClasses?.some((cls: any) => 
        cls.year === student.year && cls.section === student.section
      );
      if (!isAssigned) {
        res.status(403).json({ message: 'Forbidden: Cannot edit student from another class' });
        return;
      }
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    if (!student.attendanceHistory) {
      student.set('attendanceHistory', []);
    }

    const existingIndex = student.attendanceHistory.findIndex(
      (a: any) => new Date(a.date).getTime() === attendanceDate.getTime()
    );

    if (existingIndex >= 0) {
      student.attendanceHistory[existingIndex].status = status;
      student.attendanceHistory[existingIndex].remarks = remarks;
    } else {
      student.attendanceHistory.push({ date: attendanceDate, status, remarks });
    }

    // Calculate overall attendance percentage
    const totalDays = student.attendanceHistory.length;
    const presentDays = student.attendanceHistory.filter((a: any) => a.status === 'Present' || a.status === 'Late').length;
    student.attendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    await student.save();
    res.json({ message: 'Attendance updated successfully', student });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Error updating attendance', error });
  }
});

// Delete Student (HOD, Staff)
router.delete('/:id', authenticate, authorize(['HOD', 'Staff']), async (req: AuthRequest, res) => {
  try {
    const studentId = req.params.id;

    // Staff can only delete students in their assigned classes
    if (req.user?.role === 'Staff') {
      const student = await Student.findById(studentId);
      if (!student) {
        res.status(404).json({ message: 'Student not found' });
        return;
      }
      const isAssigned = req.user.assignedClasses?.some((cls: any) => 
        cls.year === student.year && cls.section === student.section
      );
      if (!isAssigned) {
        res.status(403).json({ message: 'Forbidden: Cannot delete student from another class' });
        return;
      }
    }

    const deletedStudent = await Student.findByIdAndDelete(studentId);
    if (!deletedStudent) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student', error });
  }
});

// Get My Records (Student)
router.get('/me', authenticate, authorize(['Student']), async (req: AuthRequest, res) => {
  try {
    console.log('GET /me req.user:', req.user);
    // Student logs in with Roll No, which is stored in req.user.rollNo or req.user.email
    const rollNo = req.user?.rollNo || req.user?.email;
    console.log('GET /me rollNo:', rollNo);
    const escapedRollNo = String(rollNo).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const student = await Student.findOne({ rollNo: new RegExp(`^${escapedRollNo}$`, 'i') });
    console.log('GET /me student found:', student ? 'yes' : 'no');
    if (!student) {
      res.status(404).json({ message: 'Student record not found' });
      return;
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Request Update (Student)
router.post('/me/request-update', authenticate, authorize(['Student']), async (req: AuthRequest, res) => {
  try {
    const userRollNo = req.user?.rollNo || req.user?.email;
    const escapedRollNo = String(userRollNo).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const student = await Student.findOne({ rollNo: new RegExp(`^${escapedRollNo}$`, 'i') });
    
    if (!student) {
      res.status(404).json({ message: 'Student record not found' });
      return;
    }

    const { attendance, attendanceHistory, pendingUpdate, _id, __v, createdAt, updatedAt, rollNo, registerNo, ...updateData } = req.body; // Prevent updating sensitive fields

    student.pendingUpdate = {
      data: updateData,
      status: 'Pending',
      requestedAt: new Date()
    };

    await student.save();
    res.json({ message: 'Update requested successfully. Waiting for staff approval.', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Pending Updates (Staff)
router.get('/pending-updates', authenticate, authorize(['Staff', 'HOD']), async (req: AuthRequest, res) => {
  try {
    const filter: any = { 'pendingUpdate.status': 'Pending' };
    
    if (req.user?.role === 'Staff') {
      if (req.user.assignedClasses && req.user.assignedClasses.length > 0) {
        filter.$or = req.user.assignedClasses.map((cls: any) => ({
          year: cls.year,
          section: cls.section
        }));
      } else {
        filter.rollNo = 'NONE';
      }
    }

    const students = await Student.find(filter);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve Update (Staff)
router.post('/:id/approve-update', authenticate, authorize(['Staff', 'HOD']), async (req: AuthRequest, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student || !student.pendingUpdate || student.pendingUpdate.status !== 'Pending') {
      res.status(404).json({ message: 'Pending update not found' });
      return;
    }

    // Check if staff is authorized for this student's class
    if (req.user?.role === 'Staff') {
      const assignedClasses = req.user.assignedClasses || [];
      const isAuthorized = assignedClasses.some((cls: any) => cls.year === student.year && cls.section === student.section);
      if (!isAuthorized) {
        res.status(403).json({ message: 'Not authorized to approve updates for this class' });
        return;
      }
    }

    // Apply updates
    const updateData = student.pendingUpdate.data;
    student.set(updateData);
    
    student.pendingUpdate.status = 'Approved';
    await student.save();

    res.json({ message: 'Update approved successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject Update (Staff)
router.post('/:id/reject-update', authenticate, authorize(['Staff', 'HOD']), async (req: AuthRequest, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student || !student.pendingUpdate || student.pendingUpdate.status !== 'Pending') {
      res.status(404).json({ message: 'Pending update not found' });
      return;
    }

    // Check if staff is authorized for this student's class
    if (req.user?.role === 'Staff') {
      const assignedClasses = req.user.assignedClasses || [];
      const isAuthorized = assignedClasses.some((cls: any) => cls.year === student.year && cls.section === student.section);
      if (!isAuthorized) {
        res.status(403).json({ message: 'Not authorized to reject updates for this class' });
        return;
      }
    }

    student.pendingUpdate.status = 'Rejected';
    await student.save();

    res.json({ message: 'Update rejected successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate PDF Report (Individual)
router.get('/:id/report', authenticate, async (req: AuthRequest, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    // RBAC Check
    if (req.user?.role === 'Student') {
      const rollNo = req.user.rollNo || req.user.email;
      if (student.rollNo.toLowerCase() !== rollNo.toLowerCase()) {
        res.status(403).json({ message: 'Access denied. You can only view your own report.' });
        return;
      }
    } else if (req.user?.role === 'Staff') {
      const assignedClasses = req.user.assignedClasses || [];
      const isAssigned = assignedClasses.some(
        (c: any) => c.year === student.year && c.section === student.section
      );
      if (!isAssigned) {
        res.status(403).json({ message: 'Access denied. Student not in your assigned classes.' });
        return;
      }
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${student.rollNo}_report.pdf`);
    
    doc.pipe(res);

    // PDF Content
    doc.fontSize(20).text('Academic Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Name: ${student.name}`);
    doc.text(`Roll No: ${student.rollNo}`);
    doc.text(`Department: ${student.department}`);
    doc.text(`Year/Section: ${student.year} - ${student.section}`);
    doc.moveDown();
    
    doc.text('Detailed Records:', { underline: true });
    
    const standardKeys = [
      '_id', '__v', 'createdAt', 'updatedAt', 'rollNo', 'name', 'department',
      'attendanceHistory', 'semesterMarks', 'pendingUpdate', 'password', 'role'
    ];
    const dynamicKeys = Object.keys(student.toObject()).filter(key => !standardKeys.includes(key));
    
    dynamicKeys.forEach(key => {
      const formattedKey = key.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
      const val = student.get(key);
      const displayVal = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val);
      doc.text(`${formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1)}: ${displayVal}`);
    });
    
    if (dynamicKeys.length === 0) {
      doc.text('No additional records found.');
    }

    // Add Attendance History
    if (student.attendanceHistory && student.attendanceHistory.length > 0) {
      doc.moveDown();
      doc.fontSize(14).text('Attendance History:', { underline: true });
      doc.fontSize(12);
      student.attendanceHistory.forEach((record: any) => {
        const dateStr = new Date(record.date).toLocaleDateString();
        doc.text(`${dateStr}: ${record.status} ${record.remarks ? `(${record.remarks})` : ''}`);
      });
    }

    // Add Semester Marks
    if (student.semesterMarks && student.semesterMarks.length > 0) {
      doc.moveDown();
      doc.fontSize(14).text('Semester Marks:', { underline: true });
      student.semesterMarks.forEach((sem: any) => {
        doc.fontSize(12).text(`Semester ${sem.semester} (GPA: ${sem.gpa})`, { underline: true });
        sem.marks.forEach((mark: any) => {
          doc.text(`  ${mark.subject}: ${mark.grade}`);
        });
        doc.moveDown(0.5);
      });
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating PDF' });
  }
});

// Generate Class Report (PDF/Excel)
router.get('/report/class', authenticate, authorize(['HOD', 'Staff']), async (req: AuthRequest, res) => {
  try {
    const { department, year, section, format } = req.query;
    
    if (!department || !year || !section) {
      res.status(400).json({ message: 'Missing query parameters: department, year, section' });
      return;
    }

    // RBAC: Staff can only generate reports for their assigned classes
    if (req.user?.role === 'Staff') {
      const assignedClasses = req.user.assignedClasses || [];
      const isAssigned = assignedClasses.some(
        (c: any) => c.year === year && c.section === section
      );
      if (!isAssigned) {
        res.status(403).json({ message: 'Access denied. You are not assigned to this class.' });
        return;
      }
    }

    const students = await Student.find({ department, year, section });
    
    if (students.length === 0) {
      res.status(404).json({ message: 'No students found for this class' });
      return;
    }

    if (format === 'excel') {
      const standardKeys = [
        '_id', '__v', 'createdAt', 'updatedAt', 'rollNo', 'name', 'department',
        'attendanceHistory', 'semesterMarks', 'pendingUpdate', 'password', 'role'
      ];
      
      const worksheetData = students.map(s => {
        const baseData: any = {
          'Roll No': s.rollNo,
          'Name': s.name,
          'Attendance (%)': s.attendance || 0
        };
        
        const dynamicKeys = Object.keys(s.toObject()).filter(key => !standardKeys.includes(key));
        dynamicKeys.forEach(key => {
          const formattedKey = key.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
          baseData[formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1)] = s.get(key);
        });
        
        return baseData;
      });

      const worksheet = xlsx.utils.json_to_sheet(worksheetData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Class Report');
      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${department}_${year}_${section}_Report.xlsx`);
      res.send(excelBuffer);
      return;
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${department}_${year}_${section}_Report.pdf`);
    
    doc.pipe(res);

    doc.fontSize(20).text('Class Details Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Department: ${department} | Year: ${year} | Section: ${section}`);
    doc.moveDown();

    // Table Header
    const startX = 50;
    let currentY = doc.y;
    
    const standardKeys = [
      '_id', '__v', 'createdAt', 'updatedAt', 'rollNo', 'name', 'department',
      'attendanceHistory', 'semesterMarks', 'pendingUpdate', 'password', 'role'
    ];
    
    // Find all unique dynamic keys across all students in the class
    const allDynamicKeys = new Set<string>();
    students.forEach(s => {
      Object.keys(s.toObject()).forEach(key => {
        if (!standardKeys.includes(key)) {
          allDynamicKeys.add(key);
        }
      });
    });
    
    const dynamicKeysArray = Array.from(allDynamicKeys).slice(0, 3); // Limit to 3 dynamic columns for PDF width to fit attendance
    
    doc.text('Roll No', startX, currentY);
    doc.text('Name', startX + 80, currentY);
    doc.text('Att. (%)', startX + 200, currentY);
    
    let currentX = startX + 260;
    dynamicKeysArray.forEach(key => {
      const formattedKey = key.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
      doc.text(formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1), currentX, currentY, { width: 70, lineBreak: false });
      currentX += 80;
    });
    
    doc.moveDown();
    doc.moveTo(startX, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table Rows
    students.forEach(student => {
      currentY = doc.y;
      
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      doc.text(student.rollNo, startX, currentY);
      doc.text(student.name, startX + 80, currentY, { width: 110, lineBreak: false });
      doc.text(String(student.attendance || 0), startX + 200, currentY);
      
      currentX = startX + 260;
      dynamicKeysArray.forEach(key => {
        const val = student.get(key);
        doc.text(val !== undefined && val !== null ? String(val) : '-', currentX, currentY, { width: 70, lineBreak: false });
        currentX += 80;
      });
      
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating class report' });
  }
});

// Generate Department Summary Report (PDF/Excel)
router.get('/report/department', authenticate, authorize(['HOD']), async (req: AuthRequest, res) => {
  try {
    const { department, format } = req.query;
    
    if (!department) {
      res.status(400).json({ message: 'Missing query parameter: department' });
      return;
    }

    // RBAC: HOD can only generate reports for their own department
    if (req.user?.department && req.user.department !== department) {
      res.status(403).json({ message: 'Access denied. You can only generate reports for your own department.' });
      return;
    }

    const students = await Student.find({ department });
    
    if (students.length === 0) {
      res.status(404).json({ message: 'No students found for this department' });
      return;
    }

    const totalStudents = students.length;
    
    // Group by year and section
    const classDistribution: Record<string, number> = {};
    let totalAttendance = 0;
    students.forEach(s => {
      const className = s.className || `${s.year}-${s.section}`;
      classDistribution[className] = (classDistribution[className] || 0) + 1;
      totalAttendance += s.attendance || 0;
    });
    const avgAttendance = totalStudents > 0 ? (totalAttendance / totalStudents).toFixed(2) : 0;

    if (format === 'excel') {
      const worksheetData = Object.entries(classDistribution).map(([className, count]) => ({
        'Class': className,
        'Student Count': count
      }));
      
      // Add a summary row
      worksheetData.push({ 'Class': 'Total Students', 'Student Count': totalStudents });
      worksheetData.push({ 'Class': 'Average Attendance (%)', 'Student Count': Number(avgAttendance) });

      const worksheet = xlsx.utils.json_to_sheet(worksheetData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Department Summary');
      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${department}_Summary_Report.xlsx`);
      res.send(excelBuffer);
      return;
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${department}_Summary_Report.pdf`);
    
    doc.pipe(res);

    doc.fontSize(20).text('Department Summary Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Department: ${department}`);
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Total Students: ${totalStudents}`);
    doc.text(`Average Attendance: ${avgAttendance}%`);
    doc.moveDown();
    
    doc.text('Class Distribution:', { underline: true });
    Object.entries(classDistribution).forEach(([className, count]) => {
      doc.text(`${className}: ${count} students`);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating department report' });
  }
});

// Analytics Dashboard Data
router.get('/analytics', authenticate, authorize(['HOD', 'Staff']), async (req: AuthRequest, res) => {
  try {
    let matchStage: any = {};
    if (req.user?.role === 'Staff') {
      const assignedClasses = req.user.assignedClasses || [];
      if (assignedClasses.length > 0) {
        matchStage = {
          $or: assignedClasses.map((c: any) => ({
            year: c.year,
            section: c.section
          }))
        };
      } else {
        // If staff has no assigned classes, return empty stats
        return res.json({
          totalStudents: 0,
          departmentStats: [],
          classStats: []
        });
      }
    }

    const totalStudents = await Student.countDocuments(matchStage);

    // Department wise stats
    const deptStats = await Student.aggregate([
      { $match: matchStage },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    
    // Class wise stats
    const classStats = await Student.aggregate([
      { $match: matchStage },
      { 
        $group: { 
          _id: { year: '$year', section: '$section' }, 
          count: { $sum: 1 },
          averageAttendance: { $avg: '$attendance' }
        } 
      },
      {
        $project: {
          _id: 1,
          count: 1,
          averageAttendance: { $round: ['$averageAttendance', 1] }
        }
      }
    ]);

    // Top students list with attendance
    const studentsWithAttendance = await Student.find(matchStage)
      .select('name rollNo department year section attendance')
      .sort({ attendance: -1 })
      .limit(20);

    res.json({
      totalStudents,
      departmentStats: deptStats,
      classStats: classStats,
      studentsList: studentsWithAttendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

// Get Single Student (All Roles)
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId);
    
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    // Apply role-based restrictions
    if (req.user?.role === 'Staff') {
      const assignedClasses = req.user.assignedClasses || [];
      const isAssigned = assignedClasses.some(
        (c: any) => c.year === student.year && c.section === student.section
      );
      if (!isAssigned) {
        res.status(403).json({ message: 'Forbidden: Cannot view student outside assigned classes' });
        return;
      }
    } else if (req.user?.role === 'Student') {
      const rollNo = req.user.rollNo || req.user.email;
      if (student.rollNo.toLowerCase() !== rollNo.toLowerCase()) {
        res.status(403).json({ message: 'Forbidden: Cannot view other student records' });
        return;
      }
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
