import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import ThemeToggle from './ThemeToggle';
import zLogo from '../assets/z-logo.png'; 
import { APP_VERSION } from '../config/version';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminEmail, setAdminEmail] = useState('');

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
    <div dir="rtl" className="min-h-screen bg-brand-main text-brand-text font-sans flex flex-col overflow-x-hidden">
      
      <header className="sticky top-0 z-50 w-full border-b border-brand bg-brand-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-auto py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* الشعار */}
          <div className="flex items-center gap-2">
            <img src={zLogo} alt="Logo" className="w-10 h-10 object-contain filter drop-shadow-[0_0_8px_rgba(200,177,160,0.3)]" />
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-black tracking-wider text-brand-text">zobaidhphoto</span>
              <span className="text-[10px] text-brand-muted tracking-widest -mt-0.5 font-bold">بوابــة الإدارة والمشرفيـن</span>
            </div>
          </div>

          {/* البريد */}
          <div className="hidden md:flex text-[10px] bg-brand-main border border-brand px-3 py-1.5 rounded-lg text-brand-muted truncate max-w-[200px] shadow-sm">
            مـرحبـــــاً: <span className="text-brand-text font-bold mx-1">{adminEmail}</span>
          </div>

          {/* الأزرار وزر التبديل */}
          <div className="flex items-center gap-2 flex-wrap">
            <ThemeToggle />

            {isDashboard ? (
              <button
                onClick={() => navigate('/')}
                className="bg-brand-main hover:bg-brand-card-hover border border-brand text-brand-text text-[10px] font-bold px-3 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                عــــرض الـمـوقــع
              </button>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-brand-card hover:bg-brand-card-hover border border-brand text-brand-text text-[10px] font-bold px-3 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                لوحـــة التحكــم
              </button>
            )}

            <button
              onClick={handleLogout}
              className="bg-brand-card hover:bg-brand-card-hover border border-brand text-red-700 hover:text-red-800 text-[10px] font-bold px-3 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              تسجيـل خـــروج
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="w-full border-t border-brand bg-brand-card py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-brand-muted">
          <p> نظـــام إدارة ©<span dir='ltr' className="text-brand-text font-bold">zobaidhphoto</span> الحصـــري 2026</p>
          <p className="text-[9px] tracking-widest text-brand-muted font-mono uppercase">
            Diriyah Studios SYSTEM {APP_VERSION}
          </p>
        </div>
      </footer>
    </div>
  );
}