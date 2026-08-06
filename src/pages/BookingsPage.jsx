import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { showSuccess, showError, confirmAction } from '../utils/alerts';
import AdminLayout from '../components/AdminLayout';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [copiedId, setCopiedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false); // حالة تأثير زر التحديث

  // 🎨 ألوان الحالات الأصلية كما طلبته تماماً
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
      className="group cursor-pointer p-3 rounded-xl bg-brand-main border border-brand hover:border-brand-accent transition-all shadow-sm"
    >
      <p className="text-[10px] uppercase text-brand-muted font-bold mb-1">{label}</p>
      <p className={`text-xs font-medium ${copiedId === id ? 'text-brand-main font-bold' : 'text-brand-text'}`}>
        {copiedId === id ? 'تم النسخ!' : (text || 'غير متوفر')}
      </p>
    </div>
  );

  const fetchData = async () => {
    setIsRefreshing(true); // تفعيل تأثير التحميل عند الضغط
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    
    if (error) {
      showError('خطأ أثناء جلب الحجوزات');
      console.error(error);
    } else if (data) {
      setBookings(data);
    }
    
    // إيقاف تأثير التحميل بعد نصف ثانية ليوضح للمستخدم أن التحديث تم
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const handleUpdate = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (!error) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
      showSuccess('تم التحديث بنجاح');
    } else {
      showError('خطأ أثناء التحديث: ' + error.message);
    }
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

  const filteredBookings = bookings.filter(b => 
    b.booking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customer_phone?.includes(searchQuery)
  );

  useEffect(() => { fetchData(); }, []);

  const statuses = ['بانتظار المراجعة', 'تمت المراجعة', 'مؤكد', 'انتظار الدفع', 'ملغي'];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-black text-brand-main">إدارة الحجوزات مقسمة حسب الحالة</h2>
          
          <input 
            type="text" 
            placeholder="بحث برقم الطلب، الاسم، أو الجوال..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-brand-card border border-brand text-brand-text px-4 py-2 rounded-xl text-sm focus:outline-none shadow-sm"
          />

          {/* زر التحديث مع تأثير تفاعلي ودوران أيقونة */}
          <button 
            onClick={fetchData} 
            disabled={isRefreshing}
            className="bg-brand-card hover:bg-brand-card-hover border border-brand text-brand-text px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70"
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
        </div>

        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-brand-card border border-brand rounded-3xl border-dashed shadow-sm">
            <span className="text-4xl mb-4">🔍</span>
            <h3 className="text-xl font-bold text-brand-main">لا توجد نتائج مطابقة</h3>
          </div>
        ) : (
          <div className="space-y-10">
            {statuses.map((statusName) => {
              const sectionBookings = filteredBookings.filter(b => b.status === statusName);
              
              if (sectionBookings.length === 0) return null;

              return (
                <div key={statusName} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-brand pb-2">
                    <span className={`px-4 py-1 rounded-full text-xs font-black border ${getStatusStyle(statusName)}`}>
                      {statusName} ({sectionBookings.length})
                    </span>
                  </div>

                  <div className="space-y-4">
                    {sectionBookings.map((b) => (
                      <div key={b.id} className="bg-brand-card border border-brand rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="flex flex-wrap justify-between items-center mb-6 border-b border-brand pb-4 gap-4">
                          <div className="flex items-center gap-4">
                             <span className="text-xs text-brand-muted">تاريخ الطلب: {new Date(b.created_at).toLocaleDateString('ar-SA')}</span>
                             <button 
                               onClick={() => copyToClipboard(b.booking_code, `${b.id}-code`)}
                               className="text-[10px] font-bold bg-brand-main text-brand-text px-3 py-1 rounded-full border border-brand hover:bg-brand-card-hover transition-all shadow-sm"
                             >
                                {copiedId === `${b.id}-code` ? 'تم النسخ!' : (b.booking_code || 'بدون كود')}
                             </button>
                          </div>
                          
                          <div className="flex items-center gap-3 flex-wrap">
                            <select value={b.status} onChange={(e) => handleUpdate(b.id, e.target.value)} 
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${getStatusStyle(b.status)}`}>
                              <option value="بانتظار المراجعة">بانتظار المراجعة</option>
                              <option value="تمت المراجعة">تمت المراجعة</option>
                              <option value="مؤكد">مؤكد</option>
                              <option value="انتظار الدفع">انتظار الدفع</option>
                              <option value="ملغي">ملغي</option>
                            </select>

                            <button onClick={() => handleDelete(b.id)} className="text-red-700 hover:text-red-800 bg-brand-main px-3 py-1.5 rounded-lg text-xs font-bold border border-brand shadow-sm">حذف</button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-5 gap-4">
                          <CopyableText label="العميل" text={b.customer_name} id={`${b.id}-name`} />
                          <CopyableText label="الباقة والسعر" text={`${b.package_name} (${b.package_price} ر.س)`} id={`${b.id}-pkg`} />
                          <CopyableText label="الهاتف" text={b.customer_phone} id={`${b.id}-phone`} />
                          <CopyableText label="البريد" text={b.customer_email || 'غير متوفر'} id={`${b.id}-email`} />
                          <CopyableText label="التاريخ والمناسبة" text={`${b.event_date} - ${b.event_city}`} id={`${b.id}-date`} />
                        </div>

                        {b.notes && (
                          <div className="mt-6 p-4 bg-brand-main rounded-2xl border border-brand cursor-pointer hover:border-brand-accent shadow-sm transition-all" 
                               onClick={() => copyToClipboard(b.notes, `${b.id}-notes`)}>
                            <p className="text-[10px] text-brand-main font-bold mb-1 uppercase">ملاحظات العميل {copiedId === `${b.id}-notes` && '(تم النسخ!)'}</p>
                            <p className="text-sm text-brand-text italic">{b.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}