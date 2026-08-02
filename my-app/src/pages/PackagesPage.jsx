import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({ name: '', price: 1000, description: '', image_url: '', features_string: '' });
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchData = async () => {
    const { data: pkgsData } = await supabase.from('packages').select('*').order('price', { ascending: true });
    if (pkgsData) setPackages(pkgsData);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddPackage = async (e) => {
    e.preventDefault();
    setSubmittingAdd(true);
    const featuresArray = newPackage.features_string.split('\n').map(item => item.trim()).filter(item => item !== '');
    
    try {
      const { data, error } = await supabase
        .from('packages')
        .insert([{ 
          name: newPackage.name,
          price: Number(newPackage.price),
          description: newPackage.description,
          image_url: newPackage.image_url,
          features: featuresArray 
        }])
        .select();

      if (error) throw error;
      
      setPackages(prev => [...prev, ...data]);
      setIsAddModalOpen(false);
      setNewPackage({ name: '', price: 1000, description: '', image_url: '', features_string: '' });
      showSuccess('تم إضافة الباقة الجديدة بنجاح!');
    } catch (err) { showError('حدث خطأ أثناء الإضافة.'); } finally { setSubmittingAdd(false); }
  };

  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    setSubmittingEdit(true);
    const featuresArray = editingPackage.features_string.split('\n').map(item => item.trim()).filter(item => item !== '');
    
    try {
      const { data, error } = await supabase
        .from('packages')
        .update({ 
          name: editingPackage.name,
          price: Number(editingPackage.price),
          description: editingPackage.description,
          image_url: editingPackage.image_url,
          features: featuresArray 
        })
        .eq('id', editingPackage.id)
        .select();

      if (error) throw error;
      
      setPackages(packages.map(p => p.id === editingPackage.id ? data[0] : p));
      setIsEditModalOpen(false);
      showSuccess('تم حفظ التعديلات بنجاح.');
    } catch (err) { showError('حدث خطأ أثناء حفظ التعديلات.'); } finally { setSubmittingEdit(false); }
  };

  const handleDeletePackage = async (packageId) => {
    const isConfirmed = await confirmAction('حذف باقة تصوير', 'هل أنتِ متأكدة من حذف هذه الباقة تماماً؟', 'تأكيد الحذف', true);
    if (!isConfirmed) return;
    try {
      await supabase.from('packages').delete().eq('id', packageId);
      setPackages(packages.filter(p => p.id !== packageId));
      showSuccess('تم حذف الباقة بنجاح.');
    } catch (err) { showError('حدث خطأ أثناء محاولة حذف الباقة.'); }
  };

  return (
    <AdminLayout>
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><span>📦</span> التحكم وتعديل باقات الاستوديو</h3>
          <div className="flex gap-2">
            <button onClick={fetchData} className="bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold px-4 py-2.5 rounded-xl transition-all">تحديث القائمة 🔄</button>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-5 py-2.5 rounded-xl transition-all">➕ إضافة باقة جديدة</button>
          </div>
        </div>
        
        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl border-dashed">
            <span className="text-4xl mb-4">📦</span>
            <h3 className="text-lg font-bold text-slate-300">لا توجد باقات حالياً</h3>
            <p className="text-slate-500 text-sm mt-1">ابدأ بإضافة باقات جديدة لتظهر للعملاء.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-850">
            <table className="w-full text-right text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs font-bold border-b border-slate-850"><tr><th className="p-4">اسم الباقة</th><th className="p-4">السعر</th><th className="p-4 hidden md:table-cell">الوصف</th><th className="p-4 text-center">الإجراءات</th></tr></thead>
              <tbody className="divide-y divide-slate-850/60 bg-slate-900/20">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-900/50 transition-all">
                    <td className="p-4 font-bold text-slate-100">{pkg.name}</td>
                    <td className="p-4 text-amber-400 font-mono font-bold">{Number(pkg.price).toLocaleString()} ر.س</td>
                    <td className="p-4 hidden md:table-cell text-xs text-slate-400 max-w-xs truncate">{pkg.description}</td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      <button onClick={() => { setEditingPackage({...pkg, features_string: pkg.features ? pkg.features.join('\n') : ''}); setIsEditModalOpen(true); }} className="bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 text-amber-400 hover:text-slate-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">📝 تعديل</button>
                      <button onClick={() => handleDeletePackage(pkg.id)} className="bg-red-500/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">🗑️ حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isEditModalOpen && editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-black text-white mb-6">⚙️ تعديل بيانات الباقة</h3>
            <form onSubmit={handleUpdatePackage} className="space-y-4">
              <input type="text" required value={editingPackage.name} onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl" placeholder="اسم الباقة" />
              <input type="number" required value={editingPackage.price} onChange={(e) => setEditingPackage({...editingPackage, price: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl" placeholder="السعر" />
              <input type="url" required value={editingPackage.image_url} onChange={(e) => setEditingPackage({...editingPackage, image_url: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl" placeholder="رابط صورة الباقة (URL)" />
              <input type="text" value={editingPackage.description} onChange={(e) => setEditingPackage({...editingPackage, description: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl" placeholder="الوصف القصير" />
              <textarea rows="5" required value={editingPackage.features_string} onChange={(e) => setEditingPackage({...editingPackage, features_string: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl" placeholder="الميزات (كل ميزة في سطر)" />
              <button className="w-full bg-amber-500 p-3 rounded-xl font-bold">{submittingEdit ? 'جاري...' : 'حفظ التحديثات'}</button>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full bg-slate-800 p-3 rounded-xl">إلغاء</button>
            </form>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-black text-white mb-6">➕ إضافة باقة جديدة</h3>
            <form onSubmit={handleAddPackage} className="space-y-4">
              <input type="text" required placeholder="اسم الباقة" value={newPackage.name} onChange={(e) => setNewPackage({...newPackage, name: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl" />
              <input type="number" required placeholder="السعر" value={newPackage.price} onChange={(e) => setNewPackage({...newPackage, price: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl" />
              <input type="url" required placeholder="رابط صورة الباقة (URL)" value={newPackage.image_url} onChange={(e) => setNewPackage({...newPackage, image_url: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl" />
              <input type="text" placeholder="الوصف القصير" value={newPackage.description} onChange={(e) => setNewPackage({...newPackage, description: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl" />
              <textarea rows="5" required placeholder="الميزات (كل ميزة في سطر)" value={newPackage.features_string} onChange={(e) => setNewPackage({...newPackage, features_string: e.target.value})} className="w-full bg-slate-900 p-3 rounded-xl" />
              <button className="w-full bg-emerald-500 p-3 rounded-xl font-bold">{submittingAdd ? 'جاري...' : 'إضافة الباقة'}</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-full bg-slate-800 p-3 rounded-xl">إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}