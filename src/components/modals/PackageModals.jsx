import React from 'react';

export function PackageModals({ isEditOpen, onCloseEdit, editingPackage, setEditingPackage, onSave, isAddOpen, onCloseAdd, newPackage, setNewPackage, onAdd, submitting }) {
  return (
    <>
      {isEditOpen && editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-xl font-black text-brand-main mb-6">⚙️ تعديل الباقة</h3>
            <form onSubmit={onSave} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">اسم الباقة</label>
                <input 
                  type="text" 
                  value={editingPackage.name} 
                  onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})} 
                  className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all mb-3"
                >
                  حفظ التعديلات
                </button>
                <button 
                  type="button" 
                  onClick={onCloseEdit} 
                  className="w-full text-brand-muted hover:text-brand-text text-xs font-bold py-2 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-xl font-black text-brand-main mb-6">➕ إضافة باقة</h3>
            <form onSubmit={onAdd} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">اسم الباقة</label>
                <input 
                  type="text" 
                  placeholder="اسم الباقة" 
                  onChange={(e) => setNewPackage({...newPackage, name: e.target.value})} 
                  className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" 
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all mb-3 disabled:opacity-50"
                >
                  {submitting ? 'جاري الإضافة...' : 'نشر الباقة'}
                </button>
                <button 
                  type="button" 
                  onClick={onCloseAdd} 
                  className="w-full text-brand-muted hover:text-brand-text text-xs font-bold py-2 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}