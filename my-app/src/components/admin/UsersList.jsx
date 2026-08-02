import React from 'react';

export default function UsersList({ users, onEdit }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
      <h3 className="text-lg font-bold text-purple-400 mb-6">👥 إدارة العملاء</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-slate-300">
          <thead className="text-xs text-slate-400 border-b border-slate-800"><tr><th className="p-4">الاسم</th><th className="p-4">الإيميل</th><th className="p-4">التحكم</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-slate-800/50">
                <td className="p-4">{u.full_name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4"><button onClick={() => onEdit(u)} className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded">تعديل</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}