import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

export default function Dashboard() {
  const [stats, setStats] = useState({ bookingsCount: 0, messagesCount: 0, usersCount: 0 });
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // حالة تأثير زر التحديث

  const fetchData = async () => {
    setIsRefreshing(true);
    setLoading(true);
    const [bkgs, msgs, usr] = await Promise.all([
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('expenses').select('*', { count: 'exact', head: true }).like('category', 'رسالة تواصل%'),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
    ]);
    setStats({
      bookingsCount: bkgs.count || 0,
      messagesCount: msgs.count || 0,
      usersCount: usr.count || 0
    });
    setLoading(false);
    
    // إيقاف تأثير التحميل والدوران بعد نصف ثانية
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => { fetchData(); }, []);

  const navItems = [
    { title: 'سجل الحجوزات', path: '/dashboard/bookings', icon: '📝' },
    { title: 'تقويم الحجوزات', path: '/dashboard/calendar', icon: '🗓️' },
    { title: 'صندوق الرسائل', path: '/dashboard/messages', icon: '📥' },
    { title: 'إدارة المستخدمين', path: '/dashboard/users', icon: '👤' },
    { title: 'باقات التصوير', path: '/dashboard/packages', icon: '✨' },
    { title: 'معرض الصور', path: '/dashboard/album', icon: '📷' }
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-brand-main">لوحــــة التحكم</h2>
          <p className="text-brand-muted text-sm">مرحبــاً بـك مجدداً في لوحــة إدارة النظام.</p>
        </div>
        
        {/* زر التحديث المحدث بنفس الشكل والتأثير والتصميم الموحد */}
        <button 
          onClick={fetchData} 
          disabled={isRefreshing}
          className="bg-brand-card hover:bg-brand-card-hover border border-brand text-brand-text text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95 disabled:opacity-70"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isRefreshing ? 'animate-spin text-brand-accent' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? 'جاري التحديث...' : 'تحديث البيانات'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-brand-card p-6 rounded-2xl border border-brand text-center shadow-lg">
          <p className="text-brand-muted text-sm font-bold mb-2">الحجوزات</p>
          <h3 className="text-4xl font-black text-brand-main">{loading ? '...' : stats.bookingsCount}</h3>
        </div>
        <div className="bg-brand-card p-6 rounded-2xl border border-brand text-center shadow-lg">
          <p className="text-brand-muted text-sm font-bold mb-2">رسائل جديدة</p>
          <h3 className="text-4xl font-black text-brand-main">{loading ? '...' : stats.messagesCount}</h3>
        </div>
        <div className="bg-brand-card p-6 rounded-2xl border border-brand text-center shadow-lg">
          <p className="text-brand-muted text-sm font-bold mb-2">المستخدمون</p>
          <h3 className="text-4xl font-black text-brand-main">{loading ? '...' : stats.usersCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {navItems.map((item, index) => (
          <Link key={index} to={item.path} className="bg-brand-card p-6 rounded-2xl border border-brand hover:border-brand-accent hover:bg-brand-card-hover transition-all group shadow-lg">
            <span className="text-3xl mb-4 block">{item.icon}</span>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-brand-main">{item.title}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-main">→</span>
            </div>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}