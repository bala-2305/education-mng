import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true },
  registerNo: { type: String, index: true },
  name: { type: String, required: true, index: true },
  department: { type: String, required: true, index: true },
  year: { type: String, index: true },
  section: { type: String },
  className: { type: String },
  dob: { type: String },
  UMIS: { type: String },
  EMIS: { type: String },
  address: { type: String },
  attendance: { type: Number, default: 0 },
  attendanceHistory: [{
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], required: true },
    remarks: { type: String }
  }],
  semesterMarks: [{
    semester: { type: Number },
    marks: [{
      subject: { type: String },
      grade: { type: String }
    }],
    gpa: { type: Number }
  }],
  pendingUpdate: {
    data: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'] },
    requestedAt: { type: Date }
  }
}, { timestamps: true, strict: false });

export const Student = mongoose.model('Student', StudentSchema);
