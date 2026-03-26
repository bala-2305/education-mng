import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Search, Loader2, User, GraduationCap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get(`/api/students/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSelectStudent = async (student: any) => {
    setIsOpen(false);
    setQuery('');
    
    // Fetch full student details
    try {
      // In this app, there is no single student endpoint, but we can fetch all students and filter,
      // or we can just use the search result data if it's enough.
      // Wait, there is no GET /api/students/:id endpoint.
      // Let's create a modal to show the student details.
      // Actually, we can just fetch the full student details using a new endpoint or just use the search result.
      // Let's add a GET /api/students/:id endpoint to the backend.
      const res = await axios.get(`/api/students/${student._id}`);
      setSelectedStudent(res.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search students..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm transition-all outline-none"
        />
        {loading && (
          <Loader2 className="absolute right-3 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 max-h-96 overflow-y-auto"
          >
            {results.length === 0 && !loading ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                No students found matching "{query}"
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {results.map((student) => (
                  <li key={student._id}>
                    <button
                      onClick={() => handleSelectStudent(student)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{student.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {student.rollNo} • {student.department} • {student.year}-{student.section}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Details Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedStudent && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedStudent(null)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[90vh]"
              >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Student Record</h2>
                    <p className="text-sm text-slate-500">Detailed information</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Basic Info</h3>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Name</p>
                      <p className="font-medium text-slate-900">{selectedStudent.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Roll No</p>
                      <p className="font-medium text-slate-900">{selectedStudent.rollNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Register No</p>
                      <p className="font-medium text-slate-900">{selectedStudent.registerNo || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Date of Birth</p>
                      <p className="font-medium text-slate-900">{selectedStudent.dob || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Academic Info</h3>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Department</p>
                      <p className="font-medium text-slate-900">{selectedStudent.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Class</p>
                      <p className="font-medium text-slate-900">{selectedStudent.className || `${selectedStudent.year} ${selectedStudent.department} ${selectedStudent.section}`}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">UMIS</p>
                      <p className="font-medium text-slate-900">{selectedStudent.UMIS || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">EMIS</p>
                      <p className="font-medium text-slate-900">{selectedStudent.EMIS || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Fields */}
                {Object.keys(selectedStudent).filter(key => 
                  !['_id', '__v', 'name', 'rollNo', 'registerNo', 'dob', 'department', 'year', 'section', 'className', 'UMIS', 'EMIS'].includes(key)
                ).length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Additional Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(selectedStudent)
                        .filter(key => !['_id', '__v', 'name', 'rollNo', 'registerNo', 'dob', 'department', 'year', 'section', 'className', 'UMIS', 'EMIS'].includes(key))
                        .map(key => (
                          <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 mb-1 capitalize">{key.replace(/([a-z])([A-Z])/g, '$1 $2').trim()}</p>
                            <p className="font-medium text-slate-900">{selectedStudent[key]}</p>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}
