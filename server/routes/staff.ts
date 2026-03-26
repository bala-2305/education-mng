import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all staff (HOD only)
router.get('/', authenticate, authorize(['HOD']), async (req: AuthRequest, res) => {
  try {
    // Only fetch staff in the same department as HOD, or all if HOD is global
    const query: any = { role: 'Staff' };
    if (req.user?.department) {
      query.department = req.user.department;
    }
    const staff = await User.find(query).select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new staff (HOD only)
router.post('/', authenticate, authorize(['HOD']), async (req: AuthRequest, res) => {
  try {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    // Ensure HOD can only create staff in their own department (unless they don't have one)
    const staffDepartment = req.user?.department || department;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'Staff',
      department: staffDepartment
    });

    await newUser.save();
    
    // Return staff without password
    const staffResponse = newUser.toObject();
    delete staffResponse.password;
    
    res.status(201).json({ message: 'Staff created successfully', staff: staffResponse });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update staff details (HOD only)
router.put('/:id', authenticate, authorize(['HOD']), async (req: AuthRequest, res) => {
  try {
    const { name, email, password, department } = req.body;

    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'Staff') {
      res.status(404).json({ message: 'Staff member not found' });
      return;
    }

    if (req.user?.department && staff.department !== req.user.department) {
      res.status(403).json({ message: 'Cannot modify staff from another department' });
      return;
    }

    if (name) staff.name = name;
    if (email) {
      if (email !== staff.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          res.status(400).json({ message: 'Email already in use' });
          return;
        }
        staff.email = email;
      }
    }
    if (department !== undefined) staff.department = department;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      staff.password = await bcrypt.hash(password, salt);
    }

    await staff.save();

    const staffResponse = staff.toObject();
    delete staffResponse.password;

    res.json({ message: 'Staff updated successfully', staff: staffResponse });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update staff assigned classes (HOD only)
router.put('/:id/assign-classes', authenticate, authorize(['HOD']), async (req: AuthRequest, res) => {
  try {
    const { assignedClasses } = req.body;
    
    // Validate assignedClasses format
    if (!Array.isArray(assignedClasses)) {
      res.status(400).json({ message: 'assignedClasses must be an array' });
      return;
    }

    const staff = await User.findById(req.params.id);
    if (!staff || staff.role !== 'Staff') {
      res.status(404).json({ message: 'Staff member not found' });
      return;
    }

    if (req.user?.department && staff.department !== req.user.department) {
      res.status(403).json({ message: 'Cannot modify staff from another department' });
      return;
    }

    staff.set('assignedClasses', assignedClasses);
    await staff.save();

    res.json({ message: 'Assigned classes updated successfully', staff });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
