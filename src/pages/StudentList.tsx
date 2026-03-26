import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, Search, Filter, FileText, MoreHorizontal, ChevronDown, X, Database, Edit2, Trash2, Save, ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function StudentList() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    year: ''
  });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [goToPageInput, setGoToPageInput] = useState('');

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeptReportModal, setShowDeptReportModal] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    department: '',
    year: '',
    section: '',
    format: 'pdf'
  });
  const [deptReportConfig, setDeptReportConfig] = useState({
    department: '',
    format: 'pdf'
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Edit State
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // Attendance Modal State
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState<any>(null);
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'Present',
    remarks: ''
  });

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students');
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching students', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (id: string, rollNo: string) => {
    try {
      const res = await axios.get(`/api/students/${id}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${rollNo}_report.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error downloading report', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return;
    
    try {
      await axios.delete(`/api/students/${id}`);
      setStudents(students.filter(s => s._id !== id));
    } catch (error) {
      console.error('Error deleting student', error);
      alert('Failed to delete student');
    }
  };

  const startEditing = (student: any) => {
    setEditingStudentId(student._id);
    setEditFormData({ ...student });
  };

  const cancelEditing = () => {
    setEditingStudentId(null);
    setEditFormData({});
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setEditFormData({
      ...editFormData,
      [field]: e.target.value
    });
  };

  const saveEdit = async () => {
    try {
      const res = await axios.put(`/api/students/${editingStudentId}`, editFormData);
      setStudents(students.map(s => s._id === editingStudentId ? res.data.student : s));
      setEditingStudentId(null);
    } catch (error) {
      console.error('Error updating student', error);
      alert('Failed to update student');
    }
  };

  const openAttendanceModal = (student: any) => {
    setSelectedStudentForAttendance(student);
    setAttendanceForm({
      date: new Date().toISOString().split('T')[0],
      status: 'Present',
      remarks: ''
    });
    setShowAttendanceModal(true);
  };

  const saveAttendance = async () => {
    if (!selectedStudentForAttendance) return;
    try {
      const res = await axios.post(`/api/students/${selectedStudentForAttendance._id}/attendance`, attendanceForm);
      setStudents(students.map(s => s._id === selectedStudentForAttendance._id ? res.data.student : s));
      // Update selected student to show new history
      setSelectedStudentForAttendance(res.data.student);
      setAttendanceForm({
        ...attendanceForm,
        remarks: ''
      });
      alert('Attendance updated successfully');
    } catch (error) {
      console.error('Error updating attendance', error);
      alert('Failed to update attendance');
    }
  };

  // Extract unique values for filters
  const departments = Array.from(new Set(students.map(s => s.department))).filter(Boolean);
  const years = Array.from(new Set(students.map(s => s.year))).filter(Boolean).sort();

  // Find dynamic keys (keys not in standard set)
  const standardKeys = [
    '_id', '__v', 'createdAt', 'updatedAt', 'rollNo', 'name', 'department',
    'attendanceHistory', 'semesterMarks', 'pendingUpdate', 'attendance', 'password', 'role'
  ];
  
  const dynamicKeys = Array.from<string>(
    new Set(
      students.flatMap(student => Object.keys(student).filter(key => !standardKeys.includes(key)))
    )
  );

  const filteredStudents = students.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      s.name.toLowerCase().includes(searchLower) || 
      s.rollNo.toLowerCase().includes(searchLower) ||
      dynamicKeys.some(key => s[key]?.toString().toLowerCase().includes(searchLower));

    const matchesDept = filters.department ? s.department === filters.department : true;
    const matchesYear = filters.year ? s.year?.toString() === filters.year : true;
    
    return matchesSearch && matchesDept && matchesYear;
  });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage));
  const currentStudents = filteredStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(goToPageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setGoToPageInput('');
    } else {
      alert(`Please enter a valid page number between 1 and ${totalPages}`);
    }
  };

  const handleGenerateClassReport = async () => {
    const dept = reportConfig.department || user?.department;
    if (!dept || !reportConfig.year || !reportConfig.section) {
      alert('Please fill in all fields (Department, Year, Section)');
      return;
    }
    
    try {
      const res = await axios.get(`/api/students/report/class?department=${dept}&year=${reportConfig.year}&section=${reportConfig.section}&format=${reportConfig.format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Class_Report_${dept}_${reportConfig.year}_${reportConfig.section}.${reportConfig.format}`);
      document.body.appendChild(link);
      link.click();
      setShowReportModal(false);
    } catch (error) {
      console.error('Error downloading class report', error);
      alert('Failed to download class report. Please check your permissions.');
    }
  };

  const handleGenerateDeptReport = async () => {
    if (!deptReportConfig.department) {
      alert('Please enter a department');
      return;
    }
    
    try {
      const res = await axios.get(`/api/students/report/department?department=${deptReportConfig.department}&format=${deptReportConfig.format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Department_Report_${deptReportConfig.department}.${deptReportConfig.format}`);
      document.body.appendChild(link);
      link.click();
      setShowDeptReportModal(false);
    } catch (error) {
      console.error('Error downloading department report', error);
      alert('Failed to download department report. Please check your permissions.');
    }
  };

  const clearFilters = () => {
    setFilters({ department: '', year: '' });
    setSearchTerm('');
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Student Records</h1>
          <p className="text-slate-500 mt-1 text-sm lg:text-base">Manage and view detailed student records.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name or roll no..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-64 shadow-sm transition-all"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium shadow-sm transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Department</label>
                <select 
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Year</label>
                <select 
                  value={filters.year}
                  onChange={(e) => setFilters({...filters, year: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">All Years</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <button 
                  onClick={clearFilters}
                  className="w-full px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 hover:text-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Generation Section */}
      <div className="mb-8 p-1 bg-slate-100 rounded-xl flex flex-col sm:flex-row gap-1 w-full sm:w-auto sm:inline-flex">
        <button 
          onClick={() => setShowReportModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
        >
          <FileText className="w-4 h-4" />
          Class Report
        </button>
        
        {user?.role === 'HOD' && (
          <button 
            onClick={() => setShowDeptReportModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
          >
            <FileText className="w-4 h-4" />
            Dept Summary
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 lg:px-6 py-4 w-24">Roll No</th>
                <th className="px-4 lg:px-6 py-4">Name</th>
                <th className="px-4 lg:px-6 py-4">Department</th>
                {dynamicKeys.map(key => (
                  <th key={key} className="px-4 lg:px-6 py-4 capitalize">{key.replace(/([a-z])([A-Z])/g, '$1 $2').trim()}</th>
                ))}
                <th className="px-4 lg:px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentStudents.map((student) => (
                <tr key={student._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-4 lg:px-6 py-4 font-mono text-slate-500 text-xs">
                    {editingStudentId === student._id ? (
                      <input 
                        type="text" 
                        value={editFormData.rollNo || ''} 
                        onChange={(e) => handleEditChange(e, 'rollNo')}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    ) : student.rollNo}
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    {editingStudentId === student._id ? (
                      <input 
                        type="text" 
                        value={editFormData.name || ''} 
                        onChange={(e) => handleEditChange(e, 'name')}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900 truncate max-w-[150px]">{student.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-slate-600">
                    {editingStudentId === student._id ? (
                      <input 
                        type="text" 
                        value={editFormData.department || ''} 
                        onChange={(e) => handleEditChange(e, 'department')}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 whitespace-nowrap">
                        {student.department}
                      </span>
                    )}
                  </td>
                  {dynamicKeys.map(key => (
                    <td key={key} className="px-4 lg:px-6 py-4 text-slate-600 text-sm">
                      {editingStudentId === student._id ? (
                        <input 
                          type="text" 
                          value={editFormData[key] || ''} 
                          onChange={(e) => handleEditChange(e, key)}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      ) : (
                        typeof student[key] === 'object' && student[key] !== null
                          ? JSON.stringify(student[key])
                          : (student[key] || '-')
                      )}
                    </td>
                  ))}
                  <td className="px-4 lg:px-6 py-4 text-right">
                    {editingStudentId === student._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={saveEdit} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title="Save">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEditing} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition-colors" title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openAttendanceModal(student)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors p-1.5 hover:bg-emerald-50 rounded-lg"
                          title="Attendance"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDownloadReport(student._id, student.rollNo)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 hover:bg-indigo-50 rounded-lg"
                          title="Download Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => startEditing(student)}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(student._id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6 + dynamicKeys.length} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-12 h-12 text-slate-200 mb-4" />
                      <p className="text-lg font-medium text-slate-900">No students found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredStudents.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="text-sm text-slate-500">
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredStudents.length)} of {filteredStudents.length} entries
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600 font-medium px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGoToPage} className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Go to:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={goToPageInput}
                  onChange={(e) => setGoToPageInput(e.target.value)}
                  className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder={currentPage.toString()}
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                >
                  Go
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Class Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Generate Class Report</h3>
                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input 
                    type="text" 
                    placeholder="e.g., CSE"
                    value={reportConfig.department || user?.department || ''}
                    onChange={(e) => setReportConfig({...reportConfig, department: e.target.value})}
                    disabled={user?.role === 'Staff'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                {user?.role === 'Staff' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
                    <select
                      value={`${reportConfig.year}-${reportConfig.section}`}
                      onChange={(e) => {
                        const [year, section] = e.target.value.split('-');
                        setReportConfig({...reportConfig, year: year || '', section: section || ''});
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="-">Select a class</option>
                      {user.assignedClasses?.map((cls, idx) => (
                        <option key={idx} value={`${cls.year}-${cls.section}`}>
                          {cls.year} - Section {cls.section}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                      <input 
                        type="text" 
                        placeholder="e.g., 2024"
                        value={reportConfig.year}
                        onChange={(e) => setReportConfig({...reportConfig, year: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                      <input 
                        type="text" 
                        placeholder="e.g., A"
                        value={reportConfig.section}
                        onChange={(e) => setReportConfig({...reportConfig, section: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="format" 
                        value="pdf" 
                        checked={reportConfig.format === 'pdf'}
                        onChange={(e) => setReportConfig({...reportConfig, format: e.target.value})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">PDF Document</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="format" 
                        value="excel" 
                        checked={reportConfig.format === 'excel'}
                        onChange={(e) => setReportConfig({...reportConfig, format: e.target.value})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">Excel Spreadsheet</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerateClassReport}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dept Report Modal */}
      <AnimatePresence>
        {showDeptReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Generate Department Report</h3>
                <button onClick={() => setShowDeptReportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input 
                    type="text" 
                    placeholder="e.g., CSE"
                    value={deptReportConfig.department}
                    onChange={(e) => setDeptReportConfig({...deptReportConfig, department: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="format" 
                        value="pdf" 
                        checked={deptReportConfig.format === 'pdf'}
                        onChange={(e) => setDeptReportConfig({...deptReportConfig, format: e.target.value})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">PDF Document</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="format" 
                        value="excel" 
                        checked={deptReportConfig.format === 'excel'}
                        onChange={(e) => setDeptReportConfig({...deptReportConfig, format: e.target.value})}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-slate-700">Excel Spreadsheet</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setShowDeptReportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerateDeptReport}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attendance Modal */}
      <AnimatePresence>
        {showAttendanceModal && selectedStudentForAttendance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowAttendanceModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Attendance Tracker</h3>
                    <p className="text-sm text-slate-500">{selectedStudentForAttendance.name} ({selectedStudentForAttendance.rollNo})</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAttendanceModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                {/* Add Attendance Form */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Add Record</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Date</label>
                      <input 
                        type="date" 
                        value={attendanceForm.date}
                        onChange={(e) => setAttendanceForm({...attendanceForm, date: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Status</label>
                      <select 
                        value={attendanceForm.status}
                        onChange={(e) => setAttendanceForm({...attendanceForm, status: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Remarks (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Medical leave"
                        value={attendanceForm.remarks}
                        onChange={(e) => setAttendanceForm({...attendanceForm, remarks: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={saveAttendance}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Record
                    </button>
                  </div>
                </div>

                {/* Attendance History */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Attendance History</h4>
                    <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      Overall: {selectedStudentForAttendance.attendance || 0}%
                    </div>
                  </div>
                  
                  {(!selectedStudentForAttendance.attendanceHistory || selectedStudentForAttendance.attendanceHistory.length === 0) ? (
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
                          {[...selectedStudentForAttendance.attendanceHistory]
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
