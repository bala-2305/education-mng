import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Plus, X, Save, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [assignedClasses, setAssignedClasses] = useState<{ year: string, section: string }[]>([]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', department: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', department: '' });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await axios.get('/api/staff');
      setStaffList(res.data);
    } catch (error) {
      console.error('Error fetching staff', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staff: any) => {
    setEditingStaff(staff);
    setAssignedClasses(staff.assignedClasses || []);
    setEditForm({
      name: staff.name || '',
      email: staff.email || '',
      password: '',
      department: staff.department || ''
    });
  };

  const handleAddClass = () => {
    setAssignedClasses([...assignedClasses, { year: '', section: '' }]);
  };

  const handleRemoveClass = (index: number) => {
    const newClasses = [...assignedClasses];
    newClasses.splice(index, 1);
    setAssignedClasses(newClasses);
  };

  const handleClassChange = (index: number, field: 'year' | 'section', value: string) => {
    const newClasses = [...assignedClasses];
    newClasses[index][field] = value;
    setAssignedClasses(newClasses);
  };

  const handleSave = async () => {
    try {
      // Filter out empty classes
      const validClasses = assignedClasses.filter(c => c.year.trim() !== '' && c.section.trim() !== '');
      
      // Update classes
      await axios.put(`/api/staff/${editingStaff._id}/assign-classes`, { assignedClasses: validClasses });
      
      // Update details
      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
        department: editForm.department
      };
      if (editForm.password) {
        updateData.password = editForm.password;
      }
      
      await axios.put(`/api/staff/${editingStaff._id}`, updateData);

      setEditingStaff(null);
      fetchStaff();
    } catch (error: any) {
      console.error('Error updating staff', error);
      alert(error.response?.data?.message || 'Failed to update staff');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await axios.post('/api/staff', newStaff);
      setIsAddingStaff(false);
      setNewStaff({ name: '', email: '', password: '', department: '' });
      fetchStaff();
    } catch (error: any) {
      console.error('Error adding staff', error);
      alert(error.response?.data?.message || 'Failed to add staff');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-slate-500 mt-1">Assign classes to staff members.</p>
        </div>
        <button
          onClick={() => setIsAddingStaff(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Assigned Classes</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {staffList.map((staff) => (
                <tr key={staff._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900">{staff.name}</td>
                  <td className="py-4 px-6 text-slate-500">{staff.email}</td>
                  <td className="py-4 px-6 text-slate-500">{staff.department || 'N/A'}</td>
                  <td className="py-4 px-6 text-slate-500">
                    {staff.assignedClasses && staff.assignedClasses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {staff.assignedClasses.map((cls: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                            {cls.year} - {cls.section}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No classes assigned</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => handleEdit(staff)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center justify-end gap-1 ml-auto"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {staffList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-900">Edit {editingStaff.name}</h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-slate-900 border-b pb-2">Staff Details</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span></label>
                  <input 
                    type="password" 
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input 
                    type="text" 
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <h4 className="font-medium text-slate-900 border-b pb-2 mt-6">Assigned Classes</h4>
                {assignedClasses.map((cls, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="Year (e.g. 2025)" 
                      value={cls.year}
                      onChange={(e) => handleClassChange(idx, 'year', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input 
                      type="text" 
                      placeholder="Section (e.g. A)" 
                      value={cls.section}
                      onChange={(e) => handleClassChange(idx, 'section', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                      onClick={() => handleRemoveClass(idx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={handleAddClass}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-4 h-4" /> Add Class
                </button>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Add Staff Modal */}
      {isAddingStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Add New Staff</h3>
              <button onClick={() => setIsAddingStaff(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    required
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <input 
                    type="text" 
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddingStaff(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 disabled:opacity-50"
                >
                  {addLoading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Staff</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
