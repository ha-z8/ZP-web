import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import zLogo from '../assets/z-logo.png'; 

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminEmail, setAdminEmail] = useState('');

  // التحقق هل الصفحة الحالية هي الداشبورد الرئيسية
  const isDashboard = location.pathname === '/dashboard';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAdminEmail(user.email);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden">
      
      <header className="sticky top-0 z-50 w-full border-b border-amber-500/20 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-1">
            <img src={zLogo} alt="Logo" className="w-12 h-12 object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
            <div className="flex flex-col text-right">
              <span className="text-base font-black tracking-wider text-amber-400">zobaidhphoto</span>
              <span className="text-[10px] text-slate-400 tracking-widest -mt-0.5 font-bold">بوابة الإدارة والمشرفين</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <div className="text-xs bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-slate-400">
              مرحباً بك: <span className="text-amber-400 font-medium font-mono">{adminEmail}</span>
            </div>
          </nav>

          <div className="flex items-center gap-3">
            {/* التبديل الذكي بين عرض الموقع والعودة للوحة التحكم */}
            {isDashboard ? (
              <button
                onClick={() => navigate('/')}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
              >
                👁️ عرض الموقع العام
              </button>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 text-amber-400 hover:text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
              >
                🔙 العودة للوحة التحكم
              </button>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-transparent text-red-400 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-300"
            >
              تسجيل الخروج 🚪
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p> نظام إدارة ©<span dir='ltr' className="text-amber-400">zobaidhphoto</span> الحصري 2026</p>
          <p className="text-[9px] tracking-widest text-amber-500/40 font-mono">hazzaa SYSTEM V1.0</p>
        </div>
      </footer>
    </div>
  );
}