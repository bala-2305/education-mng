import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Trophy, Medal, Star, Camera, Music, Code, Users2, Shield, Award, BookOpen, Target, Edit2, Plus, Trash2, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Constants
const YEARS = ['First Year', 'Second Year', 'Third Year', 'Final Year'];
const SECTIONS = ['A', 'B', 'C'];

const TYPE_STYLES: Record<string, any> = {
  'Academic': { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Sports': { icon: Medal, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Talent': { icon: Music, color: 'text-purple-600', bg: 'bg-purple-50' }
};

export default function CampusLife() {
  const { user } = useAuth();
  const isStudent = user?.role === 'Student';

  const [activeMainTab, setActiveMainTab] = useState<'classes' | 'achievements' | 'groups'>('classes');
  
  // Classes State
  const [activeYear, setActiveYear] = useState(YEARS[0]);
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);
  const [classPhotos, setClassPhotos] = useState<any[]>([]);

  // Achievements State
  const [activeAchievementTab, setActiveAchievementTab] = useState<'Academic' | 'Sports' | 'Talent'>('Academic');
  const [achievements, setAchievements] = useState<any[]>([]);

  // Groups State
  const [activeGroup, setActiveGroup] = useState('Media Guild');
  const [groups, setGroups] = useState<any[]>([]);

  // Modals State
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [achievementForm, setAchievementForm] = useState({ id: '', name: '', type: 'Academic', title: '', description: '', image: '' });

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupForm, setGroupForm] = useState({ id: '', groupName: '', members: [] as any[] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [photosRes, achievementsRes, groupsRes] = await Promise.all([
        axios.get('/api/campus-life/photos'),
        axios.get('/api/campus-life/achievements'),
        axios.get('/api/campus-life/groups')
      ]);
      setClassPhotos(photosRes.data);
      setAchievements(achievementsRes.data);
      setGroups(groupsRes.data);
    } catch (error) {
      console.error('Error fetching campus life data:', error);
    }
  };

  const currentPhoto = classPhotos.find(p => p.year === activeYear && p.section === activeSection)?.photoUrl 
    || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';

  const currentGroupData = groups.find(g => g.groupName === activeGroup) || { members: [] };

  const handleSavePhoto = async () => {
    try {
      await axios.post('/api/campus-life/photos', {
        year: activeYear,
        section: activeSection,
        photoUrl: photoUrlInput
      });
      setShowPhotoModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving photo', error);
      alert('Failed to save photo');
    }
  };

  const handleSaveAchievement = async () => {
    try {
      if (achievementForm.id) {
        await axios.put(`/api/campus-life/achievements/${achievementForm.id}`, achievementForm);
      } else {
        await axios.post('/api/campus-life/achievements', achievementForm);
      }
      setShowAchievementModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving achievement', error);
      alert('Failed to save achievement');
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;
    try {
      await axios.delete(`/api/campus-life/achievements/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting achievement', error);
      alert('Failed to delete achievement');
    }
  };

  const handleSaveGroup = async () => {
    try {
      await axios.post('/api/campus-life/groups', {
        groupName: activeGroup,
        members: groupForm.members
      });
      setShowGroupModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving group', error);
      alert('Failed to save group');
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campus Life & Organization</h1>
        <p className="text-slate-500 mt-1">Explore classes, student achievements, and campus organizations.</p>
      </div>

      {/* Main Navigation */}
      <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-xl mb-8 w-fit border border-slate-200/50">
        {[
          { id: 'classes', label: 'Academic Classes', icon: Users },
          { id: 'achievements', label: 'Achievements & Talents', icon: Trophy },
          { id: 'groups', label: 'Campus Groups', icon: Shield }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeMainTab === tab.id
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeMainTab === 'classes' && (
          <motion.div
            key="classes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Four-Tiered Navigation */}
            <div className="flex gap-4 border-b border-slate-200">
              {YEARS.map(year => (
                <button
                  key={year}
                  onClick={() => setActiveYear(year)}
                  className={`pb-4 px-2 text-sm font-semibold transition-colors relative ${
                    activeYear === year ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {year}
                  {activeYear === year && (
                    <motion.div layoutId="yearTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Section Filtering */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">Section:</span>
              <div className="flex gap-2">
                {SECTIONS.map(section => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                      activeSection === section 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>

            {/* Class Visuals */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{activeYear} - Section {activeSection}</h3>
                  <p className="text-sm text-slate-500 mt-1">Class Photo & Directory</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold">
                    64 Students
                  </div>
                  {isStudent && (
                    <button 
                      onClick={() => {
                        setPhotoUrlInput(currentPhoto);
                        setShowPhotoModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="relative h-[400px] bg-slate-100">
                <img 
                  src={currentPhoto} 
                  alt={`Class of ${activeYear} Section ${activeSection}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                  <div className="text-white">
                    <p className="font-bold text-2xl">Class of 2026</p>
                    <p className="text-white/80 flex items-center gap-2 mt-1">
                      <Camera className="w-4 h-4" /> Official Class Photograph
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeMainTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                {['Academic', 'Sports', 'Talent'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveAchievementTab(tab as any)}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                      activeAchievementTab === tab
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tab === 'Academic' && 'Academic Honors'}
                    {tab === 'Sports' && 'Sports Recognition'}
                    {tab === 'Talent' && 'Hidden Talents'}
                  </button>
                ))}
              </div>
              {isStudent && (
                <button
                  onClick={() => {
                    setAchievementForm({ id: '', name: '', type: activeAchievementTab, title: '', description: '', image: '' });
                    setShowAchievementModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Achievement
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.filter(a => a.type === activeAchievementTab).map(achievement => {
                const style = TYPE_STYLES[achievement.type] || TYPE_STYLES['Academic'];
                const Icon = style.icon;
                return (
                  <motion.div
                    key={achievement._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative"
                  >
                    {isStudent && (
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setAchievementForm({ ...achievement, id: achievement._id });
                            setShowAchievementModal(true);
                          }}
                          className="p-1.5 bg-white text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAchievement(achievement._id)}
                          className="p-1.5 bg-white text-slate-400 hover:text-red-600 rounded-lg shadow-sm border border-slate-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <img src={achievement.image} alt={achievement.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100" referrerPolicy="no-referrer" />
                      <div className={`w-10 h-10 rounded-full ${style.bg} ${style.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{achievement.name}</h3>
                    <p className={`text-sm font-semibold ${style.color} mb-3`}>{achievement.title}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{achievement.description}</p>
                  </motion.div>
                );
              })}
              {achievements.filter(a => a.type === activeAchievementTab).length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500">
                  No achievements recorded in this category yet.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeMainTab === 'groups' && (
          <motion.div
            key="groups"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col md:flex-row gap-8"
          >
            {/* Sidebar for Groups */}
            <div className="w-full md:w-64 shrink-0 space-y-2">
              {['Media Guild', 'Sports Team', 'Tamil Mandram'].map(group => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeGroup === group
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {group}
                  <Users2 className={`w-4 h-4 ${activeGroup === group ? 'text-indigo-200' : 'text-slate-400'}`} />
                </button>
              ))}
            </div>

            {/* Group Content */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="mb-8 pb-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeGroup}</h2>
                  <p className="text-slate-500 mt-2">Organizational Directory & Role Mapping</p>
                </div>
                {isStudent && (
                  <button
                    onClick={() => {
                      setGroupForm({ id: currentGroupData._id || '', groupName: activeGroup, members: currentGroupData.members || [] });
                      setShowGroupModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Members
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentGroupData.members.map((member: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
                  >
                    <img src={member.image} alt={member.name} className="w-24 h-24 rounded-full object-cover mb-4 shadow-sm border-4 border-white" referrerPolicy="no-referrer" />
                    <h4 className="text-lg font-bold text-slate-900">{member.name}</h4>
                    <span className="mt-1 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      {member.role}
                    </span>
                  </motion.div>
                ))}
                {currentGroupData.members.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500">
                    No members added to this group yet.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Edit Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Update Class Photo</h3>
                <button onClick={() => setShowPhotoModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Photo URL</label>
                  <input
                    type="text"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setShowPhotoModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSavePhoto} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-200">
                    Save Photo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Achievement Edit Modal */}
      <AnimatePresence>
        {showAchievementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{achievementForm.id ? 'Edit Achievement' : 'Add Achievement'}</h3>
                <button onClick={() => setShowAchievementModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    value={achievementForm.name}
                    onChange={(e) => setAchievementForm({...achievementForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={achievementForm.type}
                    onChange={(e) => setAchievementForm({...achievementForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    <option value="Academic">Academic Honors</option>
                    <option value="Sports">Sports Recognition</option>
                    <option value="Talent">Hidden Talents</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title / Award</label>
                  <input
                    type="text"
                    value={achievementForm.title}
                    onChange={(e) => setAchievementForm({...achievementForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={achievementForm.description}
                    onChange={(e) => setAchievementForm({...achievementForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={achievementForm.image}
                    onChange={(e) => setAchievementForm({...achievementForm, image: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setShowAchievementModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveAchievement} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-200">
                    Save Achievement
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Group Edit Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Edit Members: {activeGroup}</h3>
                <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {groupForm.members.map((member, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        placeholder="Member Name"
                        value={member.name}
                        onChange={(e) => {
                          const newMembers = [...groupForm.members];
                          newMembers[idx].name = e.target.value;
                          setGroupForm({...groupForm, members: newMembers});
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Role (e.g., President)"
                        value={member.role}
                        onChange={(e) => {
                          const newMembers = [...groupForm.members];
                          newMembers[idx].role = e.target.value;
                          setGroupForm({...groupForm, members: newMembers});
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Image URL"
                        value={member.image}
                        onChange={(e) => {
                          const newMembers = [...groupForm.members];
                          newMembers[idx].image = e.target.value;
                          setGroupForm({...groupForm, members: newMembers});
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newMembers = groupForm.members.filter((_, i) => i !== idx);
                        setGroupForm({...groupForm, members: newMembers});
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setGroupForm({...groupForm, members: [...groupForm.members, { name: '', role: '', image: '' }]});
                  }}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Member
                </button>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setShowGroupModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveGroup} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-200">
                    Save Group
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
