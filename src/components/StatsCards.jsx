import React from 'react';

export default function StatsCards({ stats, onRefresh, loading }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[
        { title: 'الحجوزات', val: stats.bookingsCount },
        { title: 'الرسائل', val: stats.messagesCount },
        { title: 'العملاء', val: stats.usersCount }
      ].map((item, i) => (
        <div key={i} className="bg-brand-card border border-brand p-4 rounded-xl flex justify-between items-center shadow-sm">
          <span className="text-brand-muted text-[10px] font-bold uppercase">{item.title}</span>
          <span className="text-brand-main font-black text-xl">{item.val}</span>
        </div>
      ))}
      <button 
        onClick={onRefresh}
        className="bg-brand-card border border-brand hover:border-brand-accent text-brand-main rounded-xl text-xs font-bold transition-all shadow-sm hover:bg-brand-card-hover"
      >
        {loading ? '...' : 'تحديث البيانات 🔄'}
      </button>
    </div>
  );
}