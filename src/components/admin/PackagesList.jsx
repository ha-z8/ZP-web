import React from 'react';

export default function PackagesList({ packages, onDelete, onUpdatePackage, onAddPackage }) {
  return (
    <div className="bg-brand-card border border-brand rounded-2xl p-6 shadow-xl mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-brand-main">📦 باقات الاستوديو</h3>
        <button onClick={onAddPackage} className="bg-brand-btn text-brand-text px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm">➕ إضافة باقة</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-brand">
        <table className="w-full text-right text-brand-text">
          <tbody className="divide-y divide-brand bg-brand-card">
            {packages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-brand-main transition-all">
                <td className="p-4 font-bold text-brand-main">{pkg.name}</td>
                <td className="p-4 font-mono font-bold text-brand-main">{pkg.price} ر.س</td>
                <td className="p-4 flex gap-2 justify-end">
                  <button onClick={() => onUpdatePackage(pkg)} className="bg-brand-main hover:bg-brand-card-hover border border-brand text-brand-text px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm">📝 تعديل</button>
                  <button onClick={() => onDelete(pkg.id)} className="bg-brand-main hover:bg-brand-card-hover border border-brand text-red-700 hover:text-red-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm">🗑️ حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}