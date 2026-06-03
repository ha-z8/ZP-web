import React from 'react';

export function AddPhotoModal({ isOpen, onClose, onSubmit, newPhotoUrl, setNewPhotoUrl, submitting }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-8">
        <h3 className="text-xl font-black text-white mb-6">🖼️ إضافة صورة جديدة</h3>
        <form onSubmit={onSubmit}>
          <input type="url" required value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} placeholder="رابط الصورة" className="w-full bg-slate-900 p-3 rounded-xl text-white mb-4" />
          <button type="submit" disabled={submitting} className="w-full bg-indigo-500 p-3 rounded-xl text-white font-bold">{submitting ? 'جاري...' : 'نشر'}</button>
          <button type="button" onClick={onClose} className="w-full text-slate-500 mt-2">إلغاء</button>
        </form>
      </div>
    </div>
  );
}