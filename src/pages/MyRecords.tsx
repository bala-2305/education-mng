import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, FileText, Award, BookOpen, Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import EditStudentModal from '../components/EditStudentModal';

export default function MyRecords() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchMyRecords();
  }, []);

  const fetchMyRecords = async () => {
    try {
      const res = await axios.get('/api/students/me');
      setStudent(res.data);
    } catch (error) {
      console.error('Error fetching my records', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!student) return;
    try {
      const res = await axios.get(`/api/students/${student._id}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${student.rollNo}_report.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error downloading report', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!student) return (
    <div className="flex flex-col items-center justify-center h-96 text-slate-500">
      <FileText className="w-16 h-16 text-slate-300 mb-4" />
      <h2 className="text-xl font-bold text-slate-700">No Records Found</h2>
      <p className="mt-2 text-sm">Your academic records have not been uploaded yet.</p>
    </div>
  );

  const standardKeys = ['_id', '__v', 'createdAt', 'updatedAt', 'rollNo', 'name', 'department', 'attendanceHistory', 'attendance', 'semesterMarks', 'pendingUpdate', 'password', 'role'];
  const dynamicKeys = student ? Object.keys(student).filter(key => !standardKeys.includes(key)) : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">My Student Records</h1>
          <p className="text-slate-500 mt-1">View your details and download your report card.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
          >
            Request Update
          </button>
          <button 
            onClick={handleDownloadReport}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {student.pendingUpdate?.status === 'Pending' && (
          <div className="col-span-1 md:col-span-4 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Update Request Pending</h4>
              <p className="text-sm text-amber-700 mt-1">Your request to update details is currently pending approval from your class teacher.</p>
            </div>
          </div>
        )}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Department</p>
            <p className="text-lg font-bold text-slate-900">{student.department}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Name</p>
            <p className="text-lg font-bold text-slate-900">{student.name}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Year / Section</p>
            <p className="text-lg font-bold text-slate-900">{student.year} - {student.section}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Attendance</p>
            <p className="text-lg font-bold text-slate-900">{student.attendance || 0}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">Detailed Records</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dynamicKeys.map((key, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-700 capitalize">{key.replace(/([a-z])([A-Z])/g, '$1 $2').trim()}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                      {typeof student[key] === 'object' && student[key] !== null 
                        ? JSON.stringify(student[key]) 
                        : String(student[key])}
                    </span>
                  </div>
                </div>
              ))}
              {dynamicKeys.length === 0 && (
                <div className="text-center text-slate-500 py-4">No additional records found.</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Attendance History</h3>
          </div>
          <div className="p-6">
            {(!student.attendanceHistory || student.attendanceHistory.length === 0) ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">No attendance records found</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...student.attendanceHistory]
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                            record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                            record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {record.status === 'Present' && <CheckCircle2 className="w-3 h-3" />}
                            {record.status === 'Absent' && <XCircle className="w-3 h-3" />}
                            {record.status === 'Late' && <Clock className="w-3 h-3" />}
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {record.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {student.semesterMarks && student.semesterMarks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">Semester Marks</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {student.semesterMarks.map((sem: any, idx: number) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">Semester {sem.semester}</h4>
                    <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">GPA: {sem.gpa}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {sem.marks.map((mark: any, mIdx: number) => (
                      <div key={mIdx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{mark.subject}</span>
                        <span className="font-medium text-slate-900">{mark.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <EditStudentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        student={student} 
        onUpdate={fetchMyRecords} 
      />
    </motion.div>
  );
}
