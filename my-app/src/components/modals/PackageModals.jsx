import React from 'react';

export function PackageModals({ isEditOpen, onCloseEdit, editingPackage, setEditingPackage, onSave, isAddOpen, onCloseAdd, newPackage, setNewPackage, onAdd, submitting }) {
  return (
    <>
      {isEditOpen && editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-8">
            <h3 className="text-xl font-black text-white mb-6">⚙️ تعديل الباقة</h3>
            <form onSubmit={onSave} className="space-y-4">
              <input type="text" value={editingPackage.name} onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl text-white" />
              <button type="submit" className="w-full bg-amber-500 p-3 rounded-xl font-bold">حفظ التعديلات</button>
              <button type="button" onClick={onCloseEdit} className="w-full text-slate-500">إلغاء</button>
            </form>
          </div>
        </div>
      )}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-8">
            <h3 className="text-xl font-black text-white mb-6">➕ إضافة باقة</h3>
            <form onSubmit={onAdd} className="space-y-4">
              <input type="text" placeholder="اسم الباقة" onChange={(e) => setNewPackage({...newPackage, name: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl text-white" />
              <button type="submit" className="w-full bg-emerald-500 p-3 rounded-xl font-bold">نشر الباقة</button>
              <button type="button" onClick={onCloseAdd} className="w-full text-slate-500">إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}