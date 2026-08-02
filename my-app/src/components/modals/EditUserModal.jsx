import React from 'react';

export function EditUserModal({ isOpen, onClose, editingUser, setEditingUser, onSave, submitting }) {
  if (!isOpen || !editingUser) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-8">
        <h3 className="text-xl font-black text-white mb-6">📝 تعديل بيانات العميل</h3>
        <form onSubmit={onSave} className="space-y-4">
          <input type="text" value={editingUser.full_name} onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl text-white" />
          <input type="email" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl text-white" />
          <button type="submit" disabled={submitting} className="w-full bg-purple-500 p-3 rounded-xl text-white font-bold">{submitting ? 'جاري...' : 'حفظ'}</button>
          <button type="button" onClick={onClose} className="w-full text-slate-500 mt-2">إلغاء</button>
        </form>
      </div>
    </div>
  );
}