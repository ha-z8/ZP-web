import React from 'react';

export default function UsersList({ users, onEdit }) {
  return (
    <div className="bg-brand-card border border-brand rounded-2xl p-6 shadow-xl mb-10">
      <h3 className="text-lg font-bold text-brand-main mb-6">👥 إدارة العملاء</h3>
      <div className="overflow-x-auto rounded-xl border border-brand">
        <table className="w-full text-right text-brand-text">
          <thead className="text-xs text-brand-muted border-b border-brand bg-brand-main">
            <tr>
              <th className="p-4">الاسم</th>
              <th className="p-4">الإيميل</th>
              <th className="p-4 text-center">التحكم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand bg-brand-card">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-brand-main transition-all">
                <td className="p-4 font-bold text-brand-main">{u.full_name}</td>
                <td className="p-4 text-brand-text truncate">{u.email}</td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => onEdit(u)} 
                    className="bg-brand-main hover:bg-brand-card-hover border border-brand text-brand-text px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                  >
                    تعديل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}