import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileSpreadsheet, Check, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await axios.post('/api/students/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: res.data.message });
      setFile(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Records</h1>
        <p className="text-slate-500 mt-1">Bulk upload student data via Excel for automated processing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer relative group">
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              {file ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-emerald-600">
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-slate-900 text-lg">{file.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                  <p className="text-xs text-indigo-600 mt-4 font-medium bg-indigo-50 px-3 py-1 rounded-full">Click to change file</p>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-slate-900 text-lg">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500 mt-1">Excel files only (.xlsx, .xls)</p>
                </div>
              )}
            </div>

            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}
              >
                {message.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span className="font-medium">{message.text}</span>
              </motion.div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`px-8 py-3 rounded-xl font-semibold text-white transition-all shadow-lg flex items-center gap-2 ${
                  !file || uploading 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5'
                }`}
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Process File
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions / Format */}
        <div className="lg:col-span-1">
          <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/50 rounded-full blur-2xl -ml-12 -mb-12"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Expected Format</h3>
              </div>
              
              <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                Ensure your Excel file contains common student details. The system will automatically import all columns found in the file.
              </p>

              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 overflow-x-auto">
                <table className="text-xs text-left w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2 px-2 font-mono text-indigo-200">Col</th>
                      <th className="py-2 px-2 font-mono text-indigo-200">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-2 px-2 font-medium">RollNo</td>
                      <td className="py-2 px-2 text-indigo-100">25CS001</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-medium">RegisterNo</td>
                      <td className="py-2 px-2 text-indigo-100">714024104121</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-medium">Name</td>
                      <td className="py-2 px-2 text-indigo-100">John Doe</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-medium">DOB</td>
                      <td className="py-2 px-2 text-indigo-100">2005-05-15</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2 font-medium">Class</td>
                      <td className="py-2 px-2 text-indigo-100">II Year CSE A</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-indigo-300 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Supported formats: .xlsx, .xls
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
