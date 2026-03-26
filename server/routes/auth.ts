import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Student } from '../models/Student';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

// Register (For setup purposes, usually HOD creates users)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const isRollNoFormat = /^\d{2}[A-Z]{2}\d{3}$/i.test(email) || !email.includes('@');

    // If it looks like a roll number, try to log in as a student
    if (isRollNoFormat) {
      // Escape special characters to prevent regex errors
      const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const student = await Student.findOne({ rollNo: new RegExp(`^${escapedEmail}$`, 'i') });
      
      if (student) {
        // For students, the password is their date of birth
        if (student.dob && password === student.dob) {
          const token = jwt.sign(
            { id: student._id, role: 'Student', name: student.name, department: student.department, rollNo: student.rollNo },
            JWT_SECRET,
            { expiresIn: '1d' }
          );

          res.json({
            token,
            user: {
              id: student._id,
              name: student.name,
              email: student.rollNo, // using rollNo as email in frontend state
              role: 'Student',
              department: student.department
            }
          });
          return;
        }
      }
    }

    // Check user (Staff / HOD)
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate Token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        name: user.name, 
        department: user.department,
        assignedClasses: user.assignedClasses 
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        assignedClasses: user.assignedClasses
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Seed Demo Users (For testing)
router.get('/seed', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const users = [
      { name: 'Dr. Smith (HOD)', email: 'hod@cse.edu', password: hashedPassword, role: 'HOD', department: 'CSE' },
      { 
        name: 'Mrs. Johnson (Class Mam 2025-A)', 
        email: 'staff@cse.edu', 
        password: hashedPassword, 
        role: 'Staff', 
        department: 'CSE',
        assignedClasses: [{ year: '2025', section: 'A' }]
      },
      { 
        name: 'Mr. Davis (Class Mam 2024-B)', 
        email: 'staff2@cse.edu', 
        password: hashedPassword, 
        role: 'Staff', 
        department: 'CSE',
        assignedClasses: [{ year: '2024', section: 'B' }]
      }
    ];

    for (const user of users) {
      await User.findOneAndUpdate({ email: user.email }, user, { upsert: true });
    }

    // Seed dummy students for login testing and class-wise data
    const dummyStudents = [
      { 
        rollNo: '25CS001', registerNo: '714024104121', name: 'John Doe', department: 'CSE', year: '2025', section: 'A', className: 'II Year CSE A', dob: '2005-05-15', UMIS: 'U12345', EMIS: 'E12345', address: '123 Main St, City'
      },
      { 
        rollNo: '25CS002', registerNo: '714024104122', name: 'Jane Smith', department: 'CSE', year: '2025', section: 'A', className: 'II Year CSE A', dob: '2005-08-22', UMIS: 'U12346', EMIS: 'E12346', address: '456 Oak St, City'
      },
      { 
        rollNo: '24CS001', registerNo: '714024104123', name: 'Alice Brown', department: 'CSE', year: '2024', section: 'B', className: 'III Year CSE B', dob: '2004-03-10', UMIS: 'U12347', EMIS: 'E12347', address: '789 Pine St, City'
      },
      { 
        rollNo: '24CS002', registerNo: '714024104124', name: 'Bob White', department: 'CSE', year: '2024', section: 'B', className: 'III Year CSE B', dob: '2004-11-05', UMIS: 'U12348', EMIS: 'E12348', address: '321 Elm St, City'
      }
    ];

    for (const student of dummyStudents) {
      await Student.findOneAndUpdate({ rollNo: student.rollNo }, student, { upsert: true });
    }

    res.json({ message: 'Demo users seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding users', error });
  }
});

export default router;
