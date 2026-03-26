import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onUpdate: () => void;
}

export default function EditStudentModal({ isOpen, onClose, student, onUpdate }: EditStudentModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [semesterMarks, setSemesterMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      const { _id, __v, createdAt, updatedAt, attendance, attendanceHistory, pendingUpdate, semesterMarks: sm, ...rest } = student;
      setFormData(rest);
      setSemesterMarks(sm || []);
    }
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSemester = () => {
    setSemesterMarks([...semesterMarks, { semester: semesterMarks.length + 1, gpa: 0, marks: [] }]);
  };

  const handleRemoveSemester = (index: number) => {
    const updated = [...semesterMarks];
    updated.splice(index, 1);
    setSemesterMarks(updated);
  };

  const handleAddSubject = (semIndex: number) => {
    const updated = [...semesterMarks];
    updated[semIndex] = { ...updated[semIndex], marks: [...updated[semIndex].marks, { subject: '', grade: '' }] };
    setSemesterMarks(updated);
  };

  const handleRemoveSubject = (semIndex: number, subIndex: number) => {
    const updated = [...semesterMarks];
    const updatedMarks = [...updated[semIndex].marks];
    updatedMarks.splice(subIndex, 1);
    updated[semIndex] = { ...updated[semIndex], marks: updatedMarks };
    setSemesterMarks(updated);
  };

  const handleSubjectChange = (semIndex: number, subIndex: number, field: string, value: string | number) => {
    const updated = [...semesterMarks];
    const updatedMarks = [...updated[semIndex].marks];
    updatedMarks[subIndex] = { ...updatedMarks[subIndex], [field]: value };
    updated[semIndex] = { ...updated[semIndex], marks: updatedMarks };
    setSemesterMarks(updated);
  };

  const handleSemesterChange = (semIndex: number, field: string, value: string | number) => {
    const updated = [...semesterMarks];
    updated[semIndex] = { ...updated[semIndex], [field]: value };
    setSemesterMarks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/students/me/request-update', {
        ...formData,
        semesterMarks
      });
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request update');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Request Details Update</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <form id="update-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(formData).map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-2 capitalize">
                      {key.replace(/([a-z])([A-Z])/g, '$1 $2').trim()}
                    </label>
                    <input
                      type="text"
                      name={key}
                      value={formData[key] || ''}
                      onChange={handleChange}
                      disabled={key === 'rollNo' || key === 'registerNo'}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Semester Marks</h3>
                  <button
                    type="button"
                    onClick={handleAddSemester}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Semester
                  </button>
                </div>

                <div className="space-y-6">
                  {semesterMarks.map((sem, semIndex) => (
                    <div key={semIndex} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Semester</label>
                            <input
                              type="number"
                              value={sem.semester || ''}
                              onChange={(e) => handleSemesterChange(semIndex, 'semester', parseInt(e.target.value))}
                              className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">GPA</label>
                            <input
                              type="number"
                              step="0.01"
                              value={sem.gpa || ''}
                              onChange={(e) => handleSemesterChange(semIndex, 'gpa', parseFloat(e.target.value))}
                              className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSemester(semIndex)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {sem.marks.map((mark: any, subIndex: number) => (
                          <div key={subIndex} className="flex items-center gap-3">
                            <input
                              type="text"
                              placeholder="Subject Name"
                              value={mark.subject || ''}
                              onChange={(e) => handleSubjectChange(semIndex, subIndex, 'subject', e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Grade (e.g. A+)"
                              value={mark.grade || ''}
                              onChange={(e) => handleSubjectChange(semIndex, subIndex, 'grade', e.target.value)}
                              className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm uppercase"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSubject(semIndex, subIndex)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddSubject(semIndex)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          + Add Subject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="update-form"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
