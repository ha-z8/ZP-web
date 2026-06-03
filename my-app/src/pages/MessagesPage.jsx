import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // 👈 حالة البحث
  const [copiedId, setCopiedId] = useState(null);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'بانتظار المراجعة': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'قيد المراجعة': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'تم الرد': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'ملغي': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CopyableText = ({ label, text, id }) => (
    <div 
      onClick={() => copyToClipboard(text, id)}
      className="group cursor-pointer p-3 rounded-xl bg-slate-900/50 border border-slate-850 hover:border-slate-700 transition-all"
    >
      <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">{label}</p>
      <p className={`text-xs font-medium ${copiedId === id ? 'text-emerald-400' : 'text-slate-200'}`}>
        {copiedId === id ? 'تم النسخ!' : (text || 'غير متوفر')}
      </p>
    </div>
  );

  const fetchData = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .like('category', 'رسالة تواصل%')
      .order('created_at', { ascending: false });
    if (data) setMessages(data);
  };

  const handleUpdateStatus = async (id, status) => {
    const { error } = await supabase.from('expenses').update({ status }).eq('id', id);
    if (!error) {
      setMessages(messages.map(m => m.id === id ? { ...m, status } : m));
      showSuccess('تم تحديث الحالة');
    } else showError('خطأ في التحديث');
  };

  const handleDelete = async (id) => {
    if (await confirmAction('حذف رسالة', 'هل أنت متأكد من حذف هذه الرسالة؟', 'حذف', true)) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (!error) {
        setMessages(messages.filter(m => m.id !== id));
        showSuccess('تم الحذف');
      } else showError('خطأ في الحذف');
    }
  };

  // 👈 منطق الفلترة (البحث في الاسم، الهاتف، أو نص الرسالة)
  const filteredMessages = messages.filter(m => 
    m.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.client_phone?.includes(searchQuery) ||
    m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => { fetchData(); }, []);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-black text-white">صندوق رسائل التواصل</h2>
          
          <input 
            type="text" 
            placeholder="بحث بالاسم، الجوال، أو نص الرسالة..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-xl text-sm focus:border-amber-500 focus:outline-none"
          />

          <button onClick={fetchData} className="bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-700">تحديث</button>
        </div>

        <div className="space-y-6">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl border-dashed">
              <span className="text-4xl mb-4">🔍</span>
              <h3 className="text-xl font-bold text-slate-300">لم يتم العثور على نتائج</h3>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div key={msg.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                  <span className="text-xs text-slate-400">تاريخ الإرسال: {new Date(msg.created_at).toLocaleDateString('ar-SA')}</span>
                  <div className="flex items-center gap-3">
                    <select 
                      value={msg.status || 'بانتظار المراجعة'} 
                      onChange={(e) => handleUpdateStatus(msg.id, e.target.value)} 
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${getStatusStyle(msg.status || 'بانتظار المراجعة')}`}
                    >
                      <option value="بانتظار المراجعة">بانتظار المراجعة</option>
                      <option value="قيد المراجعة">قيد المراجعة</option>
                      <option value="تم الرد">تم الرد</option>
                      <option value="ملغي">ملغي</option>
                    </select>
                    <button onClick={() => handleDelete(msg.id)} className="text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/20">حذف</button>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <CopyableText label="اسم العميل" text={msg.client_name} id={`${msg.id}-name`} />
                  <CopyableText label="رقم الهاتف" text={msg.client_phone} id={`${msg.id}-phone`} />
                  <CopyableText label="البريد الإلكتروني" text={msg.client_email} id={`${msg.id}-email`} />
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer hover:border-slate-700" 
                     onClick={() => copyToClipboard(msg.description, `${msg.id}-desc`)}>
                  <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase">نص الرسالة {copiedId === `${msg.id}-desc` && '(تم النسخ!)'}</p>
                  <p className="text-sm text-slate-300 leading-relaxed italic">{msg.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}