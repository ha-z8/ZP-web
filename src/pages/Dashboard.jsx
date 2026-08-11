import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

export default function Dashboard() {
  const [stats, setStats] = useState({ bookingsCount: 0, messagesCount: 0, usersCount: 0 });
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => { fetchData(); }, []);

  const navItems = [
    { 
      title: 'سجل الحجوزات', 
      path: '/dashboard/bookings', 
      icon: (
        <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    { 
      title: 'تقويم الحجوزات', 
      path: '/dashboard/calendar', 
      icon: (
        <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      title: 'صندوق الرسائل', 
      path: '/dashboard/messages', 
      icon: (
        <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      )
    },
    { 
      title: 'إدارة المستخدمين', 
      path: '/dashboard/users', 
      icon: (
        <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      title: 'باقات التصوير', 
      path: '/dashboard/packages', 
      icon: (
        <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      title: 'معرض الصور', 
      path: '/dashboard/album', 
      icon: (
        <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      title: 'إدارة السياسات', 
      path: '/dashboard/policies', 
      icon: (
        <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-brand-main">لوحــــة التحكم</h2>
          <p className="text-brand-muted text-sm">مرحبــاً بـك مجدداً في لوحــة إدارة النظام.</p>
        </div>
        
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
            <div className="mb-4">{item.icon}</div>
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