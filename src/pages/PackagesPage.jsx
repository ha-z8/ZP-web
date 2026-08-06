import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // حالة تأثير زر التحديث
  
  // 👈 تعيين رابط الصورة الافتراضي عند إضافة باقة جديدة
  const DEFAULT_IMAGE_URL = 'https://ipt.images.tshiftcdn.com/207265/x/0/small-format-photography-what-you-need-to-know-11.jpg?auto=compress%2Cformat&ch=Width%2CDPR&dpr=1&ixlib=php-3.3.0&w=883';
  
  const [newPackage, setNewPackage] = useState({ 
    name: '', 
    price: 1000, 
    description: '', 
    image_url: DEFAULT_IMAGE_URL, 
    features_string: '' 
  });

  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true); // تفعيل تأثير التحميل والدوران
    const { data: pkgsData } = await supabase.from('packages').select('*').order('price', { ascending: true });
    if (pkgsData) setPackages(pkgsData);

    // إيقاف تأثير التحميل بعد نصف ثانية ليوضح للمستخدم أن التحديث تم
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
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
          image_url: newPackage.image_url || DEFAULT_IMAGE_URL,
          features: featuresArray 
        }])
        .select();

      if (error) throw error;
      
      setPackages(prev => [...prev, ...data]);
      setIsAddModalOpen(false);
      setNewPackage({ name: '', price: 1000, description: '', image_url: DEFAULT_IMAGE_URL, features_string: '' });
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
      <div className="bg-brand-card border border-brand rounded-2xl p-6 shadow-xl mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-brand-main flex items-center gap-2"><span>📦</span> التحكم وتعديل باقات الاستوديو</h3>
          <div className="flex gap-2">
            {/* زر التحديث المحدث بنفس الشكل والتأثير */}
            <button 
              onClick={fetchData} 
              disabled={isRefreshing}
              className="bg-brand-main border border-brand text-brand-text text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:bg-brand-card-hover flex items-center gap-2 active:scale-95 disabled:opacity-70"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isRefreshing ? 'animate-spin text-brand-accent' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-brand-btn text-brand-text text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">➕ إضافة باقة جديدة</button>
          </div>
        </div>
        
        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-brand-main border border-brand rounded-3xl border-dashed shadow-sm">
            <span className="text-4xl mb-4">📦</span>
            <h3 className="text-lg font-bold text-brand-main">لا توجد باقات حالياً</h3>
            <p className="text-brand-muted text-sm mt-1">ابدأ بإضافة باقات جديدة لتظهر للعملاء.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand">
            <table className="w-full text-right text-sm text-brand-text">
              <thead className="bg-brand-main text-brand-muted text-xs font-bold border-b border-brand"><tr><th className="p-4">اسم الباقة</th><th className="p-4">السعر</th><th className="p-4 hidden md:table-cell">الوصف</th><th className="p-4 text-center">الإجراءات</th></tr></thead>
              <tbody className="divide-y divide-brand bg-brand-card">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-brand-main transition-all">
                    <td className="p-4 font-bold text-brand-main">{pkg.name}</td>
                    <td className="p-4 text-brand-main font-mono font-bold">{Number(pkg.price).toLocaleString()} ر.س</td>
                    <td className="p-4 hidden md:table-cell text-xs text-brand-muted max-w-xs truncate">{pkg.description}</td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      <button onClick={() => { setEditingPackage({...pkg, features_string: pkg.features ? pkg.features.join('\n') : ''}); setIsEditModalOpen(true); }} className="bg-brand-main hover:bg-brand-card-hover border border-brand text-brand-text text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm">📝 تعديل</button>
                      <button onClick={() => handleDeletePackage(pkg.id)} className="bg-brand-main hover:bg-brand-card-hover border border-brand text-red-700 hover:text-red-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm">🗑️ حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isEditModalOpen && editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-black text-brand-main mb-6">⚙️ تعديل بيانات الباقة</h3>
            <form onSubmit={handleUpdatePackage} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">اسم الباقة</label>
                <input type="text" required value={editingPackage.name} onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" placeholder="اسم الباقة" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">السعر</label>
                <input type="number" required value={editingPackage.price} onChange={(e) => setEditingPackage({...editingPackage, price: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" placeholder="السعر" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">رابط صورة الباقة (URL)</label>
                <input type="url" required value={editingPackage.image_url} onChange={(e) => setEditingPackage({...editingPackage, image_url: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" placeholder="رابط صورة الباقة (URL)" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">الوصف القصير</label>
                <input type="text" value={editingPackage.description} onChange={(e) => setEditingPackage({...editingPackage, description: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" placeholder="الوصف القصير" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">الميزات (كل ميزة في سطر)</label>
                <textarea rows="5" required value={editingPackage.features_string} onChange={(e) => setEditingPackage({...editingPackage, features_string: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" placeholder="الميزات (كل ميزة في سطر)" />
              </div>
              <button className="w-full bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all">{submittingEdit ? 'جاري...' : 'حفظ التحديثات'}</button>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full bg-brand-main border border-brand p-3 rounded-xl font-bold text-brand-muted hover:text-brand-text transition-all">إلغاء</button>
            </form>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-black text-brand-main mb-6">➕ إضافة باقة جديدة</h3>
            <form onSubmit={handleAddPackage} className="space-y-4">
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">اسم الباقة</label>
                <input type="text" required placeholder="اسم الباقة" value={newPackage.name} onChange={(e) => setNewPackage({...newPackage, name: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">السعر</label>
                <input type="number" required placeholder="السعر" value={newPackage.price} onChange={(e) => setNewPackage({...newPackage, price: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">رابط صورة الباقة (URL)</label>
                <input type="url" required placeholder="رابط صورة الباقة (URL)" value={newPackage.image_url} onChange={(e) => setNewPackage({...newPackage, image_url: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">الوصف القصير</label>
                <input type="text" placeholder="الوصف القصير" value={newPackage.description} onChange={(e) => setNewPackage({...newPackage, description: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-brand-muted text-xs font-semibold mb-1">الميزات (كل ميزة في سطر)</label>
                <textarea rows="5" required placeholder="الميزات (كل ميزة في سطر)" value={newPackage.features_string} onChange={(e) => setNewPackage({...newPackage, features_string: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-brand-text text-sm focus:outline-none" />
              </div>
              <button className="w-full bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all">{submittingAdd ? 'جاري...' : 'إضافة الباقة'}</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-full bg-brand-main border border-brand p-3 rounded-xl font-bold text-brand-muted hover:text-brand-text transition-all">إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}