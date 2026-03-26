import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function PendingApprovals() {
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingUpdates();
  }, []);

  const fetchPendingUpdates = async () => {
    try {
      const res = await axios.get('/api/students/pending-updates');
      setPendingStudents(res.data);
    } catch (error) {
      console.error('Error fetching pending updates', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.post(`/api/students/${id}/approve-update`);
      fetchPendingUpdates();
    } catch (error) {
      console.error('Error approving update', error);
      alert('Failed to approve update');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await axios.post(`/api/students/${id}/reject-update`);
      fetchPendingUpdates();
    } catch (error) {
      console.error('Error rejecting update', error);
      alert('Failed to reject update');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Pending Approvals</h1>
        <p className="text-slate-500 mt-1">Review and approve student profile updates.</p>
      </div>

      {pendingStudents.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center py-16">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            There are no pending student updates to review at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingStudents.map((student) => (
            <motion.div 
              key={student._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{student.name} ({student.rollNo})</h3>
                  <p className="text-sm text-slate-500">Class: {student.year} - {student.section}</p>
                </div>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Pending Review
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-sm font-medium text-slate-900 mb-4 uppercase tracking-wider">Requested Changes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {(() => {
                    const changes = Object.entries(student.pendingUpdate.data).filter(([key, value]: any) => {
                      const currentValue = student[key];
                      if (typeof value === 'object' && value !== null) {
                        return JSON.stringify(value) !== JSON.stringify(currentValue);
                      }
                      return String(value || '') !== String(currentValue || '');
                    });

                    if (changes.length === 0) {
                      return <div className="col-span-1 md:col-span-2 text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-slate-100">No actual changes detected in this request relative to current data.</div>;
                    }

                    return changes.map(([key, value]: any) => {
                      if (key === 'semesterMarks') {
                      return (
                        <div key={key} className="col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Semester Marks Update</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {value.map((sem: any, idx: number) => (
                              <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                                  <span className="font-bold text-sm text-slate-800">Semester {sem.semester}</span>
                                  <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded">GPA: {sem.gpa}</span>
                                </div>
                                <div className="space-y-1">
                                  {sem.marks.map((mark: any, mIdx: number) => (
                                    <div key={mIdx} className="flex justify-between text-xs">
                                      <span className="text-slate-500">{mark.subject}</span>
                                      <span className="font-medium text-slate-900">{mark.grade}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                            {(!value || value.length === 0) && (
                              <p className="text-sm text-slate-500 italic">No semester marks provided.</p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    if (typeof value === 'object' && value !== null) {
                      return (
                        <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-sm font-medium text-slate-900 mt-1">Complex Data</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-slate-400 line-through">{student[key] || 'None'}</span>
                          <span className="text-sm font-bold text-indigo-600">→ {value}</span>
                        </div>
                      </div>
                    );
                    });
                  })()}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => handleReject(student._id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(student._id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Changes
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
