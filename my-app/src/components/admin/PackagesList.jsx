import React from 'react';

export default function PackagesList({ packages, onDelete, onUpdatePackage, onAddPackage }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
      <div className="flex justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-100">📦 باقات الاستوديو</h3>
        <button onClick={onAddPackage} className="bg-amber-500 text-black px-4 py-2 rounded-xl text-xs font-bold">➕ إضافة باقة</button>
      </div>
      <table className="w-full text-right text-slate-300">
        {packages.map((pkg) => (
          <tr key={pkg.id} className="border-b border-slate-800">
            <td className="p-4">{pkg.name}</td>
            <td className="p-4">{pkg.price} ر.س</td>
            <td className="p-4 flex gap-2">
              <button onClick={() => onUpdatePackage(pkg)} className="text-amber-400">📝</button>
              <button onClick={() => onDelete(pkg.id)} className="text-red-400">🗑️</button>
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}