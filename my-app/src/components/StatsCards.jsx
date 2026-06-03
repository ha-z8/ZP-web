import React from 'react';

export default function StatsCards({ stats, onRefresh, loading }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[
        { title: 'الحجوزات', val: stats.bookingsCount },
        { title: 'الرسائل', val: stats.messagesCount },
        { title: 'العملاء', val: stats.usersCount }
      ].map((item, i) => (
        <div key={i} className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl flex justify-between items-center">
          <span className="text-slate-500 text-[10px] font-bold uppercase">{item.title}</span>
          <span className="text-white font-black text-xl">{item.val}</span>
        </div>
      ))}
      <button 
        onClick={onRefresh}
        className="bg-[#0f172a] border border-slate-800 hover:border-amber-500 text-amber-500 rounded-xl text-xs font-bold transition-all"
      >
        {loading ? '...' : 'تحديث البيانات 🔄'}
      </button>
    </div>
  );
}