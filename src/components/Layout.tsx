import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Upload, Users, LogOut, GraduationCap, Menu, Bell, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import GlobalSearch from './GlobalSearch';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['HOD', 'Staff', 'Student'] },
    { path: '/upload', label: 'Upload Records', icon: Upload, roles: ['HOD', 'Staff'] },
    { path: '/students', label: 'Students', icon: Users, roles: ['HOD', 'Staff'] },
    { path: '/my-records', label: 'My Records', icon: GraduationCap, roles: ['Student'] },
    { path: '/campus-life', label: 'Campus Life', icon: Star, roles: ['HOD', 'Staff', 'Student'] },
    { path: '/staff', label: 'Staff Management', icon: Users, roles: ['HOD'] },
    { path: '/approvals', label: 'Pending Approvals', icon: Bell, roles: ['HOD', 'Staff'] },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3 border-b border-slate-100">
        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="font-bold text-xl text-slate-900 tracking-tight block">Student Manager</span>
          <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest">Empower Education</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 overflow-y-auto">
        <div className="mb-2 px-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Main Menu</p>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            if (item.roles && !item.roles.includes(user?.role || '')) return null;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-8 bg-indigo-600 rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
                <item.icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate font-medium">{user?.role} • {user?.department || 'General'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 fixed h-full z-20 flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-40 flex flex-col shadow-2xl lg:hidden"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 w-full">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 max-w-md">
              <GlobalSearch />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(user?.role === 'Student' ? '/my-records' : '/approvals')}
              className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
