import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

export default function Dashboard() {
  const [stats, setStats] = useState({ bookingsCount: 0, messagesCount: 0, usersCount: 0 });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
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
  };

  useEffect(() => { fetchData(); }, []);

  // إضافة /dashboard/ قبل المسار كما طلبت
  const navItems = [
    { title: 'سجل الحجوزات', path: '/dashboard/bookings', icon: '📅', color: 'border-amber-500/30 text-amber-400' },
    { title: 'صندوق الرسائل', path: '/dashboard/messages', icon: '✉️', color: 'border-blue-500/30 text-blue-400' },
    { title: 'إدارة المستخدمين', path: '/dashboard/users', icon: '👥', color: 'border-purple-500/30 text-purple-400' },
    { title: 'باقات التصوير', path: '/dashboard/packages', icon: '📦', color: 'border-emerald-500/30 text-emerald-400' },
    { title: 'معرض الصور', path: '/dashboard/album', icon: '🖼️', color: 'border-indigo-500/30 text-indigo-400' }
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white">لوحة التحكم</h2>
          <p className="text-slate-500 text-sm">مرحباً بك مجدداً في لوحة إدارة النظام.</p>
        </div>
        <button 
          onClick={async (e) => {
            const btn = e.target;
            btn.innerText = "جاري التحديث... ⏳";
            btn.disabled = true;
            await fetchData();
            btn.innerText = "تحديث البيانات 🔄";
            btn.disabled = false;
          }}
          className="bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
        >
          تحديث البيانات 🔄
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
          <p className="text-slate-500 text-sm font-bold mb-2">الحجوزات</p>
          <h3 className="text-4xl font-black text-white">{loading ? '...' : stats.bookingsCount}</h3>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
          <p className="text-slate-500 text-sm font-bold mb-2">رسائل جديدة</p>
          <h3 className="text-4xl font-black text-white">{loading ? '...' : stats.messagesCount}</h3>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
          <p className="text-slate-500 text-sm font-bold mb-2">المستخدمون</p>
          <h3 className="text-4xl font-black text-white">{loading ? '...' : stats.usersCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {navItems.map((item, index) => (
          <Link key={index} to={item.path} className={`bg-slate-900/50 p-6 rounded-2xl border ${item.color} hover:bg-slate-800 transition-all group`}>
            <span className="text-3xl mb-4 block">{item.icon}</span>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">{item.title}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </div>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}