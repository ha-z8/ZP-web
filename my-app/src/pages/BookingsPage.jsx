import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // حالة البحث
  const [copiedId, setCopiedId] = useState(null);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'بانتظار المراجعة': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'تمت المراجعة': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'مؤكد': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'انتظار الدفع': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
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
    const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (data) setBookings(data);
  };

  const handleUpdate = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
      showSuccess('تم التحديث');
    } else showError('خطأ');
  };

  const handleDelete = async (id) => {
    if (await confirmAction('حذف الحجز', 'هل أنت متأكد من حذف هذا الحجز نهائياً؟', 'حذف', true)) {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (!error) {
        setBookings(bookings.filter(b => b.id !== id));
        showSuccess('تم الحذف');
      } else showError('خطأ في الحذف');
    }
  };

  // تصفية الحجوزات بناءً على البحث
  const filteredBookings = bookings.filter(b => 
    b.booking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customer_phone?.includes(searchQuery)
  );

  useEffect(() => { fetchData(); }, []);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-black text-white">إدارة الحجوزات</h2>
          
          <input 
            type="text" 
            placeholder="بحث برقم الطلب، الاسم، أو الجوال..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-xl text-sm focus:border-amber-500 focus:outline-none"
          />

          <button onClick={fetchData} className="bg-slate-800 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-700">تحديث</button>
        </div>

        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl border-dashed">
              <span className="text-4xl mb-4">🔍</span>
              <h3 className="text-xl font-bold text-slate-300">لا توجد نتائج مطابقة</h3>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex flex-wrap justify-between items-center mb-6 border-b border-slate-800 pb-4 gap-4">
                  <div className="flex items-center gap-4">
                     <span className="text-xs text-slate-400">تاريخ الطلب: {new Date(b.created_at).toLocaleDateString('ar-SA')}</span>
                     <button 
                        onClick={() => copyToClipboard(b.booking_code, `${b.id}-code`)}
                        className="text-[10px] font-bold bg-slate-800 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 hover:bg-slate-700 transition-all"
                     >
                        {copiedId === `${b.id}-code` ? 'تم النسخ!' : (b.booking_code || 'بدون كود')}
                     </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <select value={b.status} onChange={(e) => handleUpdate(b.id, e.target.value)} 
                            className={`px-4 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${getStatusStyle(b.status)}`}>
                      <option value="بانتظار المراجعة">بانتظار المراجعة</option>
                      <option value="تمت المراجعة">تمت المراجعة</option>
                      <option value="مؤكد">مؤكد</option>
                      <option value="انتظار الدفع">انتظار الدفع</option>
                      <option value="ملغي">ملغي</option>
                    </select>
                    <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-500/20">حذف</button>
                  </div>
                </div>

                <div className="grid md:grid-cols-5 gap-4">
                  <CopyableText label="العميل" text={b.customer_name} id={`${b.id}-name`} />
                  <CopyableText label="الباقة" text={b.package_name} id={`${b.id}-pkg`} />
                  <CopyableText label="الهاتف" text={b.customer_phone} id={`${b.id}-phone`} />
                  <CopyableText label="البريد" text={b.customer_email || 'غير متوفر'} id={`${b.id}-email`} />
                  <CopyableText label="التاريخ والمناسبة" text={`${b.event_date} - ${b.event_city}`} id={`${b.id}-date`} />
                </div>

                {b.notes && (
                  <div className="mt-6 p-4 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer hover:border-slate-700" 
                       onClick={() => copyToClipboard(b.notes, `${b.id}-notes`)}>
                    <p className="text-[10px] text-amber-500 font-bold mb-1 uppercase">ملاحظات العميل {copiedId === `${b.id}-notes` && '(تم النسخ!)'}</p>
                    <p className="text-sm text-slate-300 italic">{b.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}