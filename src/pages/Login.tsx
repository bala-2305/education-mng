import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      await axios.get('/api/auth/seed');
      alert('Demo users created! You can now login.');
    } catch (e) {
      alert('Error seeding data');
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-900 opacity-90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col justify-between p-16 text-white h-full">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <GraduationCap className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Student Manager</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Empower Your Education
            </h1>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Streamline student data, automate performance reports, and gain actionable insights for your institution.
            </p>
          </div>

          <div className="flex gap-4 text-sm text-indigo-200 font-medium">
            <span>© 2026 Student Manager</span>
            <span>•</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-slate-100"
        >
          <div className="text-center mb-10">
            {/* Responsive Catchy Title & Name */}
            <div className="mb-8 lg:hidden">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight mb-2 leading-tight">
                Empower Your Education
              </h1>
              <div className="flex items-center justify-center gap-2 text-slate-800">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
                <span className="text-xl font-bold tracking-wide uppercase">Student Manager</span>
              </div>
            </div>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 mt-2">Please enter your details to sign in</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address or Roll No</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                  placeholder="name@cse.edu or 25CS001"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900"
                  placeholder="•••••••• or YYYY-MM-DD"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex flex-col gap-3 text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 font-medium text-slate-700 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Demo Credentials</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-[10px] leading-tight">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-slate-400 uppercase font-bold mb-1">HOD</span>
                  hod@cse.edu<br/>
                  <span className="text-slate-400">pwd: 123456</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-slate-400 uppercase font-bold mb-1">Class Mam (2025-A)</span>
                  staff@cse.edu<br/>
                  <span className="text-slate-400">pwd: 123456</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-slate-400 uppercase font-bold mb-1">Class Mam (2024-B)</span>
                  staff2@cse.edu<br/>
                  <span className="text-slate-400">pwd: 123456</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-slate-400 uppercase font-bold mb-1">Student</span>
                  25CS001<br/>
                  <span className="text-slate-400">pwd: 2005-05-15 (DOB)</span>
                </div>
              </div>
              <button 
                onClick={handleSeed}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline mt-2 text-center"
              >
                Initialize Demo Data (Click first if login fails)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
