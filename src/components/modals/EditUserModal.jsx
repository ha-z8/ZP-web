import React from 'react';

export function EditUserModal({ isOpen, onClose, editingUser, setEditingUser, onSave, submitting }) {
  if (!isOpen || !editingUser) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-lg p-8 shadow-2xl">
        <h3 className="text-xl font-black text-brand-main mb-6">📝 تعديل بيانات العميل</h3>
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1">الاسم الكامل</label>
            <input 
              type="text" 
              value={editingUser.full_name} 
              onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})} 
              className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-brand-muted text-xs font-semibold mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={editingUser.email} 
              onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
              className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
            />
          </div>
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full bg-brand-btn p-3 rounded-xl text-brand-text font-bold shadow-sm transition-all mb-3 disabled:opacity-50"
            >
              {submitting ? 'جاري...' : 'حفظ'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-full text-brand-muted hover:text-brand-text text-xs font-bold py-2 transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}