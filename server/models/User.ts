import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['HOD', 'Staff', 'Student'], required: true },
  department: { type: String }, // For HOD and Staff
  assignedClasses: [{ // For Staff
    year: String,
    section: String
  }],
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' } // Link to student record if role is Student
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
