import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ title: '', content: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    const { data } = await supabase.from('policies').select('*').order('sort_order', { ascending: true });
    if (data) setPolicies(data);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => { fetchData(); }, []);

  const movePolicy = async (policy, direction) => {
    const index = policies.findIndex(p => p.id === policy.id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= policies.length) return;

    const targetPolicy = policies[targetIndex];
    const tempOrder = policy.sort_order;

    await supabase.from('policies').update({ sort_order: targetPolicy.sort_order }).eq('id', policy.id);
    await supabase.from('policies').update({ sort_order: tempOrder }).eq('id', targetPolicy.id);
    fetchData();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('policies').insert([{
      title: newPolicy.title,
      content: newPolicy.content,
      sort_order: policies.length,
      is_active: true
    }]);
    if (error) showError('حدث خطأ أثناء الإضافة.');
    else { showSuccess('تم إضافة السياسة بنجاح!'); setIsAddModalOpen(false); setNewPolicy({ title: '', content: '' }); fetchData(); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('policies').update({ 
      title: editingPolicy.title, 
      content: editingPolicy.content 
    }).eq('id', editingPolicy.id);
    if (error) showError('حدث خطأ أثناء حفظ التعديلات.');
    else { showSuccess('تم حفظ التعديلات بنجاح.'); setIsEditModalOpen(false); fetchData(); }
  };

  const handleToggleStatus = async (policy) => {
    const newStatus = !policy.is_active;
    try {
      const { error } = await supabase
        .from('policies')
        .update({ is_active: newStatus })
        .eq('id', policy.id);

      if (error) throw error;

      setPolicies(policies.map(p => p.id === policy.id ? { ...p, is_active: newStatus } : p));
      showSuccess(newStatus ? 'تم تفعيل السياسة وإظهارها في الموقع.' : 'تم تعطيل السياسة وإخفاؤها من الموقع.');
    } catch (err) {
      showError('حدث خطأ أثناء تغيير حالة السياسة.');
    }
  };

  const handleDelete = async (id) => {
    if (await confirmAction('حذف سياسة', 'هل أنت متأكد من حذف هذه السياسة تماماً؟', 'تأكيد الحذف', true)) {
      await supabase.from('policies').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <AdminLayout>
      <div className="bg-brand-card border border-brand rounded-2xl p-6 shadow-xl mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-brand-main flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            إدارة سياسات وشروط الموقع
          </h3>
          <div className="flex gap-2">
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
              {isRefreshing ? 'جاري التحديث...' : 'تحديث القائمة'}
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="bg-brand-btn text-brand-text text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg 
                className="w-4 h-4 ml-1.5" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                viewBox="0 0 24 24"
                style={{ color: 'inherit' }}
               >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              إضافة سياسة جديدة
            </button>
          </div>
        </div>

        {policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-brand-main border border-brand rounded-3xl border-dashed shadow-sm">
            <svg className="w-12 h-12 text-brand-muted mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <h3 className="text-lg font-bold text-brand-main">لا توجد سياسات حالياً</h3>
            <p className="text-brand-muted text-sm mt-1">ابدأ بإضافة سياسات الشروط والخصوصية لتظهر للمستخدمين.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand">
            <table className="w-full text-right text-sm text-brand-text">
              <thead className="bg-brand-main text-brand-muted text-xs font-bold border-b border-brand">
                <tr>
                  <th className="p-4 w-24">الترتيب</th>
                  <th className="p-4">عنوان السياسة</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand bg-brand-card">
                {policies.map((p, i) => (
                  <tr key={p.id} className="hover:bg-brand-main transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {i > 0 ? (
                          <button 
                            onClick={() => movePolicy(p, 'up')} 
                            className="p-1.5 rounded-lg bg-brand-main border border-brand hover:border-brand-accent text-brand-text transition-all"
                            title="تحريك لأعلى"
                          >
                            <svg className="w-3.5 h-3.5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                        ) : <div className="w-6" />}

                        {i < policies.length - 1 ? (
                          <button 
                            onClick={() => movePolicy(p, 'down')} 
                            className="p-1.5 rounded-lg bg-brand-main border border-brand hover:border-brand-accent text-brand-text transition-all"
                            title="تحريك لأسفل"
                          >
                            <svg className="w-3.5 h-3.5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-brand-main">{p.title}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-fit ${p.is_active !== false ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {p.is_active !== false ? 'مفعلة وتظهر' : 'معطلة ومخفية'}
                      </span>
                    </td>
                    <td className="p-4 text-center flex justify-center items-center gap-2">
                      {/* زر التفعيل / التعطيل بحلة احترافية */}
                      <button 
                        onClick={() => handleToggleStatus(p)} 
                        className={`border text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${p.is_active !== false ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-500/30' : 'bg-green-500/10 hover:bg-green-500/20 text-green-700 border-green-500/30'}`}
                      >
                        {p.is_active !== false ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            تعطيل
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            تفعيل
                          </>
                        )}
                      </button>

                      {/* زر التعديل */}
                      <button 
                        onClick={() => { setEditingPolicy(p); setIsEditModalOpen(true); }} 
                        className="bg-brand-main hover:bg-brand-card-hover border border-brand text-brand-text text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        تعديل
                      </button>

                      {/* زر الحذف */}
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-700 hover:text-red-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* موديل الإضافة */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-black text-brand-main mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              إضافة سياسة
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input required placeholder="عنوان السياسة" value={newPolicy.title} onChange={(e) => setNewPolicy({...newPolicy, title: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-sm" />
              <textarea required rows="6" placeholder="محتوى السياسة (اضغط Enter لجعل كل سطر في سطر مستقل)..." value={newPolicy.content} onChange={(e) => setNewPolicy({...newPolicy, content: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-sm" />
              <button className="w-full bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all">إضافة</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-full bg-brand-main border border-brand p-3 rounded-xl font-bold text-brand-muted hover:text-brand-text transition-all">إلغاء</button>
            </form>
          </div>
        </div>
      )}

      {/* موديل التعديل */}
      {isEditModalOpen && editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
          <div className="bg-brand-card border border-brand rounded-3xl w-full max-w-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-black text-brand-main mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              تعديل السياسة
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input required value={editingPolicy.title} onChange={(e) => setEditingPolicy({...editingPolicy, title: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-sm" />
              <textarea required rows="6" value={editingPolicy.content} onChange={(e) => setEditingPolicy({...editingPolicy, content: e.target.value})} className="w-full bg-brand-main border border-brand p-3 rounded-xl text-sm" />
              <button className="w-full bg-brand-btn p-3 rounded-xl font-bold text-brand-text shadow-sm transition-all">حفظ التحديثات</button>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full bg-brand-main border border-brand p-3 rounded-xl font-bold text-brand-muted hover:text-brand-text transition-all">إلغاء</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}