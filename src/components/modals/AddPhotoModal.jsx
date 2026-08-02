import React from 'react';

export function AddPhotoModal({ isOpen, onClose, onSubmit, newPhotoUrl, setNewPhotoUrl, submitting }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-lg p-8 shadow-2xl">
        <h3 className="text-xl font-black text-brand-main mb-6">🖼️ إضافة صورة جديدة</h3>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-brand-muted text-xs font-semibold mb-1">رابط الصورة</label>
            <input 
              type="url" 
              required 
              value={newPhotoUrl} 
              onChange={(e) => setNewPhotoUrl(e.target.value)} 
              placeholder="رابط الصورة" 
              className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full bg-brand-btn p-3 rounded-xl text-brand-text font-bold shadow-sm transition-all mb-3 disabled:opacity-50"
          >
            {submitting ? 'جاري...' : 'نشر'}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full text-brand-muted hover:text-brand-text text-xs font-bold py-2 transition-all"
          >
            إلغاء
          </button>
        </form>
      </div>
    </div>
  );
}